import { useMemo, useState } from 'react'
import { BadsConfirmModal } from '../components/BadsConfirmModal'
import { MappingStep } from '../components/MappingStep'
import { SummaryStep } from '../components/SummaryStep'
import { SwipeDeck } from '../components/SwipeDeck'
import {
  downloadCsv,
  guessMapping,
  leadsToCsv,
  parseCsvFile,
} from '../lib/csv'
import { appendHistory } from '../lib/history'
import {
  applyKeepMany,
  countBads,
  findCompanyDuplicates,
  findEmailDuplicates,
  removeBads,
} from '../lib/rules'
import type {
  CleanStats,
  ColumnMapping,
  DuplicateGroup,
  Lead,
  WizardStep,
} from '../types/lead'

type CleanWizardProps = {
  onCancel: () => void
  onComplete: () => void
}

type DecisionSnapshot = {
  step: 'email' | 'empresa'
  leads: Lead[]
  stats: CleanStats
  emailQueue: DuplicateGroup[]
  emailIndex: number
  companyQueue: DuplicateGroup[]
  companyIndex: number
}

const emptyStats = (): CleanStats => ({
  totalIn: 0,
  kept: 0,
  removedBads: 0,
  removedEmail: 0,
  removedCompany: 0,
})

export function CleanWizard({ onCancel, onComplete }: CleanWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [sourceLeads, setSourceLeads] = useState<Lead[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [stats, setStats] = useState<CleanStats>(emptyStats)
  const [emailQueue, setEmailQueue] = useState<DuplicateGroup[]>([])
  const [emailIndex, setEmailIndex] = useState(0)
  const [companyQueue, setCompanyQueue] = useState<DuplicateGroup[]>([])
  const [companyIndex, setCompanyIndex] = useState(0)
  const [badCount, setBadCount] = useState(0)
  const [parseError, setParseError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [logged, setLogged] = useState(false)
  const [undoStack, setUndoStack] = useState<DecisionSnapshot[]>([])

  const currentEmailGroup = emailQueue[emailIndex]
  const currentCompanyGroup = companyQueue[companyIndex]

  const progressLabel = useMemo(() => {
    const labels: Record<WizardStep, string> = {
      upload: '1 · Upload',
      mapping: '2 · Colunas',
      bads: '3 · Bads',
      email: '4 · E-mails',
      empresa: '5 · Empresas',
      summary: '6 · Resumo',
    }
    return labels[step]
  }, [step])

  function pushSnapshot(snapshot: DecisionSnapshot) {
    setUndoStack((stack) => [...stack, snapshot])
  }

  function currentSnapshot(currentStep: 'email' | 'empresa'): DecisionSnapshot {
    return {
      step: currentStep,
      leads,
      stats,
      emailQueue,
      emailIndex,
      companyQueue,
      companyIndex,
    }
  }

  function restoreSnapshot(snapshot: DecisionSnapshot) {
    setLeads(snapshot.leads)
    setStats(snapshot.stats)
    setEmailQueue(snapshot.emailQueue)
    setEmailIndex(snapshot.emailIndex)
    setCompanyQueue(snapshot.companyQueue)
    setCompanyIndex(snapshot.companyIndex)
    setStep(snapshot.step)
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setParseError('')
    try {
      const parsed = await parseCsvFile(file)
      if (parsed.leads.length === 0) {
        setParseError('O arquivo não contém linhas válidas.')
        return
      }
      setFileName(file.name)
      setHeaders(parsed.headers)
      setSourceLeads(parsed.leads)
      setLeads(parsed.leads)
      setMapping(guessMapping(parsed.headers))
      setStats({ ...emptyStats(), totalIn: parsed.leads.length })
      setLogged(false)
      setUndoStack([])
      setEmailQueue([])
      setCompanyQueue([])
      setEmailIndex(0)
      setCompanyIndex(0)
      setStep('mapping')
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Falha ao ler o CSV.')
    }
  }

  function goToBadsConfirm() {
    const count = countBads(leads, mapping)
    setBadCount(count)
    setUndoStack([])
    if (count === 0) {
      startEmailQueue(leads, { ...stats, removedBads: 0 })
      return
    }
    setStep('bads')
  }

  function startEmailQueue(nextLeads: Lead[], nextStats: CleanStats) {
    const groups = findEmailDuplicates(nextLeads, mapping)
    setLeads(nextLeads)
    setStats(nextStats)
    setEmailQueue(groups)
    setEmailIndex(0)
    setCompanyQueue([])
    setCompanyIndex(0)
    if (groups.length === 0) {
      startCompanyQueue(nextLeads, nextStats)
      return
    }
    setStep('email')
  }

  function startCompanyQueue(nextLeads: Lead[], nextStats: CleanStats) {
    const groups = findCompanyDuplicates(nextLeads, mapping)
    setLeads(nextLeads)
    setStats(nextStats)
    setCompanyQueue(groups)
    setCompanyIndex(0)
    if (groups.length === 0) {
      finish(nextLeads, nextStats)
      return
    }
    setStep('empresa')
  }

  function confirmBads() {
    const { kept, removed } = removeBads(leads, mapping)
    startEmailQueue(kept, { ...stats, removedBads: removed })
  }

  function keepFromEmail(leadIds: string[]) {
    const group = emailQueue[emailIndex]
    if (!group || leadIds.length === 0) return
    pushSnapshot(currentSnapshot('email'))
    const { leads: nextLeads, removed } = applyKeepMany(leads, group, leadIds)
    const nextStats = {
      ...stats,
      removedEmail: stats.removedEmail + removed,
    }
    setLeads(nextLeads)
    setStats(nextStats)

    const nextIndex = emailIndex + 1
    if (nextIndex >= emailQueue.length) {
      startCompanyQueue(nextLeads, nextStats)
      return
    }
    setEmailIndex(nextIndex)
  }

  function keepFromCompany(leadIds: string[]) {
    const group = companyQueue[companyIndex]
    if (!group || leadIds.length === 0) return
    pushSnapshot(currentSnapshot('empresa'))
    const { leads: nextLeads, removed } = applyKeepMany(leads, group, leadIds)
    const nextStats = {
      ...stats,
      removedCompany: stats.removedCompany + removed,
      kept: nextLeads.length,
    }
    setLeads(nextLeads)
    setStats(nextStats)

    const nextIndex = companyIndex + 1
    if (nextIndex >= companyQueue.length) {
      finish(nextLeads, nextStats)
      return
    }
    setCompanyIndex(nextIndex)
  }

  function handleDeckBack() {
    if (undoStack.length > 0) {
      const stack = [...undoStack]
      const prev = stack.pop()!
      setUndoStack(stack)
      restoreSnapshot(prev)
      return
    }

    // Sem decisões: volta ao mapeamento com a base original
    setLeads(sourceLeads)
    setStats({ ...emptyStats(), totalIn: sourceLeads.length })
    setEmailQueue([])
    setCompanyQueue([])
    setEmailIndex(0)
    setCompanyIndex(0)
    setStep('mapping')
  }

  function finish(finalLeads: Lead[], finalStats: CleanStats) {
    const complete: CleanStats = {
      ...finalStats,
      kept: finalLeads.length,
    }
    setLeads(finalLeads)
    setStats(complete)
    if (!logged) {
      appendHistory({
        fileName,
        totalIn: complete.totalIn,
        kept: complete.kept,
        removedBads: complete.removedBads,
        removedEmail: complete.removedEmail,
        removedCompany: complete.removedCompany,
      })
      setLogged(true)
    }
    setStep('summary')
  }

  function exportCsv() {
    const csv = leadsToCsv(leads, headers)
    const base = fileName.replace(/\.csv$/i, '') || 'leads'
    downloadCsv(csv, `${base}-limpo.csv`)
  }

  const canGoBackDeck =
    undoStack.length > 0 || step === 'email' || step === 'empresa'

  return (
    <div className="wizard">
      <div className="wizard-bar">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <span className="wizard-step">{progressLabel}</span>
      </div>

      {step === 'upload' && (
        <div className="step-card">
          <div className="section-head">
            <h2>Enviar CSV</h2>
            <p className="muted">
              Arraste o arquivo ou selecione no computador. O processamento
              ocorre neste navegador.
            </p>
          </div>
          <label
            className={`dropzone ${dragging ? 'is-dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              void handleFile(e.dataTransfer.files?.[0])
            }}
          >
            <span className="dropzone-title">Solte o CSV aqui</span>
            <span className="muted">ou clique para escolher</span>
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </label>
          {parseError && <p className="form-error">{parseError}</p>}
        </div>
      )}

      {step === 'mapping' && (
        <MappingStep
          headers={headers}
          mapping={mapping}
          onChange={setMapping}
          onBack={() => setStep('upload')}
          onContinue={goToBadsConfirm}
        />
      )}

      {step === 'bads' && (
        <BadsConfirmModal
          count={badCount}
          onCancel={() => setStep('mapping')}
          onConfirm={confirmBads}
        />
      )}

      {step === 'email' && currentEmailGroup && (
        <SwipeDeck
          group={currentEmailGroup}
          mapping={mapping}
          index={emailIndex}
          total={emailQueue.length}
          canGoBack={canGoBackDeck}
          onKeep={keepFromEmail}
          onBack={handleDeckBack}
        />
      )}

      {step === 'empresa' && currentCompanyGroup && (
        <SwipeDeck
          group={currentCompanyGroup}
          mapping={mapping}
          index={companyIndex}
          total={companyQueue.length}
          canGoBack={canGoBackDeck}
          onKeep={keepFromCompany}
          onBack={handleDeckBack}
        />
      )}

      {step === 'summary' && (
        <SummaryStep
          fileName={fileName}
          stats={stats}
          onExport={exportCsv}
          onFinish={onComplete}
        />
      )}
    </div>
  )
}
