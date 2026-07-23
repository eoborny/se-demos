import { Sparkles, RefreshCw } from 'lucide-react'
import { toast } from '../../lib/shadcn/sonner'
import { useGenerateAISummary } from '../../hooks/backend/support'
import { C, formatDateTime } from '../../lib/cursor'
import type { AISummaryRow } from '../../lib/types'

type Props = {
  ticketId: number
  summary: AISummaryRow | null
  loading: boolean
  onGenerated: () => void
}

export function AiSummaryPanel({ ticketId, summary, loading, onGenerated }: Props) {
  const genFn = useGenerateAISummary()

  const generate = async () => {
    try {
      await genFn.trigger({ ticketId }).result
      toast.success('AI summary generated')
      onGenerated()
    } catch (e) {
      toast.error(`Failed to generate summary: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: C.border,
        background: 'linear-gradient(135deg, rgba(200,184,240,0.22) 0%, rgba(168,200,240,0.22) 50%, rgba(168,220,200,0.22) 100%)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: C.orange }} aria-hidden="true" />
          <h3 className="text-sm font-semibold" style={{ color: C.text }}>
            AI Summary
          </h3>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={genFn.loading}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: C.orange }}
        >
          <RefreshCw className={`h-3 w-3 ${genFn.loading ? 'animate-spin' : ''}`} />
          {genFn.loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate Summary'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: C.muted }}>
          Loading…
        </p>
      ) : summary ? (
        <div>
          <p className="text-sm leading-relaxed" style={{ color: C.text }}>
            {summary.summary_text}
          </p>
          <p className="mt-2 text-[11px]" style={{ color: C.muted }}>
            {summary.model} · {formatDateTime(summary.generated_at)}
          </p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: C.muted }}>
          No summary yet. Generate one from the ticket subject, description, and notes.
        </p>
      )}
    </div>
  )
}
