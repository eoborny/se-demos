import { diffWords } from '../../lib/console/diff'

export function DiffView({ original, edited }: { original: string; edited: string }) {
  const parts = diffWords(original, edited)
  return (
    <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed text-body-foreground">
      {parts.map((p, i) => {
        if (p.type === 'added')
          return (
            <span key={i} className="rounded-sm bg-success/20 text-success-foreground underline decoration-success/60">
              <span className="text-foreground">{p.value}</span>
            </span>
          )
        if (p.type === 'removed')
          return (
            <span key={i} className="rounded-sm bg-destructive/15 text-destructive line-through decoration-destructive/60">
              {p.value}
            </span>
          )
        return <span key={i}>{p.value}</span>
      })}
    </div>
  )
}
