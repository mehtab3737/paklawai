import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { queryPinecone } from '@/lib/pinecone'
import { buildSystemPrompt } from '@/lib/openai'
import type { ChatMessage, Source } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    message: string
    sessionId: string
    history: ChatMessage[]
  }

  const { message, sessionId, history } = body

  // Verify session ownership
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if this is the first message
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  const isFirstMessage = count === 0

  // RAG: query Pinecone
  let sources: Source[] = []
  try {
    sources = await queryPinecone(message, 5)
  } catch (e) {
    console.error('Pinecone query failed:', e)
  }

  const contextChunks = sources.map((s) => `[${s.source} - ${s.section}]\n${s.text}`)
  const systemPrompt = buildSystemPrompt(contextChunks)

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
    max_tokens: 1000,
    temperature: 0.1,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = ''
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullContent += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
      } catch (e) {
        console.error('Streaming error:', e)
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }

      // Background: save messages + update title
      const adminSupabase = await createAdminClient()

      Promise.all([
        adminSupabase.from('messages').insert({
          session_id: sessionId,
          role: 'user',
          content: message,
        }),
        adminSupabase.from('messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: fullContent,
          sources: sources.length > 0 ? sources : null,
        }),
        adminSupabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId),
      ]).catch(console.error)

      if (isFirstMessage && fullContent) {
        openai.chat.completions
          .create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: `Summarize in 5 words or less: ${message}` }],
            max_tokens: 20,
            temperature: 0.3,
          })
          .then((res) => {
            const title = res.choices[0]?.message?.content?.trim() ?? 'New conversation'
            return adminSupabase
              .from('chat_sessions')
              .update({ title })
              .eq('id', sessionId)
          })
          .catch(console.error)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Sources': JSON.stringify(sources),
    },
  })
}
