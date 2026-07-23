import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../lib/shadcn/dialog'
import { Input } from '../../lib/shadcn/input'
import { Label } from '../../lib/shadcn/label'
import { toast } from '../../lib/shadcn/sonner'
import { useEscalateTicket } from '../../hooks/backend/support'
import { C } from '../../lib/cursor'

type Props = {
  ticketId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onEscalated: () => void
  currentLinearId: string | null
}

export function EscalateDialog({ ticketId, open, onOpenChange, onEscalated, currentLinearId }: Props) {
  const [linearId, setLinearId] = useState(currentLinearId ?? '')
  const escalateFn = useEscalateTicket()

  const submit = async () => {
    try {
      await escalateFn.trigger({ id: ticketId, linearIssueId: linearId.trim() || null }).result
      toast.success('Ticket escalated')
      onEscalated()
      onOpenChange(false)
    } catch (e) {
      toast.error(`Failed to escalate: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: C.surface }}>
        <DialogHeader>
          <DialogTitle style={{ color: C.text }}>Escalate ticket</DialogTitle>
          <DialogDescription style={{ color: C.muted }}>
            Sets the status to Escalated and links a Linear issue for engineering follow-up.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="linear-id" className="text-sm font-medium" style={{ color: C.text }}>
            Linear issue ID
          </Label>
          <Input
            id="linear-id"
            value={linearId}
            onChange={(e) => setLinearId(e.target.value)}
            placeholder="e.g. ENG-1234"
            style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
          />
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-4 py-2 text-sm font-medium border"
            style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={escalateFn.loading}
            className="rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: C.error }}
          >
            {escalateFn.loading ? 'Escalating…' : 'Escalate'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
