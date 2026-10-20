import { useRef, useState } from "react"
import {
  Download,
  Link as LinkIcon,
  Trash2,
  Unlink,
  Upload,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

import { PageHeader } from "@/components/brand/page-header"
import { Part } from "@/components/brand/part"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBackupSync } from "@/hooks/use-backup-sync"
import {
  applyDataSnapshot,
  type BackupData,
  getDataSnapshot,
  isValidBackup,
  serializeSnapshot,
} from "@/lib/backup-data"
import { cn } from "@/lib/utils"

function downloadExport() {
  const blob = new Blob([serializeSnapshot(getDataSnapshot())], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `vsop-backup-${format(new Date(), "yyyy-MM-dd")}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// A block that asks for a decision, ruled in ink, or in the state colour
// when the decision cannot be undone
function Notice({
  tone = "ink",
  children,
}: {
  tone?: "ink" | "state"
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex max-w-[60ch] flex-col gap-4 border p-4",
        tone === "state" ? "border-destructive" : "border-ink"
      )}
    >
      {children}
    </div>
  )
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const backup = useBackupSync()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null)
  const [pendingClear, setPendingClear] = useState(false)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (!isValidBackup(data)) {
          setImportError("That file is not a VestWise backup.")
          return
        }
        setPendingBackup(data)
      } catch {
        setImportError("That file could not be read as JSON.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  function applyBackup(data: BackupData) {
    applyDataSnapshot(data)
    setPendingBackup(null)
    window.location.reload()
  }

  async function handleLoadFromConnectedFile() {
    const data = await backup.loadFromFile()
    if (data) setPendingBackup(data)
  }

  return (
    <div className="flex flex-col gap-line">
      <PageHeader
        title="Settings"
        lede="How the app looks, and where your data lives."
      />

      <Part
        title="Theme"
        description="Day or night, or whatever your system is set to."
      >
        <div className="flex flex-col gap-3">
          <Label htmlFor="theme-select" className="sr-only">
            Theme
          </Label>
          <Select
            value={theme}
            onValueChange={(value) => {
              if (value) setTheme(value)
            }}
          >
            <SelectTrigger id="theme-select" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[0.875rem] text-ink-soft">
            Press <kbd>d</kbd> anywhere to switch between light and dark.
          </p>
        </div>
      </Part>

      <Part
        title="Your data"
        description="Export your grants, valuations and preferences to a JSON file, or import one."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadExport}>
              <Download data-icon="inline-start" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload data-icon="inline-start" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          {importError && (
            <p role="alert" className="text-[0.9375rem] text-destructive">
              {importError}
            </p>
          )}
          {pendingBackup && (
            <Notice tone="state">
              <p className="text-[0.9375rem] leading-snug">
                This replaces everything in the app with the backup (
                {pendingBackup.grants.length}{" "}
                {pendingBackup.grants.length === 1 ? "grant" : "grants"}).
                Continue?
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="destructive"
                  onClick={() => applyBackup(pendingBackup)}
                >
                  Replace my data
                </Button>
                <Button variant="ghost" onClick={() => setPendingBackup(null)}>
                  Cancel
                </Button>
              </div>
            </Notice>
          )}
        </div>
      </Part>

      <Part
        title="Connected file"
        description="Keep a JSON file on your computer in step with the app. Save it inside your iCloud Drive or Google Drive folder and it backs up on its own. VestWise never talks to those services."
      >
        <div className="flex flex-col gap-4">
          {backup.status === "unsupported" && (
            <p className="max-w-[60ch] text-[0.9375rem] leading-snug text-ink-soft">
              This browser cannot connect a file. Chrome, Edge and other
              Chromium browsers can.
            </p>
          )}

          {backup.status === "loading" && (
            <p className="text-[0.9375rem] text-ink-soft">
              Checking the connected file.
            </p>
          )}

          {backup.status === "disconnected" && (
            <div>
              <Button variant="outline" onClick={backup.connect}>
                <LinkIcon data-icon="inline-start" />
                Connect a file
              </Button>
            </div>
          )}

          {backup.status === "needs-permission" && (
            <Notice>
              <p className="text-[0.9375rem] leading-snug">
                The browser needs your permission again to reach{" "}
                <span className="font-semibold">{backup.fileName}</span>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={backup.reconnect}>
                  Grant access
                </Button>
                <Button variant="ghost" onClick={backup.disconnect}>
                  Disconnect
                </Button>
              </div>
            </Notice>
          )}

          {(backup.status === "connected" || backup.status === "syncing") && (
            <Notice>
              <div className="min-w-0">
                <p
                  className="truncate text-[0.9375rem] font-semibold"
                  title={backup.fileName ?? undefined}
                >
                  {backup.fileName}
                </p>
                <p className="mt-1 text-[0.875rem] text-ink-soft">
                  {backup.status === "syncing"
                    ? "Saving"
                    : backup.lastSyncedAt
                      ? `Saved ${formatDistanceToNow(backup.lastSyncedAt, { addSuffix: true })}`
                      : "Connected"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={backup.saveNow}
                  disabled={backup.status === "syncing"}
                >
                  <Download data-icon="inline-start" />
                  Save now
                </Button>
                <Button variant="outline" onClick={handleLoadFromConnectedFile}>
                  <Upload data-icon="inline-start" />
                  Load from file
                </Button>
                <Button variant="ghost" onClick={backup.disconnect}>
                  <Unlink data-icon="inline-start" />
                  Disconnect
                </Button>
              </div>
            </Notice>
          )}

          {backup.status === "conflict" && (
            <Notice tone="state">
              <p className="text-[0.9375rem] leading-snug">
                <span className="font-semibold">{backup.fileName}</span> and the
                data in this browser differ. The file was probably updated from
                another device. Pick the version to keep; the other is
                overwritten.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleLoadFromConnectedFile}>
                  Use the file
                </Button>
                <Button
                  variant="destructive"
                  onClick={backup.resolveConflictKeepLocal}
                >
                  Keep this browser's data
                </Button>
                <Button variant="ghost" onClick={backup.disconnect}>
                  Disconnect
                </Button>
              </div>
            </Notice>
          )}

          {backup.status === "error" && (
            <Notice tone="state">
              <p
                role="alert"
                className="text-[0.9375rem] leading-snug text-destructive"
              >
                {backup.error ??
                  "Something went wrong with the connected file."}
              </p>
              <div className="flex flex-wrap gap-3">
                {backup.fileName && (
                  <Button variant="outline" onClick={backup.reconnect}>
                    Try again
                  </Button>
                )}
                <Button variant="ghost" onClick={backup.disconnect}>
                  Disconnect
                </Button>
              </div>
            </Notice>
          )}

          {backup.status !== "error" && backup.error && (
            <p role="alert" className="text-[0.9375rem] text-destructive">
              {backup.error}
            </p>
          )}
        </div>
      </Part>

      <Part
        title="Clear all data"
        description="Delete every grant, valuation and preference from this browser. A connected file is left as it is."
      >
        <div className="flex flex-col gap-4">
          <div>
            <Button variant="destructive" onClick={() => setPendingClear(true)}>
              <Trash2 data-icon="inline-start" />
              Clear all data
            </Button>
          </div>
          {pendingClear && (
            <Notice tone="state">
              <p className="text-[0.9375rem] leading-snug">
                This deletes all your grants, valuations, column settings and
                theme from this browser. It cannot be undone.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="destructive"
                  onClick={() => {
                    localStorage.removeItem("vsop-grants")
                    localStorage.removeItem("vsop-valuations")
                    localStorage.removeItem("vsop-column-config")
                    localStorage.removeItem("vsop-sort-config")
                    localStorage.removeItem("vsop-cumulative-chart-mode")
                    localStorage.removeItem("theme")
                    window.location.reload()
                  }}
                >
                  Delete everything
                </Button>
                <Button variant="ghost" onClick={() => setPendingClear(false)}>
                  Cancel
                </Button>
              </div>
            </Notice>
          )}
        </div>
      </Part>
    </div>
  )
}
