import { useState } from 'react'
import { Lock, Send } from 'lucide-react'
import { Textarea } from '../../lib/shadcn/textarea'
import { Switch } from '../../lib/shadcn/switch'
import { Label } from '../../lib/shadcn/label'
import { toast } from '../../lib/shadcn/sonner'
import { useInsertNote } from '../../hooks/backend/support'
import { C, formatDateTime } from '../../lib/cursor'
import type { NoteRow } from '../../lib/types'

type Props = {
  ticketId: number
  notes: NoteRow[]
  loading: boolean
  onAdded: () => void
}

export function NotesThread({ ticketId, notes, loading, onAdded }: Props) {
  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const insertFn = useInsertNote()

  const submit = async () => {
    const trimmed = body.trim()
    if (!trimmed) return
    try {
      await insertFn.trigger({ ticketId, body: trimmed, isInternal }).result
      setBody('')
      setIsInternal(false)
      toast.success('Note added')
      onAdded()
    } catch (e) {
      toast.error(`Failed to add note: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {loading ? (
          <div className="text-sm" style={{ color: C.muted }}>
            Loading notes…
          </div>
        ) : notes.length === 0 ? (
          <div className="text-sm" style={{ color: C.muted }}>
            No notes yet.
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border p-3"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold" style={{ color: C.text }}>
                  {n.author_email}
                </span>
                <div className="flex items-center gap-2">
                  {n.is_internal && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: 'rgba(232,212,160,0.4)', color: C.text }}
                    >
                      <Lock className="h-2.5 w-2.5" />
                      Internal
                    </span>
                  )}
                  <span className="text-[11px]" style={{ color: C.muted }}>
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap" style={{ color: C.text }}>
                {n.body}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border p-3 space-y-2" style={{ backgroundColor: C.bgSecondary, borderColor: C.border }}>
        <Label htmlFor="note-body" className="text-xs font-medium" style={{ color: C.muted }}>
          Add a note
        </Label>
        <Textarea
          id="note-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write an update, internal or customer-facing…"
          rows={3}
          style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="note-internal" checked={isInternal} onCheckedChange={setIsInternal} />
            <Label htmlFor="note-internal" className="text-xs font-medium cursor-pointer" style={{ color: C.text }}>
              Internal only
            </Label>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={insertFn.loading || !body.trim()}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: C.orange }}
          >
            <Send className="h-3.5 w-3.5" />
            {insertFn.loading ? 'Adding…' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  )
}
