import type {
  CleanStats,
  ColumnMapping,
  DuplicateGroup,
  Lead,
  WizardStep,
} from '../types/lead'

const META_KEY = 'leadpick_draft_meta'
const LEGACY_KEY = 'leadpick_cleaning_draft'
const DB_NAME = 'leadpick'
const DB_VERSION = 1
const STORE = 'drafts'
const DRAFT_ID = 'current'

export type DecisionSnapshot = {
  step: 'email' | 'empresa'
  leads: Lead[]
  stats: CleanStats
  emailQueue: DuplicateGroup[]
  emailIndex: number
  companyQueue: DuplicateGroup[]
  companyIndex: number
  chosenIds: string[]
}

export type CleaningDraft = {
  savedAt: string
  fileName: string
  headers: string[]
  sourceLeads: Lead[]
  leads: Lead[]
  mapping: ColumnMapping
  stats: CleanStats
  emailQueue: DuplicateGroup[]
  emailIndex: number
  companyQueue: DuplicateGroup[]
  companyIndex: number
  badCount: number
  logged: boolean
  undoStack: DecisionSnapshot[]
  step: WizardStep
  /** Domínios @ marcados para exclusão */
  excludedDomains?: string[]
}

export type DraftSummary = {
  fileName: string
  savedAt: string
  step: WizardStep
  totalIn: number
  keptSoFar: number
}

export type SaveDraftResult = {
  ok: boolean
  error?: string
  /** true se o draft ficou só em memória nesta sessão */
  memoryOnly?: boolean
}

const STEP_LABEL: Record<WizardStep, string> = {
  upload: 'Upload',
  mapping: 'Colunas',
  domains: 'Domínios @',
  bads: 'Bads',
  email: 'E-mails duplicados',
  empresa: 'Empresas duplicadas',
  summary: 'Resumo',
}

export function stepLabel(step: WizardStep): string {
  return STEP_LABEL[step]
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () =>
      reject(req.error ?? new Error('Falha ao abrir IndexedDB'))
  })
}

function idbGet(): Promise<CleaningDraft | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).get(DRAFT_ID)
        req.onsuccess = () => {
          resolve((req.result as CleaningDraft | undefined) ?? null)
        }
        req.onerror = () =>
          reject(req.error ?? new Error('Falha ao ler rascunho'))
        tx.oncomplete = () => db.close()
      }),
  )
}

function idbSet(draft: CleaningDraft): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(draft, DRAFT_ID)
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () =>
          reject(tx.error ?? new Error('Falha ao gravar rascunho'))
        tx.onabort = () =>
          reject(tx.error ?? new Error('Gravação abortada'))
      }),
  )
}

function idbClear(): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).delete(DRAFT_ID)
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () =>
          reject(tx.error ?? new Error('Falha ao limpar rascunho'))
      }),
  )
}

function writeMeta(draft: CleaningDraft) {
  const meta: DraftSummary = {
    fileName: draft.fileName,
    savedAt: draft.savedAt,
    step: draft.step,
    totalIn: draft.stats.totalIn,
    keptSoFar: draft.leads.length,
  }
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    // meta é opcional; IndexedDB é a fonte da verdade
  }
}

function clearMeta() {
  try {
    localStorage.removeItem(META_KEY)
  } catch {
    // ignore
  }
}

/** Remove rascunhos enormes da versão antiga (localStorage). */
function purgeLegacyStorage() {
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // ignore
  }
}

export function peekDraftSummary(): DraftSummary | null {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftSummary
    if (!parsed?.fileName || !parsed?.step || parsed.step === 'upload') return null
    return parsed
  } catch {
    return null
  }
}

function isValidDraft(value: unknown): value is CleaningDraft {
  if (!value || typeof value !== 'object') return false
  const d = value as CleaningDraft
  return Boolean(d.fileName && d.step && Array.isArray(d.leads))
}

/**
 * Undo em disco infla demais (cada snapshot copia a base inteira).
 * Mantemos undo só em memória na sessão; persistido fica vazio.
 */
