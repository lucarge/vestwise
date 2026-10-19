import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react"

import { Part } from "@/components/brand/part"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ColumnConfigPopover } from "@/components/column-config-popover"
import type { Grant } from "@/types/grant"
import type { ValuationEntry } from "@/types/valuation"
import type { GrantTotals } from "@/hooks/use-grants"
import { useColumnConfig } from "@/hooks/use-column-config"
import {
  enrichGrantsWithValuation,
  computeTotalOwnership,
} from "@/lib/valuation"
import { cn } from "@/lib/utils"

interface GrantTableProps {
  grants: Grant[]
  totals: GrantTotals
  valuations: ValuationEntry[]
  onEditGrant: (grant: Grant) => void
  onRemoveGrant: (id: string) => void
}

export function GrantTable({
  grants,
  totals,
  valuations,
  onEditGrant,
  onRemoveGrant,
}: GrantTableProps) {
  const {
    columnConfig,
    visibleColumns,
    toggleColumn,
    moveColumn,
    resetToDefaults,
    sortConfig,
    toggleSort,
    sortGrants,
  } = useColumnConfig()

  const enrichedGrants = enrichGrantsWithValuation(grants, valuations)
  const sortedGrants = sortGrants(enrichedGrants)
  const columnTotals = {
    ...totals,
    totalOwnership: computeTotalOwnership(enrichedGrants),
  }

  return (
    <Part
      title="All grants"
      description="Sort by any column; choose which columns to show."
      action={
        <ColumnConfigPopover
          columnConfig={columnConfig}
          onToggle={toggleColumn}
          onMove={moveColumn}
          onReset={resetToDefaults}
        />
      }
    >
      <Table className="whitespace-nowrap">
        <TableHeader>
          <TableRow>
            {visibleColumns.map((col) => (
              <TableHead
                key={col.id}
                className={cn(
                  col.align === "right" && "text-right",
                  col.sortValue && "cursor-pointer select-none"
                )}
                aria-sort={
                  sortConfig.column === col.id
                    ? sortConfig.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
                onClick={col.sortValue ? () => toggleSort(col.id) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.tooltip ? (
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-ink-muted decoration-dotted underline-offset-4">
                        {col.label}
                      </TooltipTrigger>
                      <TooltipContent>{col.tooltip}</TooltipContent>
                    </Tooltip>
                  ) : (
                    col.label
                  )}
                  {col.sortValue &&
                    (sortConfig.column === col.id ? (
                      sortConfig.direction === "asc" ? (
                        <ArrowUp className="size-3.5 text-ink" />
                      ) : (
                        <ArrowDown className="size-3.5 text-ink" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3.5 text-ink-muted" />
                    ))}
                </span>
              </TableHead>
            ))}
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {grants.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns.length + 1}
                className="py-8 text-center text-ink-soft"
              >
                No grants yet.
              </TableCell>
            </TableRow>
          ) : (
            sortedGrants.map((grant) => (
              <TableRow key={grant.id}>
                {visibleColumns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={
                      col.align === "right" ? "figures text-right" : undefined
                    }
                  >
                    {col.renderCell(grant)}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onEditGrant(grant)}
                      aria-label="Edit grant"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onRemoveGrant(grant.id)}
                      aria-label="Remove grant"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {grants.length > 0 && (
          <TableFooter>
            <TableRow>
              {visibleColumns.map((col, idx) => (
                <TableCell
                  key={col.id}
                  className={cn(
                    "figures",
                    (col.align === "right" || idx > 0) && "text-right"
                  )}
                >
                  {idx === 0
                    ? "Total"
                    : col.renderFooter
                      ? col.renderFooter(columnTotals)
                      : null}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </Part>
  )
}
