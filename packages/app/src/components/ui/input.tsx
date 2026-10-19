import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// A labeled field is a blank: no box, a 2px ink underline, and the
// highlighter while it has focus (see .field-blank in index.css)
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn("field-blank min-w-0", className)}
      {...props}
    />
  )
}

export { Input }