function compactDraft(draft: CleaningDraft): CleaningDraft {
  return {
    ...draft,
    undoStack: [],
  }
}

/** Migra rascunho antigo do localStorage (versão anterior do app). */
async function migrateLegacyDraft(): Promise<CleaningDraft | null> {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CleaningDraft
    if (!isValidDraft(parsed) || parsed.step === 'upload') {
      purgeLegacyStorage()
      return null
    }
    const full = compactDraft({
      ...parsed,
      savedAt: parsed.savedAt || new Date().toISOString(),
      undoStack: [],
    })
    await idbSet(full)
    writeMeta(full)
    purgeLegacyStorage()
    return full
  } catch {
    purgeLegacyStorage()
    return null
  }
}

export async function loadDraft(): Promise<CleaningDraft | null> {
  purgeLegacyStorage()
  try {
    const fromIdb = await idbGet()
    if (fromIdb && isValidDraft(fromIdb) && fromIdb.step !== 'upload') {
      writeMeta(fromIdb)
      return compactDraft(fromIdb)
    }
    return await migrateLegacyDraft()
  } catch {
    return await migrateLegacyDraft()
  }
}

export async function getDraftSummary(): Promise<DraftSummary | null> {
  const peek = peekDraftSummary()
  if (peek) return peek
  const draft = await loadDraft()
  if (!draft || draft.step === 'upload') return null
  return {
    fileName: draft.fileName,
    savedAt: draft.savedAt,
    step: draft.step,
    totalIn: draft.stats.totalIn,
    keptSoFar: draft.leads.length,
  }
}

export async function saveDraft(
  draft: Omit<CleaningDraft, 'savedAt'>,
): Promise<SaveDraftResult> {
  if (draft.step === 'upload' || !draft.fileName) {
    return { ok: false, error: 'Nada para salvar nesta etapa.' }
  }

  const full = compactDraft({
    ...draft,
    savedAt: new Date().toISOString(),
  })

  purgeLegacyStorage()

  try {
    await idbSet(full)
    writeMeta(full)
    return { ok: true }
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : 'IndexedDB indisponível neste navegador.'
    return {
      ok: false,
      error: `Não foi possível salvar no navegador (${detail}). Use “Baixar progresso” e guarde o arquivo .json.`,
      memoryOnly: true,
    }
  }
}

export async function clearDraft(): Promise<void> {
  clearMeta()
  purgeLegacyStorage()
  try {
    await idbClear()
  } catch {
    // ignore
  }
}

export function downloadDraftBackup(draft: CleaningDraft) {
  const payload = {
    app: 'LeadPick',
    version: 2,
    exportedAt: new Date().toISOString(),
    draft: compactDraft({
      ...draft,
      savedAt: draft.savedAt || new Date().toISOString(),
    }),
  }
  const blob = new Blob([JSON.stringify(payload)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const base = draft.fileName.replace(/\.csv$/i, '') || 'leads'
  a.href = url
  a.download = `${base}-progresso-leadpick.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importDraftFromFile(file: File): Promise<{
  draft: CleaningDraft
  persisted: boolean
  warning?: string
}> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Arquivo JSON inválido.')
  }

  const root = parsed as { draft?: CleaningDraft } & CleaningDraft
  const draft = isValidDraft(root.draft)
    ? root.draft
    : isValidDraft(root)
      ? root
      : null

  if (!draft || draft.step === 'upload') {
    throw new Error('Arquivo de progresso inválido.')
  }

  const full = compactDraft({
    ...draft,
    savedAt: new Date().toISOString(),
    undoStack: [],
  })

  const result = await saveDraft(full)
  if (!result.ok) {
    return {
      draft: full,
      persisted: false,
      warning:
        'Progresso carregado só nesta sessão (navegador sem espaço/IndexedDB). Use “Baixar progresso” com frequência.',
    }
  }
  return { draft: full, persisted: true }
}
