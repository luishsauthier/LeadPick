import type { HistoryEntry } from '../types/lead'

const STORAGE_KEY = 'leadpick_history_log'
const MAX_ENTRIES = 50

export function listHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function appendHistory(
  entry: Omit<HistoryEntry, 'id' | 'at'> & { at?: string },
): HistoryEntry {
  const full: HistoryEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: entry.at ?? new Date().toISOString(),
    fileName: entry.fileName,
    totalIn: entry.totalIn,
    kept: entry.kept,
    removedBads: entry.removedBads,
    removedEmail: entry.removedEmail,
    removedCompany: entry.removedCompany,
  }
  const next = [full, ...listHistory()].slice(0, MAX_ENTRIES)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return full
}
