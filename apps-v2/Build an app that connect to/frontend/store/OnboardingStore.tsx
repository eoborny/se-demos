import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import {
  MOCK_EMPLOYEES,
  buildDefaultTasks,
  type Employee,
  type EmployeeDocument,
} from "../data/onboarding"

export type EmployeeInput = Omit<Employee, "id" | "tasks" | "documents">

interface OnboardingContextValue {
  employees: Employee[]
  getEmployee: (id: string) => Employee | undefined
  addEmployee: (input: EmployeeInput) => Employee
  updateEmployee: (id: string, input: EmployeeInput) => void
  toggleTask: (employeeId: string, taskId: string) => void
  addDocument: (
    employeeId: string,
    doc: Omit<EmployeeDocument, "id" | "uploadedAt">,
  ) => void
  removeDocument: (employeeId: string, docId: string) => void
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES)

  const value = useMemo<OnboardingContextValue>(() => {
    return {
      employees,
      getEmployee: (id) => employees.find((e) => e.id === id),
      addEmployee: (input) => {
        const employee: Employee = {
          ...input,
          id: genId("emp"),
          tasks: buildDefaultTasks(),
          documents: [],
        }
        setEmployees((prev) => [employee, ...prev])
        return employee
      },
      updateEmployee: (id, input) => {
        setEmployees((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...input } : e)),
        )
      },
      toggleTask: (employeeId, taskId) => {
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === employeeId
              ? {
                  ...e,
                  tasks: e.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t,
                  ),
                }
              : e,
          ),
        )
      },
      addDocument: (employeeId, doc) => {
        const newDoc: EmployeeDocument = {
          ...doc,
          id: genId("doc"),
          uploadedAt: new Date().toISOString().slice(0, 10),
        }
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === employeeId
              ? { ...e, documents: [newDoc, ...e.documents] }
              : e,
          ),
        )
      },
      removeDocument: (employeeId, docId) => {
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === employeeId
              ? { ...e, documents: e.documents.filter((d) => d.id !== docId) }
              : e,
          ),
        )
      },
    }
  }, [employees])

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider")
  }
  return ctx
}
