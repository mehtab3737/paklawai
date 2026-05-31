'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SessionList } from './SessionList'
import { getInitials } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleNewChat() {
    router.push('/chat')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">⚖️</span>
          <span>PakLaw AI</span>
        </div>
        <button className="btn-new-chat" onClick={handleNewChat} id="new-chat-btn">
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="sidebar-sessions">
        <SessionList />
      </div>

      <div className="sidebar-footer">
        <div className="avatar" title={user.email}>
          {getInitials(user.email ?? 'U')}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-email">{user.email}</div>
        </div>
        <button
          className="btn-signout"
          onClick={handleSignOut}
          title="Sign out"
          id="signout-btn"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
