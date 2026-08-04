import { C } from '../lib/cursor'
import { useCurrentUser } from '../hooks/useCurrentUser'

export function AppHeader() {
  const { user } = useCurrentUser()

  return (
    <header
      className="flex items-center justify-between gap-4 px-6 py-4 border-b"
      style={{ backgroundColor: C.surface, borderColor: C.border }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold"
          style={{ backgroundColor: C.orange, color: C.surface }}
          aria-hidden="true"
        >
          S
        </div>
        <div className="leading-tight">
          <div className="text-lg font-semibold tracking-tight" style={{ color: C.text }}>
            Stripe
          </div>
          <div className="text-xs font-medium" style={{ color: C.muted }}>
            Support Workbench
          </div>
        </div>
      </div>

      {user && (
        <div
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
          style={{ backgroundColor: C.bgSecondary, color: C.text }}
          title={user.email}
          aria-label={`Signed in as ${user.fullName || user.email}`}
        >
          {(user.firstName?.[0] ?? user.email[0] ?? '?').toUpperCase()}
        </div>
      )}
    </header>
  )
}
