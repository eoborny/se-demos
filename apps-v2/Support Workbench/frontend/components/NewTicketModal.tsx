import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../lib/shadcn/dialog'
import { Input } from '../lib/shadcn/input'
import { Textarea } from '../lib/shadcn/textarea'
import { Label } from '../lib/shadcn/label'
import { NativeSelect } from '../lib/shadcn/native-select'
import { toast } from '../lib/shadcn/sonner'
import {
  useInsertTicket,
  useSearchCustomers,
  useSearchEmployees,
} from '../hooks/backend/support'
import {
  ALL_CATEGORIES,
  ALL_PRIORITIES,
  C,
  PLAN_TIERS,
  SOURCE_CHANNELS,
  slaHoursForPriority,
} from '../lib/cursor'
import type { CustomerRow, EmployeeRow } from '../lib/types'
import { useWorkbench } from '../lib/workbench'

const inputStyle = { backgroundColor: C.surface, borderColor: C.border, color: C.text }

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-full border p-0.5" style={{ borderColor: C.border, backgroundColor: C.bgSecondary }}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: active ? C.orange : 'transparent',
              color: active ? '#fff' : C.muted,
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function NewTicketModal() {
  const { newTicketOpen, newTicketPrefill, closeNewTicket, openTicket, refreshData } = useWorkbench()

  const [ticketType, setTicketType] = useState<'external' | 'internal'>('external')
  const [contactMode, setContactMode] = useState<'existing' | 'new'>('existing')
  const [query, setQuery] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string>('')

  // New contact fields
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newPlan, setNewPlan] = useState('Pro')
  const [newAccountId, setNewAccountId] = useState('')
  const [newDept, setNewDept] = useState('')
  const [newManager, setNewManager] = useState('')
  const [newLocation, setNewLocation] = useState('')

  // Ticket fields
  const [category, setCategory] = useState<string>('Bug')
  const [priority, setPriority] = useState<string>('Medium')
  const [sourceChannel, setSourceChannel] = useState<string>('Email')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const insertFn = useInsertTicket()
  const custFn = useSearchCustomers()
  const empFn = useSearchEmployees()

  const resetForm = () => {
    setContactMode('existing')
    setQuery('')
    setSelectedContactId('')
    setNewEmail('')
    setNewName('')
    setNewCompany('')
    setNewPlan('Pro')
    setNewAccountId('')
    setNewDept('')
    setNewManager('')
    setNewLocation('')
    setCategory('Bug')
    setPriority('Medium')
    setSourceChannel('Email')
    setSubject('')
    setDescription('')
  }

  // Apply prefill when opening
  useEffect(() => {
    if (!newTicketOpen) return
    resetForm()
    const type = newTicketPrefill?.ticketType ?? 'external'
    setTicketType(type)
    if (newTicketPrefill?.customerId) {
      setSelectedContactId(String(newTicketPrefill.customerId))
    } else if (newTicketPrefill?.employeeId) {
      setSelectedContactId(String(newTicketPrefill.employeeId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTicketOpen])

  // Search when query or type changes (existing mode)
  useEffect(() => {
    if (!newTicketOpen || contactMode !== 'existing') return
    if (ticketType === 'external') void custFn.trigger({ query })
    else void empFn.trigger({ query })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ticketType, contactMode, newTicketOpen])

  const customers = (custFn.data as CustomerRow[] | undefined) ?? []
  const employees = (empFn.data as EmployeeRow[] | undefined) ?? []

  const contactList = useMemo(() => {
    if (ticketType === 'external')
      return customers.map((c) => ({ id: c.id, label: `${c.name} · ${c.company ?? c.email}` }))
    return employees.map((e) => ({ id: e.id, label: `${e.name} · ${e.department ?? e.email}` }))
  }, [ticketType, customers, employees])

  const canSubmit = useMemo(() => {
    if (!subject.trim()) return false
    if (contactMode === 'existing') return !!selectedContactId
    return !!newEmail.trim() && !!newName.trim()
  }, [subject, contactMode, selectedContactId, newEmail, newName])

  const submit = async () => {
    if (!canSubmit) return
    const base: Record<string, unknown> = {
      ticket_type: ticketType,
      category,
      priority,
      subject: subject.trim(),
      description: description.trim() || null,
    }
    if (ticketType === 'external') base['source_channel'] = sourceChannel

    if (contactMode === 'existing') {
      const idNum = Number(selectedContactId)
      if (ticketType === 'external') base['customer_id'] = idNum
      else base['employee_id'] = idNum
    } else if (ticketType === 'external') {
      base['new_customer'] = {
        email: newEmail.trim(),
        name: newName.trim(),
        company: newCompany.trim() || null,
        plan_tier: newPlan,
        account_id: newAccountId.trim() || null,
      }
    } else {
      base['new_employee'] = {
        email: newEmail.trim(),
        name: newName.trim(),
        department: newDept.trim() || null,
        manager_email: newManager.trim() || null,
        location: newLocation.trim() || null,
      }
    }

    try {
      const created = (await insertFn.trigger(base).result) as { id: number; ticket_number: string } | null
      toast.success(created ? `Created ${created.ticket_number}` : 'Ticket created')
      closeNewTicket()
      refreshData()
      if (created?.id) openTicket(created.id)
    } catch (e) {
      toast.error(`Failed to create ticket: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <Dialog open={newTicketOpen} onOpenChange={(o) => (!o ? closeNewTicket() : undefined)}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto cursor-scroll"
        style={{ backgroundColor: C.bg }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: C.text }}>New Ticket</DialogTitle>
          <DialogDescription style={{ color: C.muted }}>
            SLA is set automatically: Urgent 1h · High 4h · Medium 8h · Low 24h
            {` (${slaHoursForPriority(priority)}h for ${priority}).`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Segmented
            value={ticketType}
            onChange={(v) => {
              setTicketType(v as 'external' | 'internal')
              setSelectedContactId('')
            }}
            options={[
              { value: 'external', label: 'External (Customer)' },
              { value: 'internal', label: 'Internal (Employee)' },
            ]}
          />

          {/* Contact selection */}
          <div className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: C.surface, borderColor: C.border }}>
            <div className="flex items-center justify-between">
              <SpanLabel>{ticketType === 'external' ? 'Customer' : 'Employee'}</SpanLabel>
              <Segmented
                value={contactMode}
                onChange={(v) => setContactMode(v as 'existing' | 'new')}
                options={[
                  { value: 'existing', label: 'Select existing' },
                  { value: 'new', label: 'Create new' },
                ]}
              />
            </div>

            {contactMode === 'existing' ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.muted }} />
                  <Input
                    aria-label="Search contacts"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={ticketType === 'external' ? 'Search customers…' : 'Search employees…'}
                    className="pl-9"
                    style={inputStyle}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-select" className="text-xs font-medium" style={{ color: C.muted }}>
                    {ticketType === 'external' ? 'Customer' : 'Employee'}
                  </Label>
                  <NativeSelect
                    id="contact-select"
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select…</option>
                    {contactList.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field id="nc-email" label="Email">
                  <Input id="nc-email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
                </Field>
                <Field id="nc-name" label="Name">
                  <Input id="nc-name" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
                </Field>
                {ticketType === 'external' ? (
                  <>
                    <Field id="nc-company" label="Company">
                      <Input id="nc-company" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} style={inputStyle} />
                    </Field>
                    <Field id="nc-plan" label="Plan tier">
                      <NativeSelect id="nc-plan" value={newPlan} onChange={(e) => setNewPlan(e.target.value)} style={inputStyle}>
                        {PLAN_TIERS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field id="nc-acct" label="Account ID">
                      <Input id="nc-acct" value={newAccountId} onChange={(e) => setNewAccountId(e.target.value)} style={inputStyle} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field id="nc-dept" label="Department">
                      <Input id="nc-dept" value={newDept} onChange={(e) => setNewDept(e.target.value)} style={inputStyle} />
                    </Field>
                    <Field id="nc-mgr" label="Manager email">
                      <Input id="nc-mgr" value={newManager} onChange={(e) => setNewManager(e.target.value)} style={inputStyle} />
                    </Field>
                    <Field id="nc-loc" label="Location">
                      <Input id="nc-loc" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} style={inputStyle} />
                    </Field>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Ticket fields */}
          <div className="grid grid-cols-2 gap-3">
            <Field id="t-category" label="Category">
              <NativeSelect id="t-category" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="t-priority" label="Priority">
              <NativeSelect id="t-priority" value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                {ALL_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            {ticketType === 'external' && (
              <Field id="t-channel" label="Source channel">
                <NativeSelect id="t-channel" value={sourceChannel} onChange={(e) => setSourceChannel(e.target.value)} style={inputStyle}>
                  {SOURCE_CHANNELS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
          </div>

          <Field id="t-subject" label="Subject">
            <Input id="t-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary" style={inputStyle} />
          </Field>
          <Field id="t-desc" label="Description">
            <Textarea
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the issue…"
              style={inputStyle}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={closeNewTicket}
            className="rounded-full px-4 py-2 text-sm font-medium border"
            style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || insertFn.loading}
            className="rounded-full px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: C.orange }}
          >
            {insertFn.loading ? 'Creating…' : 'Create Ticket'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SpanLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-semibold" style={{ color: C.text }}>
      {children}
    </span>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium" style={{ color: C.muted }}>
        {label}
      </Label>
      {children}
    </div>
  )
}
