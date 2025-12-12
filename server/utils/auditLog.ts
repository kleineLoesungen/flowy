import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const LOG_FILE = path.join(DATA_DIR, 'logs.json')

export type LogType =
  | 'comment_added'
  | 'comment_deleted'
  | 'flow_created'
  | 'flow_deleted'
  | 'flow_completed'
  | 'flow_updated'
  | 'template_created'
  | 'template_deleted'
  | 'template_updated'
  | 'element_created'
  | 'element_deleted'
  | 'element_updated'
  | 'mail_sent'
  | 'log'

export type LogEntry = {
  id: string
  timestamp: string // ISO timestamp
  type: LogType
  flowId: string | null
  templateId: string | null
  elementId: string | null
  commentId: string | null
  changedBy: string | null
  message?: string
  details?: any
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (e) {
    // ignore
  }
}

async function readAll(): Promise<LogEntry[]> {
  try {
    await ensureDataDir()
    const raw = await fs.readFile(LOG_FILE, 'utf8')
    const arr = JSON.parse(raw || '[]') as any[]
    // Normalize older entries to the new schema
    return arr.map(a => {
      const obj: any = {}
      obj.id = a.id || a.id
      obj.timestamp = a.timestamp || a.ts || new Date().toISOString()
      // coerce/normalize legacy or unexpected types into our LogType union
      const t = a.type || 'log'
      let mapped: string = typeof t === 'string' ? t : 'log'
      // map legacy names to new canonical names
      if (mapped === 'status_change') mapped = 'element_updated'
      if (mapped === 'template_changed') mapped = 'template_updated'
      if (mapped === 'mail_send' || mapped === 'mail') mapped = 'mail_sent'
      if (mapped === 'open_flow') mapped = 'log'
      obj.type = (mapped as LogType) || 'log'
      obj.flowId = a.flowId ?? null
      obj.templateId = a.templateId ?? null
      obj.elementId = a.elementId ?? null
      obj.commentId = a.commentId ?? null
      obj.changedBy = a.changedBy ?? a.userEmail ?? null
      obj.message = a.message
      obj.details = a.details === undefined ? null : a.details
      return obj as LogEntry
    })
  } catch (e) {
    return []
  }
}

async function writeAll(entries: LogEntry[]) {
  await ensureDataDir()
  await fs.writeFile(LOG_FILE, JSON.stringify(entries, null, 2), 'utf8')
}

export async function addLog(entry: Partial<LogEntry>) {
  const all = await readAll()
  const item: LogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    type: (entry.type as LogType) || 'log',
    flowId: entry.flowId ?? null,
    templateId: entry.templateId ?? null,
    elementId: entry.elementId ?? null,
    commentId: (entry as any).commentId ?? null,
    changedBy: (entry as any).changedBy ?? null,
    message: entry.message,
    details: entry.details || null
  }
  // Append new item
  all.push(item)

  // If this is a comment/update/mail/status change, remove immediately-preceding 'open_flow' entries
  // for the same flow and user within the last 30 seconds to avoid noisy "open -> action" pairs
  try {
    const collapseTypes: LogType[] = ['comment_added', 'comment_deleted', 'element_updated', 'flow_updated', 'mail_sent']
    if (collapseTypes.includes(item.type) && item.flowId) {
      // legacy: used to collapse recent 'open_flow' entries to avoid noisy open->action pairs.
      // We no longer emit 'open_flow' entries; preserve existing list but don't attempt to remove entries here.
      await writeAll(all)
    } else {
      await writeAll(all)
    }
  } catch (e) {
    // fallback: write full list if collapsing failed
    try { await writeAll(all) } catch (err) { /* ignore */ }
  }

  // Cleanup short-lived logs (opened flows & template changes older than 30 days)
  void cleanupOld()
  return item
}

export async function queryLogs(opts: { type?: string; flowId?: string; elementId?: string; templateId?: string; commentId?: string; changedBy?: string; day?: string; limit?: number; offset?: number }) {
  const all = await readAll()
  let filtered = all

  if (opts.type) filtered = filtered.filter(f => f.type === opts.type)
  if (opts.flowId) filtered = filtered.filter(f => f.flowId === opts.flowId)
  if (opts.elementId) filtered = filtered.filter(f => f.elementId === opts.elementId)
  if (opts.templateId) filtered = filtered.filter(f => f.templateId === opts.templateId)
  if (opts.commentId) filtered = filtered.filter(f => f.commentId === opts.commentId)
  if (opts.changedBy) filtered = filtered.filter(f => f.changedBy === opts.changedBy)
  const day = opts.day
  if (day) {
    // expect YYYY-MM-DD
    filtered = filtered.filter(f => (f as any).timestamp.startsWith(day))
  }

  // sort desc
  filtered.sort((a, b) => ((a as any).timestamp < (b as any).timestamp ? 1 : -1))

  const offset = opts.offset || 0
  const limit = opts.limit || 200
  return {
    total: filtered.length,
    data: filtered.slice(offset, offset + limit)
  }
}

async function cleanupOld() {
  try {
    const all = await readAll()
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days
    const keep = all.filter(e => {
      if (!(e as any).timestamp) return true
      // short-lived: template updates (historical behavior)
      if (['template_updated'].includes(e.type)) {
        return new Date((e as any).timestamp).getTime() >= cutoff
      }
      return true
    })
    if (keep.length !== all.length) {
      await writeAll(keep)
    }
  } catch (e) {
    // ignore
  }
}

// Export helper to run cleanup on startup
export async function initAuditLog() {
  await ensureDataDir()
  try {
    await fs.access(LOG_FILE)
  } catch {
    await writeAll([])
  }
  void cleanupOld()
}
