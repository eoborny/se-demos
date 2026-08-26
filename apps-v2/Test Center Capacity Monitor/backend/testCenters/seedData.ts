// Deterministic seed data generator for the Test Center Capacity Monitor.
// Produces rows for the test_centers, booking_trend, and past_sessions tables.

export interface CenterRow {
  center_id: string
  center_name: string
  city: string
  state: string
  country: string
  test_program: string
  capacity_total: number
  seats_booked: number
  session_date: string
  session_time: string
  proctor_count: number
  proctor_required: number
  status: string
  lat: number
  lng: number
}

export interface TrendRow {
  center_id: string
  snapshot_date: string
  seats: number
}

export interface PastRow {
  center_id: string
  session_date: string
  fill_rate: number
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function iso(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

interface CitySeed {
  city: string
  state: string
  lat: number
  lng: number
}

const CITIES: CitySeed[] = [
  { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.006 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.074 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { city: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.797 },
  { city: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { city: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { city: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388 },
  { city: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { city: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.265 },
  { city: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { city: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  { city: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959 },
]

const PROGRAMS = ['TOEFL', 'GRE', 'Praxis', 'TOEIC']
const TIMES = ['08:00 AM', '11:30 AM', '01:00 PM', '03:30 PM']

export interface SeedResult {
  centers: CenterRow[]
  trend: TrendRow[]
  past: PastRow[]
}

export function generateSeed(): SeedResult {
  const rand = mulberry32(20240517)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)] as T

  const statusFor = (util: number, days: number): string => {
    if (days < 0) return 'Closed'
    if (util >= 0.95) return 'Overbooked Risk'
    if (util >= 0.8) return 'Nearly Full'
    return 'Open'
  }

  const centers: CenterRow[] = []
  const trend: TrendRow[] = []
  const past: PastRow[] = []

  let index = 0
  for (let ci = 0; ci < CITIES.length; ci++) {
    const seed = CITIES[ci] as CitySeed
    const count = 1 + Math.floor(rand() * 2)
    for (let j = 0; j < count; j++) {
      const program = pick(PROGRAMS)
      const capacity = pick([24, 30, 36, 40, 48, 60])
      const roll = rand()
      let util: number
      if (roll < 0.22) util = 0.95 + rand() * 0.08
      else if (roll < 0.42) util = rand() * 0.24
      else util = 0.3 + rand() * 0.6

      const seatsBooked = Math.min(
        Math.round(capacity * 1.05),
        Math.max(0, Math.round(capacity * util)),
      )
      const dayOffset = pick([2, 3, 4, 5, 6, 7, 9, 12, 15, 18, 21, 28, -6, -14])
      const sessionDate = addDays(new Date(), dayOffset)
      const realUtil = seatsBooked / capacity
      const proctorRequired = Math.max(2, Math.ceil(capacity / 12))
      const proctorCount = Math.max(
        1,
        proctorRequired - (rand() < 0.35 ? pick([1, 1, 2]) : 0),
      )
      const centerId = `ETS-${1000 + index}`

      centers.push({
        center_id: centerId,
        center_name: `${seed.city} ${program} Center ${(index % 3) + 1}`,
        city: seed.city,
        state: seed.state,
        country: 'USA',
        test_program: program,
        capacity_total: capacity,
        seats_booked: seatsBooked,
        session_date: iso(sessionDate),
        session_time: pick(TIMES),
        proctor_count: proctorCount,
        proctor_required: proctorRequired,
        status: statusFor(realUtil, dayOffset),
        lat: seed.lat,
        lng: seed.lng,
      })

      // booking trend: 9 weekly snapshots ramping to seatsBooked
      const weeks = 8
      for (let i = weeks; i >= 0; i--) {
        const d = addDays(sessionDate, -i * 7)
        const progress = 1 - i / weeks
        const eased = Math.pow(progress, 1.4)
        const jitter = 0.94 + rand() * 0.12
        let seats = Math.min(seatsBooked, Math.round(seatsBooked * eased * jitter))
        if (i === 0) seats = seatsBooked
        trend.push({ center_id: centerId, snapshot_date: iso(d), seats: Math.max(0, seats) })
      }

      // past sessions: 6 monthly fill rates
      for (let i = 6; i >= 1; i--) {
        const d = addDays(sessionDate, -i * 30)
        const fill = Math.min(1, Number((0.45 + rand() * 0.55).toFixed(2)))
        past.push({ center_id: centerId, session_date: iso(d), fill_rate: fill })
      }

      index++
    }
  }

  return { centers, trend, past }
}
