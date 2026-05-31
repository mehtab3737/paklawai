'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { generateId } from '@/lib/utils'
import type { Message, Source } from '@/types'

const SUGGESTIONS = [
  'What are my rights if arrested?',
  'How do I file a civil suit in court?',
  'Explain Section 302 of PPC',
  'What is the bail process in Pakistan?',
]

interface ChatInterfaceProps {
  sessionId: string | null
  initialMessages: Message[]
}

export function ChatInterface({ sessionId, initialMessages }: ChatInterfaceProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [streamingContent, setStreamingContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId)

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading) return

    // Optimistically add user message
    const userMsg: Message = {
      id: generateId(),
      session_id: currentSessionId ?? '',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    setStreamingContent('')

    try {
      // Create session if needed
      let activeSessionId = currentSessionId
      if (!activeSessionId) {
        const res = await fetch('/api/sessions', { method: 'POST' })
        const newSession = await res.json()
        activeSessionId = newSession.id
        setCurrentSessionId(activeSessionId)
        router.replace(`/chat/${activeSessionId}`, { scroll: false })
      }

      const history = messages.map((m) => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: activeSessionId,
          history,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const sourcesHeader = response.headers.get('X-Sources')
      const sources: Source[] = sourcesHeader ? JSON.parse(sourcesHeader) : []

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            const assistantMsg: Message = {
              id: generateId(),
              session_id: activeSessionId!,
              role: 'assistant',
              content: fullContent,
              sources,
              created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, assistantMsg])
            setStreamingContent('')
          } else {
            try {
              const parsed = JSON.parse(data) as { text: string }
              fullContent += parsed.text
              setStreamingContent(fullContent)
            } catch {}
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          session_id: currentSessionId ?? '',
          role: 'assistant',
          content: '__error__',
          created_at: new Date().toISOString(),
        },
      ])
      setStreamingContent('')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, currentSessionId, messages, router])

  const hasMessages = messages.length > 0 || isLoading

  return (
    <>
      {!hasMessages ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚖️</div>
          <h1 className="empty-state-title">Pakistan&apos;s Legal AI Assistant</h1>
          <p className="empty-state-subtitle">
            Ask anything about Pakistani law — Constitution, PPC, CPC, family law, property law, and more.
          </p>
          <div className="suggestion-chips">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                className="suggestion-chip"
                onClick={() => sendMessage(suggestion)}
                id={`suggestion-${suggestion.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isLoading={isLoading}
        />
      )}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </>
  )
}
