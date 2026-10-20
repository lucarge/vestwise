import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { PageHeader } from "@/components/brand/page-header"
import { Button } from "@/components/ui/button"
import { GrantTable } from "@/components/grant-table"
import { EditGrantDialog } from "@/components/edit-grant-dialog"
import { useGrants } from "@/hooks/use-grants"
import { useValuations } from "@/hooks/use-valuations"
import type { Grant } from "@/types/grant"

export function GrantsPage() {
  const { grants, updateGrant, removeGrant, totals } = useGrants()
  const { valuations } = useValuations()
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null)

  return (
    <div className="flex flex-col gap-line">
      <PageHeader
        title="Grants"
        lede="Every grant you hold, with its terms and what it is worth."
        action={
          <Button render={<Link to="/grants/new" />}>
            Add a grant
            <ArrowRight data-icon="inline-end" strokeWidth={2.25} />
          </Button>
        }
      />
      <GrantTable
        grants={grants}
        totals={totals}
        valuations={valuations}
        onEditGrant={setEditingGrant}
        onRemoveGrant={removeGrant}
      />
      <EditGrantDialog
        grant={editingGrant}
        open={editingGrant !== null}
        onOpenChange={(open) => {
          if (!open) setEditingGrant(null)
        }}
        onUpdateGrant={updateGrant}
      />
    </div>
  )
}
