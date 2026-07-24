import { Badge } from "../../lib/shadcn/badge"
import { cn } from "../../lib/shadcn/utils"
import type { HiringStatus } from "../../data/onboarding"

// Tones mirror the Virgin Voyages badge palette (crimson soft, sand, aubergine, seafoam).
const STYLES: Record<HiringStatus, string> = {
  "Offer Accepted":
    "bg-[#EFE6F3] text-[#2E0A3E] dark:bg-[#2E0A3E] dark:text-[#EFE6F3] border-transparent",
  "Pre-boarding":
    "bg-[#FDF3D9] text-[#946908] dark:bg-[#3a2c05] dark:text-[#F0B429] border-transparent",
  Onboarding:
    "bg-[#FCE9E9] text-[#B60808] dark:bg-[#4a0808] dark:text-[#FCA5A5] border-transparent",
  Active:
    "bg-[#E0F5F1] text-[#00755F] dark:bg-[#053d33] dark:text-[#5EE6D0] border-transparent",
}

export function StatusBadge({ status }: { status: HiringStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-display text-[11px] tracking-[0.05em]",
        STYLES[status],
      )}
    >
      {status}
    </Badge>
  )
}
