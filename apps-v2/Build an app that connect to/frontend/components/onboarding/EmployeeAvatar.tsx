import { cn } from "../../lib/shadcn/utils"

// Virgin Voyages brand tints: crimson, aubergine, seafoam, sand, coral, slate.
const COLORS = [
  "bg-[#FCE9E9] text-[#B60808] dark:bg-[#4a0808] dark:text-[#FCA5A5]",
  "bg-[#EFE6F3] text-[#2E0A3E] dark:bg-[#2E0A3E] dark:text-[#EFE6F3]",
  "bg-[#E0F5F1] text-[#00755F] dark:bg-[#053d33] dark:text-[#5EE6D0]",
  "bg-[#FDF3D9] text-[#946908] dark:bg-[#3a2c05] dark:text-[#F0B429]",
  "bg-[#FFE7E4] text-[#C4362B] dark:bg-[#4a1c18] dark:text-[#FF9F96]",
  "bg-[#F4F1F6] text-[#5A5560] dark:bg-[#332a3a] dark:text-[#C9C2D0]",
]

function colorFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return COLORS[Math.abs(hash) % COLORS.length] as string
}

export function EmployeeAvatar({
  firstName,
  lastName,
  size = "md",
}: {
  firstName: string
  lastName: string
  size?: "sm" | "md" | "lg"
}) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  const sizeClass =
    size === "lg"
      ? "h-14 w-14 text-lg"
      : size === "sm"
        ? "h-8 w-8 text-xs"
        : "h-10 w-10 text-sm"
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizeClass,
        colorFor(firstName + lastName),
      )}
    >
      {initials}
    </div>
  )
}
