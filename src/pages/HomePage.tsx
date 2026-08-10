import { useEffect, useState } from 'react'
import {
  getDraftSummary,
  importDraftFromFile,
  stepLabel,
  type CleaningDraft,
  type DraftSummary,
} from '../lib/draft'
import { listHistory } from '../lib/history'
import type { HistoryEntry } from '../types/lead'

type HomePageProps = {
  onStart: () => void
  onResume: () => void
  onImportDraft: (draft: CleaningDraft) => void
  onDiscardDraft: () => void
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const removed =
    entry.removedBads + entry.removedEmail + entry.removedCompany
  return (
    <li className="log-row">
      <div>
        <p className="log-file">{entry.fileName}</p>
        <p className="log-meta">{formatDate(entry.at)}</p>
      </div>
      <div className="log-stats">
        <span>
          {entry.kept}/{entry.totalIn} mantidos
        </span>
        <span className="muted">{removed} removidos</span>
      </div>
    </li>
  )
}

export function HomePage({
  onStart,
  onResume,
  onImportDraft,
  onDiscardDraft,
}: HomePageProps) {
  const history = listHistory()
  const [draft, setDraft] = useState<DraftSummary | null>(null)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    let cancelled = false
    void getDraftSummary().then((summary) => {
      if (!cancelled) setDraft(summary)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleImport(file: File | undefined) {
    if (!file) return
    setImportError('')
    try {
      const imported = await importDraftFromFile(file)
      onImportDraft(imported)
    } catch (err) {
      setImportError(
        err instanceof Error
          ? err.message
          : 'Não foi possível importar o progresso.',
      )
    }
  }

  return (
    <div className="home-page">
      <section className="hero-panel">
        <p className="eyebrow">Operação comercial</p>
        <h1>Limpeza de leads</h1>
        <p className="hero-copy">
          Envie um CSV, confirme os Bads, escolha qual lead manter em cada
          conflito e exporte a base limpa. O progresso fica salvo neste
          navegador — use também “Baixar progresso” para não perder o trabalho.
        </p>
        <div className="hero-actions">
          {draft && (
            <button type="button" className="btn btn-primary" onClick={onResume}>
              Continuar limpeza
            </button>
          )}
          <button
            type="button"
            className={draft ? 'btn btn-ghost' : 'btn btn-primary'}
            onClick={onStart}
          >
            Nova limpeza
          </button>
          <label className="btn btn-ghost file-btn">
            Continuar de arquivo
            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                void handleImport(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {importError && <p className="form-error">{importError}</p>}
      </section>

      {draft && (
        <section className="draft-panel">
          <div className="section-head">
            <h2>Em andamento</h2>
            <p className="muted">Salvo neste navegador (e no IndexedDB)</p>
          </div>
          <div className="draft-row">
            <div>
              <p className="log-file">{draft.fileName}</p>
              <p className="log-meta">
                {formatDate(draft.savedAt)} · etapa {stepLabel(draft.step)} ·{' '}
                {draft.keptSoFar}/{draft.totalIn} leads atuais
              </p>
            </div>
            <div className="draft-actions">
              <button type="button" className="btn btn-primary" onClick={onResume}>
                Continuar
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onDiscardDraft}
              >
                Descartar
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="log-panel">
        <div className="section-head">
          <h2>Log recente</h2>
          <p className="muted">Metadados das últimas limpezas neste navegador</p>
        </div>
        {history.length === 0 ? (
          <p className="empty-log">Nenhuma limpeza registrada ainda.</p>
        ) : (
          <ul className="log-list">
            {history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
