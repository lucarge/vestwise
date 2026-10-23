import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { PageHeader } from "@/components/brand/page-header"
import { Button } from "@/components/ui/button"
import { GrantTable } from "@/components/grant-table"
import { EditGrantDialog } from "@/components/edit-grant-dialog"
import { useCompanies } from "@/hooks/use-companies"
import { useGrants } from "@/hooks/use-grants"
import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"

export function GrantsPage() {
  const { grants, updateGrant, removeGrant } = useGrants()
  const { companies, saveCompany, detachGrant } = useCompanies()
  const [editingGrant, setEditingGrant] = useState<Grant | null>(null)

  function handleUpdateGrant(grant: Grant, company?: Company) {
    // A grant moved to another company leaves the price it recorded behind
    if (editingGrant && editingGrant.companyId !== grant.companyId) {
      detachGrant(grant.id)
    }
    if (company) saveCompany(company)
    updateGrant(grant)
  }

  function handleRemoveGrant(id: string) {
    removeGrant(id)
    detachGrant(id)
  }

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
        companies={companies}
        onEditGrant={setEditingGrant}
        onRemoveGrant={handleRemoveGrant}
      />
      <EditGrantDialog
        grant={editingGrant}
        companies={companies}
        open={editingGrant !== null}
        onOpenChange={(open) => {
          if (!open) setEditingGrant(null)
        }}
        onUpdateGrant={handleUpdateGrant}
      />
    </div>
  )
}
