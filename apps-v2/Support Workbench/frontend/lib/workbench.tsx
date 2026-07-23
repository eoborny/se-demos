import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { NewTicketPrefill } from './types'

type WorkbenchContextValue = {
  selectedTicketId: number | null
  openTicket: (id: number) => void
  closeTicket: () => void
  newTicketOpen: boolean
  newTicketPrefill: NewTicketPrefill | null
  openNewTicket: (prefill?: NewTicketPrefill) => void
  closeNewTicket: () => void
  dataVersion: number
  refreshData: () => void
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null)

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [newTicketOpen, setNewTicketOpen] = useState(false)
  const [newTicketPrefill, setNewTicketPrefill] = useState<NewTicketPrefill | null>(null)
  const [dataVersion, setDataVersion] = useState(0)

  const openTicket = useCallback((id: number) => setSelectedTicketId(id), [])
  const closeTicket = useCallback(() => setSelectedTicketId(null), [])
  const refreshData = useCallback(() => setDataVersion((v) => v + 1), [])

  const openNewTicket = useCallback((prefill?: NewTicketPrefill) => {
    setNewTicketPrefill(prefill ?? null)
    setNewTicketOpen(true)
  }, [])
  const closeNewTicket = useCallback(() => {
    setNewTicketOpen(false)
    setNewTicketPrefill(null)
  }, [])

  const value = useMemo<WorkbenchContextValue>(
    () => ({
      selectedTicketId,
      openTicket,
      closeTicket,
      newTicketOpen,
      newTicketPrefill,
      openNewTicket,
      closeNewTicket,
      dataVersion,
      refreshData,
    }),
    [
      selectedTicketId,
      openTicket,
      closeTicket,
      newTicketOpen,
      newTicketPrefill,
      openNewTicket,
      closeNewTicket,
      dataVersion,
      refreshData,
    ],
  )

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>
}

export function useWorkbench(): WorkbenchContextValue {
  const ctx = useContext(WorkbenchContext)
  if (!ctx) throw new Error('useWorkbench must be used within WorkbenchProvider')
  return ctx
}
