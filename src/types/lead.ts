export type LeadRow = Record<string, string>

export type Lead = {
  id: string
  row: LeadRow
}

export type SystemField =
  | 'email'
  | 'empresa'
  | 'identificador'
  | 'nome'
  | 'telefone'
  | 'celular'
  | 'dataConversao'

export type ColumnMapping = Partial<Record<SystemField, string>>

export type DuplicateReason = 'email' | 'empresa'

export type DuplicateGroup = {
  id: string
  reason: DuplicateReason
  key: string
  leads: Lead[]
}

export type CleanStats = {
  totalIn: number
  kept: number
  removedBads: number
  removedDomains: number
  removedEmail: number
  removedCompany: number
}

export type HistoryEntry = {
  id: string
  at: string
  fileName: string
  totalIn: number
  kept: number
  removedBads: number
  removedDomains: number
  removedEmail: number
  removedCompany: number
}

export type WizardStep =
  | 'upload'
  | 'mapping'
  | 'domains'
  | 'bads'
  | 'email'
  | 'empresa'
  | 'summary'
