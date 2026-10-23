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
import type { Company } from "@/types/company"
import type { Grant } from "@/types/grant"
import { computeGrantTotals } from "@/hooks/use-grants"
import { useColumnConfig, type SortConfig } from "@/hooks/use-column-config"
import type { ColumnDef, ColumnId } from "@/lib/columns"
import {
  enrichGrants,
  totalOwnership,
  type GrantWithCompany,
} from "@/lib/company"
import { cn } from "@/lib/utils"

interface GrantTableProps {
  grants: Grant[]
  companies: Company[]
  onEditGrant: (grant: Grant) => void
  onRemoveGrant: (id: string) => void
}

interface CompanyGroup {
  key: string
  title: string
  grants: GrantWithCompany[]
}

// One part per company, in the order the companies were added. A grant
// whose company is missing, possible only from a hand-edited file, sits in
// a last part at its own price.
function groupByCompany(
  grants: GrantWithCompany[],
  companies: Company[]
): CompanyGroup[] {
  const groups = companies
    .map((company) => ({
      key: company.id,
      title: company.name,
      grants: grants.filter((g) => g.companyId === company.id),
    }))
    .filter((group) => group.grants.length > 0)
  const known = new Set(companies.map((c) => c.id))
  const orphans = grants.filter((g) => !known.has(g.companyId))
  if (orphans.length > 0) {
    groups.push({ key: "none", title: "Without a company", grants: orphans })
  }
  return groups
}

export function GrantTable({
  grants,
  companies,
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

  const groups = groupByCompany(enrichGrants(grants, companies), companies)
  const description = "Sort by any column; choose which columns to show."
  // The columns are one choice for every table on the page
  const columnsControl = (
    <ColumnConfigPopover
      columnConfig={columnConfig}
      onToggle={toggleColumn}
      onMove={moveColumn}
      onReset={resetToDefaults}
    />
  )

  if (groups.length === 0) {
    return (
      <Part title="All grants" description={description} action={columnsControl}>
        <CompanyTable
          grants={[]}
          visibleColumns={visibleColumns}
          sortConfig={sortConfig}
          onSort={toggleSort}
          onEditGrant={onEditGrant}
          onRemoveGrant={onRemoveGrant}
        />
      </Part>
    )
  }

  return groups.map((group, i) => (
    <Part
      key={group.key}
      title={group.title}
      description={i === 0 ? description : undefined}
      action={i === 0 ? columnsControl : undefined}
    >
      <CompanyTable
        grants={sortGrants(group.grants)}
        visibleColumns={visibleColumns}
        sortConfig={sortConfig}
        onSort={toggleSort}
        onEditGrant={onEditGrant}
        onRemoveGrant={onRemoveGrant}
      />
    </Part>
  ))
}

interface CompanyTableProps {
  grants: GrantWithCompany[]
  visibleColumns: ColumnDef[]
  sortConfig: SortConfig
  onSort: (id: ColumnId) => void
  onEditGrant: (grant: Grant) => void
  onRemoveGrant: (id: string) => void
}

function CompanyTable({
  grants,
  visibleColumns,
  sortConfig,
  onSort,
  onEditGrant,
  onRemoveGrant,
}: CompanyTableProps) {
  const columnTotals = {
    ...computeGrantTotals(grants),
    totalOwnership: totalOwnership(grants),
  }

  return (
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
              onClick={col.sortValue ? () => onSort(col.id) : undefined}
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
          grants.map((grant) => (
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
  )
}
