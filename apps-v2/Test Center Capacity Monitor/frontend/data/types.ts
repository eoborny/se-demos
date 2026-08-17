export type TestProgram = 'TOEFL' | 'GRE' | 'Praxis' | 'TOEIC'

export type CenterStatus = 'Open' | 'Nearly Full' | 'Overbooked Risk' | 'Closed'

export type FlagLevel = 'overbooked' | 'underbooked' | 'healthy'

export interface BookingPoint {
  /** ISO date */
  date: string
  seats: number
}

export interface PastSession {
  /** ISO date */
  date: string
  /** 0-1 fill rate */
  fillRate: number
}

export interface TestCenter {
  center_id: string
  center_name: string
  city: string
  state: string
  country: string
  test_program: TestProgram
  capacity_total: number
  seats_booked: number
  /** ISO date */
  session_date: string
  session_time: string
  proctor_count: number
  proctor_required: number
  status: CenterStatus
  lat: number
  lng: number
}

export interface CenterNote {
  id: string
  centerId: string
  author: string
  timestamp: string
  kind: 'note' | 'capacity_increase' | 'reassignment'
  text: string
}

export interface CenterDetail {
  bookingTrend: BookingPoint[]
  pastSessions: PastSession[]
  notes: CenterNote[]
}
