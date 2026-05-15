// File System Access API helpers + IndexedDB persistence for a single
// backup-file handle. The handle survives reloads, but the user has to
// re-grant write permission on each new session (browser security rule).

type FsaPermissionMode = "read" | "readwrite"
type FsaPermissionState = "granted" | "denied" | "prompt"

interface FsaPermissionDescriptor {
  mode?: FsaPermissionMode
}

// The Permission API integration for FileSystemHandle isn't in lib.dom.d.ts
// yet, so we widen the type locally rather than sprinkling `as any`.
type HandleWithPermissions = FileSystemFileHandle & {
  queryPermission(descriptor?: FsaPermissionDescriptor): Promise<FsaPermissionState>
  requestPermission(descriptor?: FsaPermissionDescriptor): Promise<FsaPermissionState>
}

// showSaveFilePicker is also missing from lib.dom.d.ts — augment Window
// globally rather than casting at the call site.
interface ShowSaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  excludeAcceptAllOption?: boolean
  id?: string
}

declare global {
  interface Window {
    showSaveFilePicker(
      options?: ShowSaveFilePickerOptions,
    ): Promise<FileSystemFileHandle>
  }
}

export function isFileBackupSupported(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window
}

const DB_NAME = "vestwise"
const DB_VERSION = 1
const STORE_NAME = "kv"
const HANDLE_KEY = "backup-file-handle"
const META_KEY = "backup-file-meta"

interface BackupFileMeta {
  lastSyncedAt: number
  // lastModified of the file the last time we wrote to it — used to detect
  // out-of-band edits (e.g. another device syncing in via Drive).
  lastWrittenMtime: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"))
  })
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB()
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result as T | undefined)
      req.onerror = () => reject(req.error ?? new Error("idb get failed"))
    })
  } finally {
    db.close()
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error("idb set failed"))
    })
  } finally {
    db.close()
  }
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      tx.objectStore(STORE_NAME).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error("idb delete failed"))
    })
  } finally {
    db.close()
  }
}

export async function pickBackupFile(
  suggestedName: string,
): Promise<FileSystemFileHandle> {
  return window.showSaveFilePicker({
    suggestedName,
    types: [
      {
        description: "VestWise backup",
        accept: { "application/json": [".json"] },
      },
    ],
    id: "vestwise-backup",
  })
}

export async function getSavedHandle(): Promise<FileSystemFileHandle | null> {
  const handle = await idbGet<FileSystemFileHandle>(HANDLE_KEY)
  return handle ?? null
}

export async function saveHandle(handle: FileSystemFileHandle): Promise<void> {
  await idbSet(HANDLE_KEY, handle)
}

export async function clearSavedHandle(): Promise<void> {
  await idbDelete(HANDLE_KEY)
  await idbDelete(META_KEY)
}

export async function getBackupMeta(): Promise<BackupFileMeta | null> {
  const meta = await idbGet<BackupFileMeta>(META_KEY)
  return meta ?? null
}

export async function setBackupMeta(meta: BackupFileMeta): Promise<void> {
  await idbSet(META_KEY, meta)
}

export async function queryHandlePermission(
  handle: FileSystemFileHandle,
): Promise<FsaPermissionState> {
  return (handle as HandleWithPermissions).queryPermission({ mode: "readwrite" })
}

export async function requestHandlePermission(
  handle: FileSystemFileHandle,
): Promise<FsaPermissionState> {
  return (handle as HandleWithPermissions).requestPermission({
    mode: "readwrite",
  })
}

export async function writeFile(
  handle: FileSystemFileHandle,
  contents: string,
): Promise<{ lastModified: number }> {
  const writable = await handle.createWritable()
  try {
    await writable.write(contents)
  } finally {
    await writable.close()
  }
  const file = await handle.getFile()
  return { lastModified: file.lastModified }
}

export interface ReadFileResult {
  contents: string
  lastModified: number
  name: string
}

export async function readFile(
  handle: FileSystemFileHandle,
): Promise<ReadFileResult> {
  const file = await handle.getFile()
  return {
    contents: await file.text(),
    lastModified: file.lastModified,
    name: file.name,
  }
}
