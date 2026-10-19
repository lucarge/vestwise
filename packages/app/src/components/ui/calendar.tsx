import { DayPicker } from "react-day-picker"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Square days, the chosen one on the highlighter, today underlined in ink
function Calendar({
  className,
  classNames,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("p-0", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex h-9 items-center justify-center px-8",
        caption_label:
          "inline-flex items-center text-[0.9375rem] font-semibold",
        dropdowns: "flex items-center gap-2",
        dropdown_root:
          "relative inline-flex items-center border-b-2 border-ink bg-transparent px-1 py-0.5 text-[0.9375rem] font-semibold transition-colors duration-150 hover:bg-muted",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        chevron: "",
        nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between px-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-xs" })
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-xs" })
        ),
        month_grid: "mx-auto w-max border-collapse",
        weekdays: "flex",
        weekday: "w-8 text-[0.75rem] font-medium text-ink-soft text-center",
        week: "flex w-full mt-1",
        day: "relative w-8 p-0 text-center text-[0.9375rem]",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-xs" }),
          "figures size-8 font-medium [font-stretch:100%]"
        ),
        selected:
          "[&>.rdp-day_button]:bg-mark [&>.rdp-day_button]:text-mark-ink [&>.rdp-day_button]:hover:bg-mark [&>.rdp-day_button]:hover:text-mark-ink",
        today:
          "[&>.rdp-day_button]:underline [&>.rdp-day_button]:decoration-2 [&>.rdp-day_button]:underline-offset-4",
        outside: "text-ink-muted opacity-50",
        disabled: "text-ink-muted opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "down")
            return (
              <ChevronDown strokeWidth={2.25} className="ml-0.5 size-3.5" />
            )
          return orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
