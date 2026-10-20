import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { PageHeader } from "@/components/brand/page-header"
import { Part } from "@/components/brand/part"
import { GrantForm } from "@/components/grant-form"
import { useGrants } from "@/hooks/use-grants"
import { clearGrantHandoff, peekGrantHandoff } from "@/lib/grant-handoff"
import type { Grant } from "@/types/grant"

export function NewGrantPage() {
  const { addGrant } = useGrants()
  const navigate = useNavigate()
  // A grant link from the landing page fills in the clause the first time
  // this page opens. It is never stored: coming back here starts empty.
  const [handoff] = useState(peekGrantHandoff)
  useEffect(clearGrantHandoff, [])

  function handleAddGrant(grant: Grant) {
    addGrant(grant)
    navigate("/grants")
  }

  return (
    <div className="flex flex-col gap-line">
      <PageHeader
        title="Add a grant"
        lede="Type in the terms of your grant agreement. VestWise turns them into euros."
      >
        {handoff && (
          <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-snug text-ink-soft">
            {handoff.status === "ready"
              ? "Filled in with the terms you entered on vestwise.app. Nothing is saved until you add the grant."
              : "This grant link could not be read, so the clause starts empty."}
          </p>
        )}
      </PageHeader>
      <Part>
        <GrantForm
          onAddGrant={handleAddGrant}
          prefill={handoff?.status === "ready" ? handoff.prefill : undefined}
        />
      </Part>
    </div>
  )
}
