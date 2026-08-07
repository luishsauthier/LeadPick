import type {
  CleanStats,
  ColumnMapping,
  DuplicateGroup,
  Lead,
  WizardStep,
} from '../types/lead'

const DRAFT_KEY = 'leadpick_cleaning_draft'

export type DecisionSnapshot = {
  step: 'email' | 'empresa'
  leads: Lead[]
  stats: CleanStats
  emailQueue: DuplicateGroup[]
  emailIndex: number
  companyQueue: DuplicateGroup[]
  companyIndex: number
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
}

export type DraftSummary = {
  fileName: string
  savedAt: string
  step: WizardStep
  totalIn: number
  keptSoFar: number
}

const STEP_LABEL: Record<WizardStep, string> = {
  upload: 'Upload',
  mapping: 'Colunas',
  bads: 'Bads',
  email: 'E-mails duplicados',
  empresa: 'Empresas duplicadas',
  summary: 'Resumo',
}

export function stepLabel(step: WizardStep): string {
  return STEP_LABEL[step]
}

export function loadDraft(): CleaningDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CleaningDraft
    if (!parsed?.fileName || !parsed?.step) return null
    return parsed
  } catch {
    return null
  }
}

export function getDraftSummary(): DraftSummary | null {
  const draft = loadDraft()
  if (!draft || draft.step === 'upload') return null
  return {
    fileName: draft.fileName,
    savedAt: draft.savedAt,
    step: draft.step,
    totalIn: draft.stats.totalIn,
    keptSoFar: draft.leads.length,
  }
}

export function saveDraft(draft: Omit<CleaningDraft, 'savedAt'>): boolean {
  if (draft.step === 'upload' || !draft.fileName) {
    return false
  }
  try {
    const full: CleaningDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(full))
    return true
  } catch {
    return false
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
