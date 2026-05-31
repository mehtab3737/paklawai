'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import type { Session } from '@/types'

interface SessionItemProps {
  session: Session
  onDelete: (id: string) => void
}

export function SessionItem({ session, onDelete }: SessionItemProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === `/chat/${session.id}`

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' })
    onDelete(session.id)
    if (isActive) router.push('/chat')
  }

  return (
    <div
      className={`session-item ${isActive ? 'active' : ''}`}
      onClick={() => router.push(`/chat/${session.id}`)}
      id={`session-${session.id}`}
    >
      <span className="session-item-title">{session.title}</span>
      <button
        className="session-item-delete"
        onClick={handleDelete}
        title="Delete conversation"
        id={`delete-session-${session.id}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
