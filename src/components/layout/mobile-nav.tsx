'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowRightLeft,
  TrendingUp,
  PiggyBank,
  MoreHorizontal,
} from 'lucide-react'

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Transactions', href: '/transactions', icon: ArrowRightLeft },
  { title: 'Investments', href: '/investments', icon: TrendingUp },
  { title: 'Budgets', href: '/budgets', icon: PiggyBank },
  { title: 'More', href: '/more', icon: MoreHorizontal },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t pb-safe">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/more' && pathname.startsWith(`${item.href}/`)) ||
            (item.href === '/more' && ['/accounts', '/categories', '/goals', '/analytics', '/settings'].some(p => pathname.startsWith(p)))

          return (
            <Link
              key={item.href}
              href={item.href === '/more' ? '/settings' : item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors touch-target',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
