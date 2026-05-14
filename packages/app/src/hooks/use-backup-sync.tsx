/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  type BackupData,
  getDataSnapshot,
  isValidBackup,
  serializeSnapshot,
  subscribeToDataChanged,
} from "@/lib/backup-data"
import {
  clearSavedHandle,
  getSavedHandle,
  isFileBackupSupported,
  pickBackupFile,
  queryHandlePermission,
  readFile,
  requestHandlePermission,
  saveHandle,
  writeFile,
} from "@/lib/file-backup"

export type BackupSyncStatus =
  | "loading"
  | "unsupported"
  | "disconnected"
  | "needs-permission"
  | "connected"
  | "syncing"
  | "conflict"
  | "error"

export interface BackupSyncValue {
  status: BackupSyncStatus
  fileName: string | null
  lastSyncedAt: number | null
  error: string | null
  connect: () => Promise<void>
  reconnect: () => Promise<void>
  disconnect: () => Promise<void>
  saveNow: () => Promise<void>
  loadFromFile: () => Promise<BackupData | null>
  resolveConflictKeepLocal: () => Promise<void>
}

const SUGGESTED_NAME = "vestwise-backup.json"
const SYNC_DEBOUNCE_MS = 750

const BackupSyncContext = createContext<BackupSyncValue | undefined>(undefined)

function toErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError"
}

