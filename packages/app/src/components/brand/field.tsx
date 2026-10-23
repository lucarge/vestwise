import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FieldProps {
  label: string
  /** The id of the input the label names */
  htmlFor?: string
  tooltip?: string
  /** A line under the input, when there is no problem to report */
  hint?: string
  error?: string
  children: React.ReactNode
}

// A record VestWise keeps is not a clause, so its fields are labeled blanks:
// the label above, with a tooltip for what it means, and a problem under it
export function Field({
  label,
  htmlFor,
  tooltip,
  hint,
  error,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-5 items-center">
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger
              render={<Label htmlFor={htmlFor} />}
              className="cursor-help underline decoration-ink-muted decoration-dotted underline-offset-4"
            >
              {label}
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <Label htmlFor={htmlFor}>{label}</Label>
        )}
      </div>
      {children}
      {error ? (
        <p
          role="alert"
          className="text-[0.8125rem] leading-snug text-destructive"
        >
          {error}
        </p>
      ) : (
        hint && (
          <p className="text-[0.8125rem] leading-snug text-ink-soft">{hint}</p>
        )
      )}
    </div>
  )
}
