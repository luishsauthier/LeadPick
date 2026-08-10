import { useEffect, useMemo, useState } from 'react'
import { BadsConfirmModal } from '../components/BadsConfirmModal'
import { StepTip } from '../components/Guide'
import { MappingStep } from '../components/MappingStep'
import { SummaryStep } from '../components/SummaryStep'
import { SwipeDeck } from '../components/SwipeDeck'
import {
  downloadCsv,
  guessMapping,
  leadsToCsv,
  parseCsvFile,
} from '../lib/csv'
import {
  clearDraft,
  downloadDraftBackup,
  saveDraft,
  type CleaningDraft,
  type DecisionSnapshot,
} from '../lib/draft'
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
  initialDraft?: CleaningDraft | null
  onCancel: () => void
  onComplete: () => void
}

const emptyStats = (): CleanStats => ({
  totalIn: 0,
  kept: 0,
  removedBads: 0,
  removedEmail: 0,
  removedCompany: 0,
})

export function CleanWizard({
  initialDraft = null,
  onCancel,
  onComplete,
}: CleanWizardProps) {
  const [step, setStep] = useState<WizardStep>(initialDraft?.step ?? 'upload')
  const [fileName, setFileName] = useState(initialDraft?.fileName ?? '')
  const [headers, setHeaders] = useState<string[]>(initialDraft?.headers ?? [])
  const [sourceLeads, setSourceLeads] = useState<Lead[]>(
    initialDraft?.sourceLeads ?? [],
  )
  const [leads, setLeads] = useState<Lead[]>(initialDraft?.leads ?? [])
  const [mapping, setMapping] = useState<ColumnMapping>(
    initialDraft?.mapping ?? {},
  )
  const [stats, setStats] = useState<CleanStats>(
    initialDraft?.stats ?? emptyStats(),
  )
  const [emailQueue, setEmailQueue] = useState<DuplicateGroup[]>(
    initialDraft?.emailQueue ?? [],
  )
  const [emailIndex, setEmailIndex] = useState(initialDraft?.emailIndex ?? 0)
  const [companyQueue, setCompanyQueue] = useState<DuplicateGroup[]>(
    initialDraft?.companyQueue ?? [],
  )
  const [companyIndex, setCompanyIndex] = useState(
    initialDraft?.companyIndex ?? 0,
  )
  const [badCount, setBadCount] = useState(initialDraft?.badCount ?? 0)
  const [parseError, setParseError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [logged, setLogged] = useState(initialDraft?.logged ?? false)
  const [undoStack, setUndoStack] = useState<DecisionSnapshot[]>(
    initialDraft?.undoStack ?? [],
  )
  const [saveNote, setSaveNote] = useState('')
  const [resumeIds, setResumeIds] = useState<string[] | null>(null)

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

  useEffect(() => {
    if (step === 'upload' || !fileName) return

    let cancelled = false
    setSaveNote('Salvando progresso…')

    void (async () => {
      const result = await saveDraft({
        fileName,
        headers,
        sourceLeads,
        leads,
        mapping,
        stats,
        emailQueue,
        emailIndex,
        companyQueue,
        companyIndex,
        badCount,
        logged,
        undoStack,
        step,
      })
      if (cancelled) return
      if (result.ok) {
        setSaveNote('Progresso salvo neste navegador')
      } else {
        setSaveNote(
          `Falha ao salvar: ${result.error ?? 'armazene um backup em arquivo.'}`,
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    step,
    fileName,
    headers,
    sourceLeads,
    leads,
    mapping,
    stats,
    emailQueue,
    emailIndex,
    companyQueue,
    companyIndex,
    badCount,
    logged,
    undoStack,
  ])

  function pushSnapshot(snapshot: DecisionSnapshot) {
    setUndoStack((stack) => [...stack, snapshot])
  }

  function currentSnapshot(
    currentStep: 'email' | 'empresa',
    chosenIds: string[],
  ): DecisionSnapshot {
    return {
      step: currentStep,
      leads,
      stats,
      emailQueue,
      emailIndex,
      companyQueue,
      companyIndex,
      chosenIds,
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
    setResumeIds(snapshot.chosenIds ?? [])
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
      setResumeIds(null)
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
    pushSnapshot(currentSnapshot('email', leadIds))
    setResumeIds(null)
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
    pushSnapshot(currentSnapshot('empresa', leadIds))
    setResumeIds(null)
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
    if (undoStack.length === 0) return
    const stack = [...undoStack]
    const prev = stack.pop()!
    setUndoStack(stack)
    restoreSnapshot(prev)
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

  function handleFinishHome() {
    void clearDraft().then(() => onComplete())
  }

  function handleCancel() {
    onCancel()
  }

  function handleDownloadBackup() {
    downloadDraftBackup({
      savedAt: new Date().toISOString(),
      fileName,
      headers,
      sourceLeads,
      leads,
      mapping,
      stats,
      emailQueue,
      emailIndex,
      companyQueue,
      companyIndex,
      badCount,
      logged,
      undoStack,
      step,
    })
    setSaveNote('Arquivo de progresso baixado — guarde para continuar depois')
  }

  const canGoBackDeck = undoStack.length > 0
  const showBackup = step !== 'upload' && Boolean(fileName)

  const stepTip = useMemo(() => {
    switch (step) {
      case 'upload':
        return {
          title: 'Passo 1 — Enviar a base',
          text: 'Use o CSV do comercial (Email, Empresa, Identificador, Nome…). Depois vamos mapear as colunas.',
        }
      case 'mapping':
        return {
          title: 'Passo 2 — Conferir colunas',
          text: 'Confirme se Email, Empresa e Identificador estão certos. Sem isso as regras de limpeza não funcionam.',
        }
      case 'bads':
        return {
          title: 'Passo 3 — Bads',
          text: 'Todos os leads com Identificador começando em [BADS] serão removidos se você confirmar.',
        }
      case 'email':
        return {
          title: 'Passo 4 — E-mails duplicados',
          text: 'Escolha qual lead manter (ou vários, com o toggle). Use “Baixar progresso” se for pausar.',
        }
      case 'empresa':
        return {
          title: 'Passo 5 — Empresas duplicadas',
          text: 'Mesma lógica do e-mail: deixe só o lead que deve permanecer. Pode voltar à decisão anterior se errar.',
        }
      case 'summary':
        return {
          title: 'Passo 6 — Finalizar',
          text: 'Exporte o CSV limpo. Ao voltar ao início, o rascunho desta limpeza é encerrado.',
        }
      default:
        return null
    }
  }, [step])

  return (
    <div className="wizard">
      <div className="wizard-bar">
        <div className="wizard-bar-left">
          <button type="button" className="btn btn-ghost" onClick={handleCancel}>
            Salvar e sair
          </button>
          {showBackup && (
            <button
              type="button"
              className="btn btn-backup"
              onClick={handleDownloadBackup}
              title="Baixe um arquivo .json para continuar depois, mesmo em outro computador"
            >
              Baixar progresso
            </button>
          )}
        </div>
        <div className="wizard-bar-meta">
          {saveNote && (
            <span
              className={`save-note ${saveNote.startsWith('Falha') ? 'is-error' : ''}`}
            >
              {saveNote}
            </span>
          )}
          <span className="wizard-step">{progressLabel}</span>
        </div>
      </div>

      {stepTip && (
        <StepTip title={stepTip.title} tone={step === 'summary' ? 'info' : 'info'}>
          {stepTip.text}
        </StepTip>
      )}

      {showBackup && (step === 'email' || step === 'empresa') && (
        <StepTip title="Dica: não perca o trabalho" tone="warn">
          Vai pausar agora? Clique em <strong>Baixar progresso</strong> antes de
          fechar o navegador. Depois use <strong>Continuar de arquivo</strong> na
          home.
        </StepTip>
      )}

      {step === 'upload' && (
        <div className="step-card">
          <div className="section-head">
            <h2>Enviar CSV</h2>
            <p className="muted">
              Arraste o arquivo ou selecione no computador. O progresso passa a
              ser salvo automaticamente neste navegador.
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
          resumeIds={resumeIds}
          onKeep={keepFromEmail}
          onBack={handleDeckBack}
          onResumeConsumed={() => setResumeIds(null)}
        />
      )}

      {step === 'empresa' && currentCompanyGroup && (
        <SwipeDeck
          group={currentCompanyGroup}
          mapping={mapping}
          index={companyIndex}
          total={companyQueue.length}
          canGoBack={canGoBackDeck}
          resumeIds={resumeIds}
          onKeep={keepFromCompany}
          onBack={handleDeckBack}
          onResumeConsumed={() => setResumeIds(null)}
        />
      )}

      {step === 'summary' && (
        <SummaryStep
          fileName={fileName}
          stats={stats}
          onExport={exportCsv}
          onFinish={handleFinishHome}
        />
      )}
    </div>
  )
}
