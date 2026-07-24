import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, UserPlus, Users } from "lucide-react"
import { Button } from "../lib/shadcn/button"
import { Input } from "../lib/shadcn/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../lib/shadcn/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../lib/shadcn/table"
import { Progress } from "../lib/shadcn/progress"
import { Skeleton } from "../lib/shadcn/skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../lib/shadcn/empty"
import { EmployeeAvatar } from "../components/onboarding/EmployeeAvatar"
import { StatusBadge } from "../components/onboarding/StatusBadge"
import { EmployeeFormDialog } from "../components/onboarding/EmployeeFormDialog"
import { useOnboarding } from "../store/OnboardingStore"
import {
  DEPARTMENTS,
  HIRING_STATUSES,
  onboardingProgress,
} from "../data/onboarding"

export default function EmployeesPage() {
  const navigate = useNavigate()
  const { employees, addEmployee } = useOnboarding()
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [dept, setDept] = useState("all")
  const [status, setStatus] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return employees.filter((e) => {
      const matchesQuery =
        !q ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q)
      const matchesDept = dept === "all" || e.department === dept
      const matchesStatus = status === "all" || e.status === status
      return matchesQuery && matchesDept && matchesStatus
    })
  }, [employees, query, dept, status])

  const stats = useMemo(() => {
    const onboarding = employees.filter(
      (e) => e.status !== "Active",
    ).length
    const active = employees.filter((e) => e.status === "Active").length
    const avg = employees.length
      ? Math.round(
          employees.reduce((sum, e) => sum + onboardingProgress(e), 0) /
            employees.length,
        )
      : 0
    return { total: employees.length, onboarding, active, avg }
  }, [employees])

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl">Hiring &amp; Onboarding</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track new hires, onboarding progress and documents.
          </p>
        </div>
        <Button
          className="gap-2 rounded-full bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add new hire
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total employees" value={stats.total} />
        <StatCard label="In onboarding" value={stats.onboarding} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Avg. progress" value={`${stats.avg}%`} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or title..."
            className="pl-9"
          />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {HIRING_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {employees.length === 0 ? (
                  <UserPlus className="h-6 w-6" />
                ) : (
                  <Users className="h-6 w-6" />
                )}
              </EmptyMedia>
              <EmptyTitle>
                {employees.length === 0
                  ? "No employees yet"
                  : "No matches found"}
              </EmptyTitle>
              <EmptyDescription>
                {employees.length === 0
                  ? "Add your first new hire to begin onboarding."
                  : "Try adjusting your search or filters."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Start date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-48">Onboarding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => {
                const pct = onboardingProgress(e)
                return (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/employees/${e.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EmployeeAvatar
                          firstName={e.firstName}
                          lastName={e.lastName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-medium">
                            {e.firstName} {e.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {e.jobTitle}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.department}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.startDate}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={e.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-2" />
                        <span className="w-9 shrink-0 text-right text-xs text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(input) => {
          const created = addEmployee(input)
          navigate(`/employees/${created.id}`)
        }}
      />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-retool-sm">
      <p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </p>
      <p className="font-display mt-2 text-3xl">{value}</p>
    </div>
  )
}
