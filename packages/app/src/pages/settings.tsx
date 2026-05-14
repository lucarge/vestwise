import { useRef, useState } from "react"
import { Download, Link as LinkIcon, Trash2, Unlink, Upload } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

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
          setImportError("Invalid backup file.")
          return
        }
        setPendingBackup(data)
      } catch {
        setImportError("Could not parse the file as JSON.")
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your preferences.
        </p>
      </div>
      <div className="max-w-sm space-y-2">
        <Label htmlFor="theme-select">Theme</Label>
        <Select
          value={theme}
          onValueChange={(value) => {
            if (value) setTheme(value)
          }}
        >
          <SelectTrigger id="theme-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          You can also press <kbd>d</kbd> to toggle between light and dark mode.
        </p>
      </div>
      <div className="max-w-sm space-y-2">
        <Label>Data</Label>
        <p className="text-xs text-muted-foreground">
          Export or import your grants and preferences.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadExport}>
            <Download className="mr-1.5 size-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1.5 size-4" />
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
          <p className="text-xs text-destructive">{importError}</p>
        )}
        {pendingBackup && (
          <div className="rounded-md border border-border bg-muted/50 p-3 space-y-2">
            <p className="text-xs">
              This will replace all your current data ({pendingBackup.grants.length}{" "}
              {pendingBackup.grants.length === 1 ? "grant" : "grants"} in
              backup). Continue?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => applyBackup(pendingBackup)}
              >
                Replace data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingBackup(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="max-w-sm space-y-2">
        <Label>Connected file</Label>
        <p className="text-xs text-muted-foreground">
          Keep a JSON file on your computer in sync with your data. Save it
          inside your Google Drive or iCloud Drive folder and it backs up
          automatically.
        </p>

        {backup.status === "unsupported" && (
          <p className="text-xs text-muted-foreground">
            Your browser doesn't support this. Try Chrome, Edge, or another
            Chromium-based browser.
          </p>
        )}

        {backup.status === "loading" && (
          <p className="text-xs text-muted-foreground">Loading…</p>
        )}

        {backup.status === "disconnected" && (
          <Button variant="outline" size="sm" onClick={backup.connect}>
            <LinkIcon className="mr-1.5 size-4" />
            Connect a file
          </Button>
        )}

        {backup.status === "needs-permission" && (
          <div className="rounded-md border border-border bg-muted/50 p-3 space-y-2">
            <p className="text-xs">
              Browser permission needed to access{" "}
              <span className="font-medium">{backup.fileName}</span>.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={backup.reconnect}>
                Grant access
              </Button>
              <Button size="sm" variant="ghost" onClick={backup.disconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {(backup.status === "connected" || backup.status === "syncing") && (
          <div className="rounded-md border border-border bg-muted/50 p-3 space-y-2">
            <div className="min-w-0">
              <p
                className="truncate text-xs font-medium"
                title={backup.fileName ?? undefined}
              >
                {backup.fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                {backup.status === "syncing"
                  ? "Saving…"
                  : backup.lastSyncedAt
                    ? `Last saved ${formatDistanceToNow(backup.lastSyncedAt, { addSuffix: true })}`
                    : "Connected"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={backup.saveNow}
                disabled={backup.status === "syncing"}
              >
                <Download className="mr-1.5 size-4" />
                Save now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLoadFromConnectedFile}
              >
                <Upload className="mr-1.5 size-4" />
                Load from file
              </Button>
              <Button size="sm" variant="ghost" onClick={backup.disconnect}>
                <Unlink className="mr-1.5 size-4" />
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {backup.status === "conflict" && (
          <div className="rounded-md border border-destructive/40 bg-muted/50 p-3 space-y-2">
            <p className="text-xs">
              <span className="font-medium">{backup.fileName}</span> and your
              local data don't match. This usually means the file was updated
              from another device. Pick which version to keep — the other will
              be overwritten.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleLoadFromConnectedFile}
              >
                Use file
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={backup.resolveConflictKeepLocal}
              >
                Keep local
              </Button>
              <Button size="sm" variant="ghost" onClick={backup.disconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {backup.status === "error" && (
          <div className="rounded-md border border-destructive/40 bg-muted/50 p-3 space-y-2">
            <p className="text-xs text-destructive">
              {backup.error ?? "Something went wrong."}
            </p>
            <div className="flex gap-2">
              {backup.fileName && (
                <Button size="sm" variant="outline" onClick={backup.reconnect}>
                  Retry
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={backup.disconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {backup.status !== "error" && backup.error && (
          <p className="text-xs text-destructive">{backup.error}</p>
        )}
      </div>
      <div className="max-w-sm space-y-2">
        <Label>Danger zone</Label>
        <p className="text-xs text-muted-foreground">
          Permanently delete all grants and preferences.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setPendingClear(true)}
        >
          <Trash2 className="mr-1.5 size-4" />
          Clear all data
        </Button>
        {pendingClear && (
          <div className="rounded-md border border-destructive bg-muted/50 p-3 space-y-2">
            <p className="text-xs">
              This will permanently delete all your grants, valuations, column
              preferences, and theme settings. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
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
                Clear all data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingClear(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
