import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button } from '../lib/shadcn/button'
import { Skeleton } from '../lib/shadcn/skeleton'
import { KpiCards } from '../components/support/KpiCards'
import { DashboardCharts } from '../components/support/DashboardCharts'
import { InsightsPanel } from '../components/support/InsightsPanel'
import { useGetDashboardStats } from '../hooks/backend/support'
import type { DashboardStats } from '../utils/types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error, trigger } = useGetDashboardStats()
  const stats = data as DashboardStats | undefined

  useEffect(() => {
    trigger()
  }, [trigger])

  const goToTickets = (filter: Record<string, string>) => {
    const params = new URLSearchParams(filter)
    navigate(`/tickets?${params.toString()}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Support Overview</h1>
          <p className="text-sm text-muted-foreground">
            Team KPIs, workload, and where to focus next.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => trigger(undefined, { skipCache: true })}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : loading && !stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        </div>
      ) : stats ? (
        <>
          <KpiCards stats={stats} />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <DashboardCharts stats={stats} />
            </div>
            <InsightsPanel stats={stats} onAction={goToTickets} />
          </div>
        </>
      ) : null}
    </div>
  )
}
