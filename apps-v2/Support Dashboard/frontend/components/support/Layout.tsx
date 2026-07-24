import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Ticket, LifeBuoy } from 'lucide-react'
import { cn } from '../../lib/shadcn/utils'
import { useCurrentUser } from '../../hooks/useCurrentUser'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tickets', label: 'Tickets', icon: Ticket, end: false },
]

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser()
  const initials =
    user?.fullName
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm">Support</div>
            <div className="text-xs text-muted-foreground">Dashboard</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.fullName ?? 'Support Manager'}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top nav */}
        <div className="md:hidden flex items-center gap-4 px-4 h-14 border-b border-border bg-card">
          <div className="flex items-center gap-2 font-semibold">
            <LifeBuoy className="w-5 h-5 text-primary" /> Support
          </div>
          <nav className="flex gap-3 ml-auto text-sm">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn('font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
