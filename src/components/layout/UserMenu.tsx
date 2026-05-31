'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface UserMenuProps {
  email: string
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="avatar">{getInitials(email)}</div>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>{email}</span>
      <button className="btn-signout" onClick={handleSignOut} title="Sign out" id="user-menu-signout">
        <LogOut size={14} />
      </button>
    </div>
  )
}
