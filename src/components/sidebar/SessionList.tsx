'use client'

import { useState, useEffect } from 'react'
import { SessionItem } from './SessionItem'
import { formatDate } from '@/lib/utils'
import type { Session } from '@/types'

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load() {
    setError(false)
    setLoading(true)
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSessions(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleDelete(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  if (loading) {
    return (
      <div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="skeleton skeleton-line"
            style={{ width: `${70 + Math.random() * 25}%` }}
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-hint)', marginBottom: '8px' }}>
          Failed to load conversations
        </p>
        <button
          onClick={load}
          style={{
            fontSize: '12px',
            color: 'var(--accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          id="retry-sessions"
        >
          Retry
        </button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <p style={{ padding: '16px', fontSize: '12px', color: 'var(--text-hint)' }}>
        No conversations yet
      </p>
    )
  }

  const groups: Record<string, Session[]> = {}
  sessions.forEach((s) => {
    const label = formatDate(s.updated_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(s)
  })

  const order = ['Today', 'Yesterday', 'Last 7 days', 'Older']

  return (
    <div>
      {order
        .filter((label) => groups[label]?.length)
        .map((label) => (
          <div key={label}>
            <div className="session-group-label">{label}</div>
            {groups[label].map((session) => (
              <SessionItem key={session.id} session={session} onDelete={handleDelete} />
            ))}
          </div>
        ))}
    </div>
  )
}
