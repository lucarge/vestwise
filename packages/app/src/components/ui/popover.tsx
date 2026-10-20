import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"
import { useDialogPortalContainer } from "@/components/ui/dialog-portal-context"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

function PopoverContent({
  className,
  sideOffset = 8,
  container,
  ...props
}: PopoverPrimitive.Popup.Props & {
  sideOffset?: number
  container?: PopoverPrimitive.Portal.Props["container"]
}) {
  const dialogContainer = useDialogPortalContainer()
  return (
    <PopoverPrimitive.Portal
      container={container ?? dialogContainer ?? undefined}
    >
      <PopoverPrimitive.Positioner sideOffset={sideOffset}>
        <PopoverPrimitive.Popup
          className={cn(
            "z-50 w-auto border border-ink bg-popover p-4 text-popover-foreground transition-opacity duration-150 ease-out outline-none data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
