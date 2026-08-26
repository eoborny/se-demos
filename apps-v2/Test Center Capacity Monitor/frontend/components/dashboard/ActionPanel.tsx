import { ArrowRightLeft, Loader2, MessageSquarePlus, Plus, Send, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import type { CenterNote, TestCenter } from '../../data/types'
import { Textarea } from '../../lib/shadcn/textarea'

interface ActionPanelProps {
  center: TestCenter
  notes: CenterNote[]
  saving: boolean
  onAddNote: (note: Omit<CenterNote, 'id' | 'timestamp'>) => void
}

type Kind = CenterNote['kind']

const KIND_META: Record<Kind, { label: string; icon: React.ReactNode; hint: string }> = {
  note: {
    label: 'Log Note',
    icon: <MessageSquarePlus className="h-4 w-4" />,
    hint: 'Add an internal note for this center.',
  },
  capacity_increase: {
    label: 'Request Capacity',
    icon: <TrendingUp className="h-4 w-4" />,
    hint: 'Request additional seats or proctors for this session.',
  },
  reassignment: {
    label: 'Flag Reassignment',
    icon: <ArrowRightLeft className="h-4 w-4" />,
    hint: 'Propose consolidating or reassigning to a nearby center.',
  },
}

const KIND_TAG: Record<Kind, { label: string; color: string; bg: string }> = {
  note: { label: 'Note', color: '#4A5361', bg: '#F0F1F3' },
  capacity_increase: { label: 'Capacity request', color: '#9A7015', bg: 'rgba(212,160,41,0.14)' },
  reassignment: { label: 'Reassignment', color: '#8F3A31', bg: 'rgba(192,86,75,0.12)' },
}

export function ActionPanel({ center, notes, saving, onAddNote }: ActionPanelProps) {
  const [kind, setKind] = useState<Kind>('note')
  const [text, setText] = useState('')

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onAddNote({ centerId: center.center_id, author: 'You', kind, text: trimmed })
    setText('')
  }

  return (
    <div className="rounded-md border border-[#E4E6E9] bg-white p-4">
      <h4 className="text-sm font-semibold text-[#1A212B]">Take Action</h4>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(Object.keys(KIND_META) as Kind[]).map((k) => {
          const active = kind === k
          return (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={
                'flex flex-col items-center gap-1.5 rounded-md border px-2 py-2.5 text-center text-xs font-medium transition-colors ' +
                (active
                  ? 'border-[#F2B733] bg-[#FBF4E3] text-[#1A212B]'
                  : 'border-[#E4E6E9] bg-white text-[#6B7280] hover:bg-[#F7F8F9]')
              }
            >
              {KIND_META[k].icon}
              {KIND_META[k].label}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-[#6B7280]">{KIND_META[kind].hint}</p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add details…"
        className="mt-1.5 min-h-[70px] resize-none border-[#DcdfE3] text-sm"
      />
      <div className="mt-2 flex justify-end">
        <button
          onClick={submit}
          disabled={!text.trim() || saving}
          className="flex items-center gap-1.5 rounded-md bg-[#1A212B] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2E3846] disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : kind === 'note' ? (
            <Plus className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit
        </button>
      </div>

      <div className="mt-4">
        <h5 className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          Activity ({notes.length})
        </h5>
        {notes.length === 0 ? (
          <p className="mt-2 text-xs text-[#9AA1AB]">No actions logged yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {notes.map((n) => {
              const tag = KIND_TAG[n.kind]
              return (
                <li key={n.id} className="rounded-md border border-[#EEF0F2] bg-[#FAFBFC] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: tag.bg, color: tag.color }}
                    >
                      {tag.label}
                    </span>
                    <span className="text-[11px] text-[#9AA1AB]">
                      {new Date(n.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#2A313B]">{n.text}</p>
                  <p className="mt-0.5 text-[11px] text-[#9AA1AB]">— {n.author}</p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
