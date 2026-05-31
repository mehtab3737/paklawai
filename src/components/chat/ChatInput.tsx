'use client'

import { useRef, useEffect, useState, KeyboardEvent, ChangeEvent } from 'react'
import { ArrowUp } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 144)}px`
  }, [value])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const charCount = value.length
  const isEmpty = value.trim().length === 0

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-container">
        <textarea
          id="chat-textarea"
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Ask about Pakistani law…"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        {charCount > 500 && (
          <span className="char-count">{charCount}</span>
        )}
        <button
          id="chat-send-btn"
          className="chat-send-btn"
          onClick={submit}
          disabled={disabled || isEmpty}
          title="Send message"
        >
          <ArrowUp size={18} />
        </button>
      </div>
      <p className="chat-footer-text">
        PakLaw AI may make mistakes. Always verify legal information with a qualified lawyer.
      </p>
    </div>
  )
}
