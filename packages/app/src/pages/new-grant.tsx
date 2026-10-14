import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GrantForm } from "@/components/grant-form"
import { useGrants } from "@/hooks/use-grants"
import { clearGrantHandoff, peekGrantHandoff } from "@/lib/grant-handoff"
import type { Grant } from "@/types/grant"

export function NewGrantPage() {
  const { addGrant } = useGrants()
  const navigate = useNavigate()
  // A grant link from the landing page fills in the form the first time this
  // page opens. It is never stored: coming back here starts empty.
  const [handoff] = useState(peekGrantHandoff)
  useEffect(clearGrantHandoff, [])

  function handleAddGrant(grant: Grant) {
    addGrant(grant)
    navigate("/grants")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Add Grant</h1>
        <p className="text-sm text-muted-foreground">
          Add a new virtual stock option grant.
        </p>
      </div>
      {handoff && (
        <div className="rounded-md border border-border bg-muted/50 p-3">
          <p className="text-sm">
            {handoff.status === "ready"
              ? "Filled in with the terms you entered on vestwise.app. Nothing is saved until you add the grant."
              : "This grant link couldn't be read, so the form starts empty."}
          </p>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Grant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <GrantForm
            onAddGrant={handleAddGrant}
            prefill={handoff?.status === "ready" ? handoff.prefill : undefined}
          />
        </CardContent>
      </Card>
    </div>
  )
}
