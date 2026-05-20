'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, BarChart2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/matches', icon: Calendar, label: 'Matches' },
  { href: '/profile/stats', icon: BarChart2, label: 'My Stats' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="pb-20 min-h-screen">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 safe-area-pb">
        <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors',
                  isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300',
                )}
              >
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                <span className={cn('text-xs font-medium', isActive ? 'text-emerald-400' : 'text-gray-500')}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
