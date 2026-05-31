'use client'

import { useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import type { Message } from '@/types'

interface MessageListProps {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
}

export function MessageList({ messages, streamingContent, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, isLoading])

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {streamingContent && (
        <MessageBubble
          message={{
            id: 'streaming',
            session_id: '',
            role: 'assistant',
            content: streamingContent,
            created_at: new Date().toISOString(),
          }}
        />
      )}
      {isLoading && !streamingContent && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
