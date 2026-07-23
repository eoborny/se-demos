import { useState } from 'react'
import { LayoutDashboard, Building2, Users, BarChart3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './lib/cursorTheme.css'
import { C } from './lib/cursor'
import { WorkbenchProvider } from './lib/workbench'
import { Toaster } from './lib/shadcn/sonner'
import { AppHeader } from './components/AppHeader'
import { TicketDetailDrawer } from './components/TicketDetailDrawer'
import { NewTicketModal } from './components/NewTicketModal'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import CustomerLookup from './pages/CustomerLookup'
import EmployeeLookup from './pages/EmployeeLookup'

type TabKey = 'dashboard' | 'analytics' | 'customers' | 'employees'

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'customers', label: 'Customer Lookup', icon: Building2 },
  { key: 'employees', label: 'Employee Lookup', icon: Users },
]

export default function App() {
  const [tab, setTab] = useState<TabKey>('dashboard')

  return (
    <WorkbenchProvider>
      <div className="cursor-workbench min-h-screen w-full flex flex-col" style={{ backgroundColor: C.bg }}>
        <AppHeader />

        <nav
          className="flex items-center gap-1 px-6 border-b"
          style={{ backgroundColor: C.surface, borderColor: C.border }}
          aria-label="Primary"
        >
          {TABS.map((t) => {
            const active = t.key === tab
            const Icon = t.icon
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className="inline-flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors"
                style={{
                  borderColor: active ? C.orange : 'transparent',
                  color: active ? C.text : C.muted,
                }}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </nav>

        <main className="flex-1 overflow-y-auto cursor-scroll px-6 py-6">
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'analytics' && <Analytics />}
          {tab === 'customers' && <CustomerLookup />}
          {tab === 'employees' && <EmployeeLookup />}
        </main>

        <TicketDetailDrawer />
        <NewTicketModal />
        <Toaster position="bottom-right" richColors />
      </div>
    </WorkbenchProvider>
  )
}