export function BackupSyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BackupSyncStatus>("loading")
  const [fileName, setFileName] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRef = useRef<FileSystemFileHandle | null>(null)
  // The exact serialized JSON we last successfully wrote to the file. Used
  // as a baseline for two checks: (1) skip writes when local data hasn't
  // changed, and (2) detect external edits before clobbering them.
  const lastWrittenContentsRef = useRef<string | null>(null)
  const statusRef = useRef<BackupSyncStatus>("loading")
  const debounceTimerRef = useRef<number | null>(null)
  const inFlightRef = useRef<Promise<void> | null>(null)

  const updateStatus = useCallback((next: BackupSyncStatus) => {
    statusRef.current = next
    setStatus(next)
  }, [])

  const writeAndRecord = useCallback(
    async (contents: string): Promise<void> => {
      const handle = handleRef.current
      if (!handle) return
      updateStatus("syncing")
      await writeFile(handle, contents)
      lastWrittenContentsRef.current = contents
      setLastSyncedAt(Date.now())
      setError(null)
      updateStatus("connected")
    },
    [updateStatus],
  )

  const reconcileWithFile = useCallback(async (): Promise<void> => {
    const handle = handleRef.current
    if (!handle) return
    try {
      const file = await readFile(handle)
      const currentContents = serializeSnapshot(getDataSnapshot())
      if (file.contents.trim().length === 0) {
        // Fresh / empty file — adopt local state.
        await writeAndRecord(currentContents)
        return
      }
      if (file.contents === currentContents) {
        lastWrittenContentsRef.current = currentContents
        setError(null)
        updateStatus("connected")
        return
      }
      // File diverges from local. Either:
      //   - file holds older data we haven't loaded yet, or
      //   - another device synced in newer data, or
      //   - we made local changes while disconnected.
      // We don't know which, so we surface as a conflict and stop auto-sync
      // until the user picks a side.
      lastWrittenContentsRef.current = file.contents
      updateStatus("conflict")
    } catch (e) {
      setError(toErrorMessage(e))
      updateStatus("error")
    }
  }, [updateStatus, writeAndRecord])

  const performSync = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) {
      await inFlightRef.current
    }
    const job = (async () => {
      const handle = handleRef.current
      if (!handle) return
      if (statusRef.current !== "connected" && statusRef.current !== "syncing") {
        return
      }
      const currentContents = serializeSnapshot(getDataSnapshot())
      if (currentContents === lastWrittenContentsRef.current) {
        return
      }
      try {
        // Compare-and-swap: if the file changed since our last write,
        // somebody else (Drive sync, another tab) touched it. Bail so we
        // don't clobber their changes.
        const file = await readFile(handle)
        if (
          lastWrittenContentsRef.current !== null &&
          file.contents !== lastWrittenContentsRef.current
        ) {
          lastWrittenContentsRef.current = file.contents
          updateStatus("conflict")
          return
        }
        await writeAndRecord(currentContents)
      } catch (e) {
        setError(toErrorMessage(e))
        updateStatus("error")
      }
    })()
    inFlightRef.current = job
    try {
      await job
    } finally {
      inFlightRef.current = null
    }
  }, [updateStatus, writeAndRecord])

  const scheduleSync = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null
      void performSync()
    }, SYNC_DEBOUNCE_MS)
  }, [performSync])

  const flushNow = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    void performSync()
  }, [performSync])

  useEffect(() => {
    let cancelled = false
    async function init() {
      if (!isFileBackupSupported()) {
        if (!cancelled) updateStatus("unsupported")
        return
      }
      try {
        const handle = await getSavedHandle()
        if (cancelled) return
        if (!handle) {
          updateStatus("disconnected")
          return
        }
        handleRef.current = handle
        setFileName(handle.name)
        const permission = await queryHandlePermission(handle)
        if (cancelled) return
        if (permission !== "granted") {
          updateStatus("needs-permission")
          return
        }
        await reconcileWithFile()
      } catch (e) {
        if (cancelled) return
        setError(toErrorMessage(e))
        updateStatus("error")
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [reconcileWithFile, updateStatus])

  useEffect(() => {
    const onChange = () => {
      if (!handleRef.current) return
      if (
        statusRef.current !== "connected" &&
        statusRef.current !== "syncing"
      ) {
        return
      }
      scheduleSync()
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushNow()
    }
    const onPageHide = () => flushNow()

    const unsub = subscribeToDataChanged(onChange)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onPageHide)

    return () => {
      unsub()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onPageHide)
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [flushNow, scheduleSync])

  const connect = useCallback(async () => {
    if (!isFileBackupSupported()) return
    setError(null)
    try {
      const handle = await pickBackupFile(SUGGESTED_NAME)
      await saveHandle(handle)
      handleRef.current = handle
      setFileName(handle.name)
      const permission = await queryHandlePermission(handle)
      if (permission !== "granted") {
        const requested = await requestHandlePermission(handle)
        if (requested !== "granted") {
          updateStatus("needs-permission")
          return
        }
      }
      // Treat the connect step as "save current data to the chosen file."
      // showSaveFilePicker already warned the user if they picked an
      // existing file — they've consented to overwrite.
      const contents = serializeSnapshot(getDataSnapshot())
      await writeAndRecord(contents)
    } catch (e) {
      if (isAbortError(e)) return
      setError(toErrorMessage(e))
      updateStatus("error")
    }
  }, [updateStatus, writeAndRecord])

  const reconnect = useCallback(async () => {
    const handle = handleRef.current
    if (!handle) return
    setError(null)
    try {
      const permission = await requestHandlePermission(handle)
      if (permission !== "granted") {
        updateStatus("needs-permission")
        return
      }
      await reconcileWithFile()
    } catch (e) {
      setError(toErrorMessage(e))
      updateStatus("error")
    }
  }, [reconcileWithFile, updateStatus])

  const disconnect = useCallback(async () => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    handleRef.current = null
    lastWrittenContentsRef.current = null
    setFileName(null)
    setLastSyncedAt(null)
    setError(null)
    try {
      await clearSavedHandle()
    } catch (e) {
      setError(toErrorMessage(e))
    }
    updateStatus(isFileBackupSupported() ? "disconnected" : "unsupported")
  }, [updateStatus])

  const saveNow = useCallback(async () => {
    const handle = handleRef.current
    if (!handle) return
    try {
      const contents = serializeSnapshot(getDataSnapshot())
      await writeAndRecord(contents)
    } catch (e) {
      setError(toErrorMessage(e))
      updateStatus("error")
    }
  }, [updateStatus, writeAndRecord])

  const loadFromFile = useCallback(async (): Promise<BackupData | null> => {
    const handle = handleRef.current
    if (!handle) return null
    try {
      const file = await readFile(handle)
      const parsed: unknown = JSON.parse(file.contents)
      if (!isValidBackup(parsed)) {
        setError("That file doesn't look like a VestWise backup.")
        return null
      }
      // Caller will applyDataSnapshot + reload. Seed lastWritten so the
      // next sync after the reload (which will see identical data) is a
      // no-op rather than a redundant write.
      lastWrittenContentsRef.current = file.contents
      return parsed
    } catch (e) {
      setError(toErrorMessage(e))
      return null
    }
  }, [])

  const resolveConflictKeepLocal = useCallback(async () => {
    const handle = handleRef.current
    if (!handle) return
    try {
      const contents = serializeSnapshot(getDataSnapshot())
      // User chose local — write through unconditionally (no CAS).
      updateStatus("syncing")
      await writeFile(handle, contents)
      lastWrittenContentsRef.current = contents
      setLastSyncedAt(Date.now())
      setError(null)
      updateStatus("connected")
    } catch (e) {
      setError(toErrorMessage(e))
      updateStatus("error")
    }
  }, [updateStatus])

  const value = useMemo<BackupSyncValue>(
    () => ({
      status,
      fileName,
      lastSyncedAt,
      error,
      connect,
      reconnect,
      disconnect,
      saveNow,
      loadFromFile,
      resolveConflictKeepLocal,
    }),
    [
      status,
      fileName,
      lastSyncedAt,
      error,
      connect,
      reconnect,
      disconnect,
      saveNow,
      loadFromFile,
      resolveConflictKeepLocal,
    ],
  )

  return (
    <BackupSyncContext.Provider value={value}>
      {children}
    </BackupSyncContext.Provider>
  )
}

export function useBackupSync(): BackupSyncValue {
  const ctx = useContext(BackupSyncContext)
  if (!ctx) {
    throw new Error("useBackupSync must be used within a BackupSyncProvider")
  }
  return ctx
}
