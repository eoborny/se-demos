import { Building2, Newspaper, Activity, MessagesSquare, Sparkles } from 'lucide-react'
import { Draft } from '../../lib/console/types'

const SECTIONS = [
  { key: 'firmographics', label: 'Firmographics', icon: Building2 },
  { key: 'recent_news', label: 'Recent news', icon: Newspaper },
  { key: 'intent_signals', label: 'Intent signals', icon: Activity },
  { key: 'thread_history', label: 'Thread history', icon: MessagesSquare },
] as const

export function ResearchPanel({ draft }: { draft: Draft }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs text-body-foreground">
          This is the research the model used to write the draft. Inspect it to see exactly why it wrote what it wrote.
        </p>
      </div>

      {SECTIONS.map((section) => {
        const items = draft.research[section.key] ?? []
        const Icon = section.icon
        return (
          <div key={section.key}>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
              {section.label}
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signals captured.</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-body-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
