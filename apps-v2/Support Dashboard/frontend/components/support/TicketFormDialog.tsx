import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '../../lib/shadcn/dialog'
import { Button } from '../../lib/shadcn/button'
import { Input } from '../../lib/shadcn/input'
import { Textarea } from '../../lib/shadcn/textarea'
import { Label } from '../../lib/shadcn/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../lib/shadcn/select'
import { Spinner } from '../../lib/shadcn/spinner'
import { toast } from '../../lib/shadcn/sonner'
import { useCreateTicket, useUpdateTicket } from '../../hooks/backend/support'
import type { Ticket } from '../../utils/types'
import {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  TICKET_TYPES,
  CHANNELS,
  statusLabel,
  categoryLabel,
} from '../../utils/support'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket?: Ticket | null
  assigneeEmails: string[]
  onSaved: () => void
}

type FormState = {
  subject: string
  description: string
  ticket_type: string
  priority: string
  status: string
  category: string
  assignee_email: string
  source_channel: string
}

const UNASSIGNED = '__unassigned__'
const NO_CHANNEL = '__none__'

function emptyForm(): FormState {
  return {
    subject: '',
    description: '',
    ticket_type: 'external',
    priority: 'Medium',
    status: 'New',
    category: 'Other',
    assignee_email: UNASSIGNED,
    source_channel: NO_CHANNEL,
  }
}

export function TicketFormDialog({ open, onOpenChange, ticket, assigneeEmails, onSaved }: Props) {
  const isEdit = !!ticket
  const [form, setForm] = useState<FormState>(emptyForm())
  const create = useCreateTicket()
  const update = useUpdateTicket()
  const saving = create.loading || update.loading

  useEffect(() => {
    if (!open) return
    if (ticket) {
      setForm({
        subject: ticket.subject,
        description: ticket.description ?? '',
        ticket_type: ticket.ticket_type,
        priority: ticket.priority,
        status: ticket.status,
        category: ticket.category,
        assignee_email: ticket.assignee_email ?? UNASSIGNED,
        source_channel: ticket.source_channel ?? NO_CHANNEL,
      })
    } else {
      setForm(emptyForm())
    }
  }, [open, ticket])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    if (!form.subject.trim()) {
      toast.error('Subject is required')
      return
    }
    const payload = {
      subject: form.subject.trim(),
      description: form.description.trim() || null,
      ticket_type: form.ticket_type,
      priority: form.priority,
      status: form.status,
      category: form.category,
      assignee_email: form.assignee_email === UNASSIGNED ? null : form.assignee_email,
      source_channel: form.source_channel === NO_CHANNEL ? null : form.source_channel,
    }
    try {
      if (isEdit && ticket) {
        await update.trigger({ ...payload, id: ticket.id }).result
        toast.success('Ticket updated')
      } else {
        await create.trigger(payload).result
        toast.success('Ticket created')
      }
      onOpenChange(false)
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save ticket')
    }
  }

  const combinedAssignees = Array.from(
    new Set([...assigneeEmails, ...(ticket?.assignee_email ? [ticket.assignee_email] : [])]),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit ticket' : 'New ticket'}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update ${ticket?.ticket_number}` : 'Create a new support ticket.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
              placeholder="Short summary of the issue"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Add more detail..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.ticket_type} onValueChange={(v) => set('ticket_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select value={form.assignee_email} onValueChange={(v) => set('assignee_email', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {combinedAssignees.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Source channel</Label>
              <Select value={form.source_channel} onValueChange={(v) => set('source_channel', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CHANNEL}>None</SelectItem>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Spinner className="mr-2" />}
            {isEdit ? 'Save changes' : 'Create ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
