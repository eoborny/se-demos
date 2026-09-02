import { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import { PERSONAS, Persona, Role } from '../lib/console/types'

type ConsoleContextValue = {
  persona: Persona
  setPersona: (p: Persona) => void
  role: Role
  actor: string
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null)

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const firstPersona = PERSONAS[0] as Persona
  const [persona, setPersona] = useState<Persona>(firstPersona)

  const value = useMemo<ConsoleContextValue>(
    () => ({ persona, setPersona, role: persona.role, actor: persona.name }),
    [persona]
  )

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>
}

export function useConsole(): ConsoleContextValue {
  const ctx = useContext(ConsoleContext)
  if (!ctx) throw new Error('useConsole must be used within ConsoleProvider')
  return ctx
}
