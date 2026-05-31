'use client'

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sources = message.sources ?? []

  if (message.role === 'user') {
    return (
      <div className="message-row user">
        <div className="message-bubble user" ref={textRef}>
          {message.content}
          <button
            className="copy-btn"
            onClick={handleCopy}
            title="Copy message"
            id={`copy-user-${message.id}`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>
    )
  }

  if (message.content === '__error__') {
    return (
      <div className="message-row assistant">
        <div className="message-bubble error">
          ⚠️ Something went wrong. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="message-row assistant">
      <div className="message-bubble assistant" ref={textRef}>
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {sources.length > 0 && (
          <div>
            <button
              className="sources-toggle"
              onClick={() => setSourcesOpen(!sourcesOpen)}
              id={`sources-toggle-${message.id}`}
            >
              {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              View sources ({sources.length})
            </button>
            {sourcesOpen && (
              <div className="sources-list">
                {sources.map((src, i) => (
                  <div key={i} className="source-item">
                    <strong>{src.source}</strong>
                    {src.section && ` — ${src.section}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          className="copy-btn"
          onClick={handleCopy}
          title="Copy message"
          id={`copy-ai-${message.id}`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
