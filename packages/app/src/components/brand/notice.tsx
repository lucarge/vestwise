import { cn } from "@/lib/utils"

// A block that asks for a decision, ruled in ink, or in the state colour
// when the decision cannot be undone
export function Notice({
  tone = "ink",
  children,
}: {
  tone?: "ink" | "state"
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex max-w-[60ch] flex-col gap-4 border p-4",
        tone === "state" ? "border-destructive" : "border-ink"
      )}
    >
      {children}
    </div>
  )
}
