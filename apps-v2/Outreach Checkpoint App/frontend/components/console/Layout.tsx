import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Inbox, ShieldCheck, BarChart3, ScrollText, SlidersHorizontal, ChevronDown, PanelLeftClose, PanelLeftOpen, BookMarked } from 'lucide-react'
import { cn } from '../../lib/shadcn/utils'
import { Brand } from './Brand'
import { useConsole } from '../../context/ConsoleContext'
import { PERSONAS, Role } from '../../lib/console/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../lib/shadcn/dropdown-menu'
import { Avatar, AvatarFallback } from '../../lib/shadcn/avatar'
import { Badge } from '../../lib/shadcn/badge'

type NavItem = { to: string; label: string; icon: typeof Inbox; roles: Role[] }

const NAV: NavItem[] = [
  { to: '/', label: 'Review Queue', icon: Inbox, roles: ['rep', 'manager', 'admin'] },
  { to: '/approvals', label: 'Sensitive Approvals', icon: ShieldCheck, roles: ['approver', 'admin'] },
  { to: '/analytics', label: 'Override Analytics', icon: BarChart3, roles: ['manager', 'admin', 'revops'] },
  { to: '/playbooks', label: 'Playbooks', icon: BookMarked, roles: ['manager', 'admin', 'revops'] },
  { to: '/audit', label: 'Audit Log', icon: ScrollText, roles: ['manager', 'admin', 'approver'] },
  { to: '/admin', label: 'Routing Rules', icon: SlidersHorizontal, roles: ['admin'] },
]

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export function Layout({ children }: { children: ReactNode }) {
  const { persona, setPersona, role } = useConsole()
  const location = useLocation()
  const visible = NAV.filter((n) => n.roles.includes(role))
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-border',
            collapsed ? 'justify-center px-0' : 'px-5'
          )}
        >
          <Brand compact={collapsed} />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {visible.map((item) => {
            const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={cn(
                  'flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : 'px-3',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>
        {!collapsed && (
          <div className="border-t border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
            AI-drafted outreach — reviewed, approved, and audited by your team.
          </div>
        )}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
            <div className="text-sm text-muted-foreground">
              Viewing as <span className="font-semibold text-foreground">{persona.roleLabel}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-left transition-colors hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                  {initials(persona.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-medium text-foreground">{persona.name}</div>
                <div className="text-[11px] text-muted-foreground">{persona.title}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Switch role (demo SSO)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PERSONAS.map((p) => (
                <DropdownMenuItem
                  key={p.name}
                  onClick={() => setPersona(p)}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="leading-tight">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.title}</div>
                  </div>
                  {p.name === persona.name && <Badge variant="outline" className="text-[10px]">Active</Badge>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
