import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../lib/shadcn/dialog"
import { Button } from "../../lib/shadcn/button"
import { Input } from "../../lib/shadcn/input"
import { Label } from "../../lib/shadcn/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../lib/shadcn/select"
import {
  DEPARTMENTS,
  EMPLOYMENT_TYPES,
  HIRING_STATUSES,
  LOCATIONS,
  type Employee,
} from "../../data/onboarding"
import type { EmployeeInput } from "../../store/OnboardingStore"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: EmployeeInput) => void
  initial?: Employee
}

const EMPTY: EmployeeInput = {
  firstName: "",
  lastName: "",
  email: "",
  department: "Engineering",
  jobTitle: "",
  manager: "",
  location: "Remote - US",
  employmentType: "Full-time",
  startDate: new Date().toISOString().slice(0, 10),
  status: "Offer Accepted",
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initial,
}: Props) {
  const [form, setForm] = useState<EmployeeInput>(EMPTY)

  useEffect(() => {
    if (!open) return
    if (initial) {
      const { id: _id, tasks: _t, documents: _d, ...rest } = initial
      setForm(rest)
    } else {
      setForm(EMPTY)
    }
  }, [open, initial])

  const set = <K extends keyof EmployeeInput>(key: K, val: EmployeeInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.jobTitle.trim() &&
    form.manager.trim()

  const handleSubmit = () => {
    if (!valid) return
    onSubmit(form)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initial ? "Edit employee" : "Add new hire"}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the employee's hiring details."
              : "Enter the new hire's details to start onboarding."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="Ava"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Nguyen"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="ava.nguyen@acme.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              value={form.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)}
              placeholder="Senior Software Engineer"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manager">Hiring manager</Label>
            <Input
              id="manager"
              value={form.manager}
              onChange={(e) => set("manager", e.target.value)}
              placeholder="Daniel Cho"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select
              value={form.department}
              onValueChange={(v) => set("department", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select
              value={form.location}
              onValueChange={(v) => set("location", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Employment type</Label>
            <Select
              value={form.employmentType}
              onValueChange={(v) =>
                set("employmentType", v as EmployeeInput["employmentType"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Hiring status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                set("status", v as EmployeeInput["status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HIRING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-full"
            onClick={handleSubmit}
            disabled={!valid}
          >
            {initial ? "Save changes" : "Add new hire"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
