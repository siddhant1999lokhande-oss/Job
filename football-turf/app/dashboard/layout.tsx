'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, BarChart2, User, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

type NavItem = { href: string; icon: React.ElementType; label: string; adminOnly?: boolean }

const playerNav: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/matches', icon: Calendar, label: 'Matches' },
  { href: '/profile/stats', icon: BarChart2, label: 'My Stats' },
  { href: '/profile', icon: User, label: 'Profile' },
]

const adminNav: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/matches', icon: Calendar, label: 'Matches' },
  { href: '/admin', icon: ShieldCheck, label: 'Admin', adminOnly: true },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('turfmate_user')
      if (stored) {
        const u = JSON.parse(stored)
        setIsAdmin(u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
      }
    } catch {}
  }, [])

  const navItems = isAdmin ? adminNav : playerNav

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="pb-20 min-h-screen">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800">
        <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, icon: Icon, label, adminOnly }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors relative',
                  isActive
                    ? adminOnly ? 'text-amber-400' : 'text-emerald-400'
                    : 'text-gray-500 hover:text-gray-300',
                )}
              >
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                <span className={cn(
                  'text-xs font-medium',
                  isActive ? (adminOnly ? 'text-amber-400' : 'text-emerald-400') : 'text-gray-500'
                )}>
                  {label}
                </span>
                {adminOnly && isAdmin && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
