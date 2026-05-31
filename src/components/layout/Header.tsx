'use client'

import { useRouter } from 'next/navigation'
import { Menu, Plus } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  return (
    <header className="mobile-header">
      <button
        onClick={onMenuClick}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        id="mobile-menu-btn"
      >
        <Menu size={20} />
      </button>
      <span className="mobile-header-title">⚖️ PakLaw AI</span>
      <button
        onClick={() => router.push('/chat')}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        id="mobile-new-chat-btn"
      >
        <Plus size={20} />
      </button>
    </header>
  )
}
