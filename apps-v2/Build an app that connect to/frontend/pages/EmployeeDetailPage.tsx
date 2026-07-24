import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  UserCircle,
} from "lucide-react"
import { Button } from "../lib/shadcn/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../lib/shadcn/tabs"
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
import { OnboardingChecklist } from "../components/onboarding/OnboardingChecklist"
import { DocumentsPanel } from "../components/onboarding/DocumentsPanel"
import { useOnboarding } from "../store/OnboardingStore"
import { onboardingProgress } from "../data/onboarding"

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getEmployee,
    updateEmployee,
    toggleTask,
    addDocument,
    removeDocument,
  } = useOnboarding()
  const [editOpen, setEditOpen] = useState(false)

  const employee = id ? getEmployee(id) : undefined

  if (!employee) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserCircle className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Employee not found</EmptyTitle>
            <EmptyDescription>
              This employee may have been removed.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to employees
          </Button>
        </Empty>
      </div>
    )
  }

  const pct = onboardingProgress(employee)

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-2 text-muted-foreground"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        All employees
      </Button>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <EmployeeAvatar
            firstName={employee.firstName}
            lastName={employee.lastName}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl">
                {employee.firstName} {employee.lastName}
              </h1>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {employee.jobTitle} · {employee.department}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-full"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({employee.documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Work email"
              value={employee.email}
            />
            <InfoRow
              icon={<Briefcase className="h-4 w-4" />}
              label="Employment type"
              value={employee.employmentType}
            />
            <InfoRow
              icon={<Building2 className="h-4 w-4" />}
              label="Department"
              value={employee.department}
            />
            <InfoRow
              icon={<UserCircle className="h-4 w-4" />}
              label="Hiring manager"
              value={employee.manager}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Location"
              value={employee.location}
            />
            <InfoRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Start date"
              value={employee.startDate}
            />
          </div>
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Onboarding is{" "}
              <span className="font-medium text-foreground">{pct}%</span>{" "}
              complete with {employee.documents.length} document
              {employee.documents.length === 1 ? "" : "s"} on file.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-6">
            <OnboardingChecklist
              tasks={employee.tasks}
              onToggle={(taskId) => toggleTask(employee.id, taskId)}
            />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <DocumentsPanel
            documents={employee.documents}
            onUpload={(doc) => addDocument(employee.id, doc)}
            onRemove={(docId) => removeDocument(employee.id, docId)}
          />
        </TabsContent>
      </Tabs>

      <EmployeeFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={employee}
        onSubmit={(input) => updateEmployee(employee.id, input)}
      />
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
