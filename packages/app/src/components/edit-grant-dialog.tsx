import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GrantForm } from "@/components/grant-form"
import type { Grant } from "@/types/grant"

interface EditGrantDialogProps {
  grant: Grant | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateGrant: (grant: Grant) => void
}

export function EditGrantDialog({
  grant,
  open,
  onOpenChange,
  onUpdateGrant,
}: EditGrantDialogProps) {
  function handleUpdate(updated: Grant) {
    onUpdateGrant(updated)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit grant</DialogTitle>
          <DialogDescription>
            Change the terms of this grant in its clause.
          </DialogDescription>
        </DialogHeader>
        {grant && (
          <GrantForm
            key={grant.id}
            initialGrant={grant}
            onUpdateGrant={handleUpdate}
            variant="dialog"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
