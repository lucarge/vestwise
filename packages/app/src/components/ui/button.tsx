import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// A flat block with a heavy label: yellow for the one action that matters,
// an ink outline for the rest. Keyboard focus is the global 2px ink ring.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border border-transparent bg-clip-padding font-bold whitespace-nowrap [font-stretch:108%] transition-[background-color,color,border-color,transform] duration-150 ease-out select-none active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg[data-icon=inline-end]]:transition-transform [&_svg[data-icon=inline-end]]:duration-150 [&:hover_svg[data-icon=inline-end]]:translate-x-0.5",
  {
    variants: {
      variant: {
        default: "bg-mark text-mark-ink hover:bg-ink hover:text-paper",
        outline: "border-ink bg-transparent text-ink hover:bg-muted",
        secondary: "bg-mark-ink text-mark hover:bg-paper hover:text-ink",
        ghost: "text-ink hover:bg-muted",
        destructive:
          "border-destructive text-destructive hover:bg-destructive hover:text-paper",
        link: "text-link h-auto px-0 font-semibold [font-stretch:100%]",
      },
      size: {
        default:
          "h-9 px-4 text-[0.9375rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-[0.8125rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 px-5 text-[1.0625rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      render={render}
      // A button rendered as a link (render={<Link />}) is not a native button
      nativeButton={nativeButton ?? !render}
      {...props}
    />
  )
}

export { Button, buttonVariants }
