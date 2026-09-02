// Minimal word-level diff (LCS-based) for showing the change between the AI's
// original draft and the rep's edited version.

export type DiffPart = { value: string; type: 'same' | 'added' | 'removed' }

function tokenize(text: string): string[] {
  // keep whitespace as part of tokens so re-joining preserves formatting
  return text.split(/(\s+)/).filter((t) => t.length > 0)
}

export function diffWords(oldText: string, newText: string): DiffPart[] {
  const a = tokenize(oldText)
  const b = tokenize(newText)
  const n = a.length
  const m = b.length

  // LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i]![j] = dp[i + 1]![j + 1]! + 1
      else dp[i]![j] = Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!)
    }
  }

  const parts: DiffPart[] = []
  let i = 0
  let j = 0
  const push = (value: string, type: DiffPart['type']) => {
    const last = parts[parts.length - 1]
    if (last && last.type === type) last.value += value
    else parts.push({ value, type })
  }

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push(a[i]!, 'same')
      i++
      j++
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      push(a[i]!, 'removed')
      i++
    } else {
      push(b[j]!, 'added')
      j++
    }
  }
  while (i < n) push(a[i++]!, 'removed')
  while (j < m) push(b[j++]!, 'added')

  return parts
}

export function hasChanges(oldText: string, newText: string): boolean {
  return oldText.trim() !== newText.trim()
}
