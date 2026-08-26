import { CalendarClock, MapPin, Users } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Loader2 } from 'lucide-react'
import type { CenterDetail, CenterNote, TestCenter } from '../../data/types'
import { daysUntilSession, flagFor, utilization } from '../../utils/flagging'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../lib/shadcn/sheet'
import { ActionPanel } from './ActionPanel'
import { CHART } from './brand'
import { StatusBadge } from './StatusBadge'

interface CenterDetailDrawerProps {
  center: TestCenter | null
  open: boolean
  onOpenChange: (open: boolean) => void
  detail: CenterDetail | null
  detailLoading: boolean
  saving: boolean
  onAddNote: (note: Omit<CenterNote, 'id' | 'timestamp'>) => void
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ChartLoading() {
  return (
    <div className="flex h-[200px] items-center justify-center text-[#9AA1AB]">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  )
}

function InfoStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-[#E4E6E9] bg-white p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#1A212B]">{value}</p>
      {sub ? <p className="text-xs text-[#9AA1AB]">{sub}</p> : null}
    </div>
  )
}

export function CenterDetailDrawer({
  center,
  open,
  onOpenChange,
  detail,
  detailLoading,
  saving,
  onAddNote,
}: CenterDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto bg-[#F5F6F7] p-0 sm:max-w-xl"
      >
        {center ? (
          <DrawerBody
            center={center}
            detail={detail}
            detailLoading={detailLoading}
            saving={saving}
            onAddNote={onAddNote}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DrawerBody({
  center,
  detail,
  detailLoading,
  saving,
  onAddNote,
}: {
  center: TestCenter
  detail: CenterDetail | null
  detailLoading: boolean
  saving: boolean
  onAddNote: (note: Omit<CenterNote, 'id' | 'timestamp'>) => void
}) {
  const days = daysUntilSession(center)
  const util = Math.round(utilization(center) * 100)
  const staffPct = Math.min(
    100,
    Math.round((center.proctor_count / Math.max(1, center.proctor_required)) * 100),
  )
  const understaffed = center.proctor_count < center.proctor_required

  const trendData = (detail?.bookingTrend ?? []).map((p) => ({
    date: shortDate(p.date),
    seats: p.seats,
  }))
  const pastData = (detail?.pastSessions ?? []).map((p) => ({
    date: shortDate(p.date),
    fill: Math.round(p.fillRate * 100),
  }))
  const notes = detail?.notes ?? []

  return (
    <div>
      <SheetHeader className="border-b border-[#E4E6E9] bg-[#1A212B] p-5 text-left">
        <div className="flex items-center gap-2">
          <span className="rounded-sm bg-white/10 px-2 py-0.5 text-xs font-medium text-[#F2B733]">
            {center.test_program}
          </span>
          <StatusBadge flag={flagFor(center)} size="sm" />
        </div>
        <SheetTitle className="mt-2 text-white">{center.center_name}</SheetTitle>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#B7BDC6]">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {center.city}, {center.state}, {center.country}
          </span>
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {new Date(center.session_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            · {center.session_time}
          </span>
        </div>
      </SheetHeader>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-2">
          <InfoStat label="Utilization" value={`${util}%`} sub={`${center.seats_booked}/${center.capacity_total} seats`} />
          <InfoStat
            label="Days Out"
            value={days < 0 ? 'Past' : days === 0 ? 'Today' : `${days}d`}
            sub={center.status}
          />
          <InfoStat
            label="Open Seats"
            value={String(Math.max(0, center.capacity_total - center.seats_booked))}
            sub="remaining"
          />
        </div>

        {/* Booking trend */}
        <div className="rounded-md border border-[#E4E6E9] bg-white p-4">
          <h4 className="text-sm font-semibold text-[#1A212B]">Booking Trend</h4>
          <p className="mb-2 text-xs text-[#6B7280]">
            Seats filled over the weeks leading to the session
          </p>
          {detailLoading ? (
            <ChartLoading />
          ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="bookedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.booked} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART.booked} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEFF1" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9AA1AB' }} tickLine={false} axisLine={{ stroke: '#E4E6E9' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9AA1AB' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E4E6E9' }}
                formatter={(v) => [`${v} seats`, 'Booked']}
              />
              <ReferenceLine
                y={center.capacity_total}
                stroke={CHART.red}
                strokeDasharray="4 4"
                label={{ value: 'Capacity', fontSize: 10, fill: CHART.red, position: 'insideTopRight' }}
              />
              <Area
                type="monotone"
                dataKey="seats"
                stroke={CHART.booked}
                strokeWidth={2}
                fill="url(#bookedFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>

        {/* Staffing */}
        <div className="rounded-md border border-[#E4E6E9] bg-white p-4">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-[#1A212B]">
              <Users className="h-4 w-4" />
              Proctor Staffing
            </h4>
            <span
              className={
                'text-sm font-semibold ' + (understaffed ? 'text-[#B0463C]' : 'text-[#2C6B54]')
              }
            >
              {center.proctor_count} / {center.proctor_required}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#E7E9EC]">
            <div
              className="h-full rounded-full"
              style={{ width: `${staffPct}%`, backgroundColor: understaffed ? CHART.red : CHART.green }}
            />
          </div>
          <p className="mt-1.5 text-xs text-[#6B7280]">
            {understaffed
              ? `Short ${center.proctor_required - center.proctor_count} proctor(s) for required coverage.`
              : 'Fully staffed for required coverage.'}
          </p>
        </div>

        {/* Past sessions */}
        <div className="rounded-md border border-[#E4E6E9] bg-white p-4">
          <h4 className="text-sm font-semibold text-[#1A212B]">Past Session Fill Rates</h4>
          <p className="mb-2 text-xs text-[#6B7280]">Last 6 monthly sessions at this center</p>
          {detailLoading ? (
            <ChartLoading />
          ) : (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={pastData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEFF1" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9AA1AB' }} tickLine={false} axisLine={{ stroke: '#E4E6E9' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9AA1AB' }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(26,33,43,0.04)' }}
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E4E6E9' }}
                formatter={(v) => [`${v}%`, 'Filled']}
              />
              <Bar dataKey="fill" radius={[3, 3, 0, 0]}>
                {pastData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.fill >= 95 ? CHART.red : d.fill <= 25 ? CHART.gold : CHART.green}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>

        <ActionPanel center={center} notes={notes} saving={saving} onAddNote={onAddNote} />
      </div>
    </div>
  )
}
