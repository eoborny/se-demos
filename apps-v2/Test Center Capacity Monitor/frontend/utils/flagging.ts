import type { FlagLevel, TestCenter } from '../data/types'

export function utilization(center: TestCenter): number {
  if (center.capacity_total <= 0) return 0
  return center.seats_booked / center.capacity_total
}

/** Whole days from today (local midnight) until the session date. Negative if past. */
export function daysUntilSession(center: TestCenter): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const session = new Date(center.session_date)
  session.setHours(0, 0, 0, 0)
  const ms = session.getTime() - today.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

/**
 * Flagging logic:
 * - overbooked: booked >= 95% of capacity
 * - underbooked: booked <= 25% of capacity within 7 days of session
 * - healthy: everything else
 */
export function flagFor(center: TestCenter): FlagLevel {
  const util = utilization(center)
  if (util >= 0.95) return 'overbooked'
  const days = daysUntilSession(center)
  if (util <= 0.25 && days >= 0 && days <= 7) return 'underbooked'
  return 'healthy'
}

export function isAtRisk(center: TestCenter): boolean {
  return flagFor(center) !== 'healthy'
}

export const FLAG_META: Record<
  FlagLevel,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  overbooked: {
    label: 'Overbooked Risk',
    dot: '#C0564B',
    text: '#8F3A31',
    bg: 'rgba(192, 86, 75, 0.10)',
    border: 'rgba(192, 86, 75, 0.35)',
  },
  underbooked: {
    label: 'Underbooked',
    dot: '#D4A029',
    text: '#8A6410',
    bg: 'rgba(212, 160, 41, 0.12)',
    border: 'rgba(212, 160, 41, 0.35)',
  },
  healthy: {
    label: 'Healthy',
    dot: '#3F9877',
    text: '#2C6B54',
    bg: 'rgba(63, 152, 119, 0.10)',
    border: 'rgba(63, 152, 119, 0.30)',
  },
}
