'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAdminGuard() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.replace('/login'); return }

    try {
      const stored = localStorage.getItem('turfmate_user')
      if (stored) {
        const u = JSON.parse(stored)
        if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') {
          setIsAdmin(true)
          setReady(true)
          return
        }
      }
    } catch {}

    // Not admin → bounce back to dashboard silently
    router.replace('/dashboard')
  }, [router])

  return { ready, isAdmin }
}
