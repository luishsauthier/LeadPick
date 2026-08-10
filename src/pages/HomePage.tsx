import { useEffect, useState } from 'react'
import { GuideList } from '../components/Guide'
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
          Ferramenta para limpar a base CSV: remover Bads, escolher o lead certo
          em e-mails/empresas duplicados e exportar a lista final.
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
            <h2>Você tem uma limpeza em andamento</h2>
            <p className="muted">
              Clique em <strong>Continuar</strong> para retomar de onde parou
              neste navegador.
            </p>
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

      <GuideList
        title="Como usar (passo a passo)"
        items={[
          <>
            Clique em <strong>Nova limpeza</strong> e envie o CSV da base.
          </>,
          <>
            Confirme o mapeamento das colunas (Email, Empresa, Identificador…).
          </>,
          <>
            Confirme a remoção dos <strong>Bads</strong> e resolva os
            duplicados (e-mail e empresa).
          </>,
          <>
            Antes de sair ou no fim do dia, clique em{' '}
            <strong>Baixar progresso</strong> — assim você não perde o trabalho.
          </>,
          <>
            Para retomar: use <strong>Continuar limpeza</strong> (mesmo
            navegador) ou <strong>Continuar de arquivo</strong> (arquivo .json).
          </>,
          <>
            No fim, exporte o CSV limpo.
          </>,
        ]}
      />

      <GuideList
        tone="warn"
        title="Importante para não perder o progresso"
        items={[
          <>
            O salvamento automático vale para <strong>este navegador</strong> e
            este computador.
          </>,
          <>
            Se for pausar (almoço, fim do dia, fim de semana), use{' '}
            <strong>Baixar progresso</strong>.
          </>,
          <>
            Não clique em <strong>Nova limpeza</strong> se quiser continuar a
            atual — isso pede confirmação e pode descartar o rascunho.
          </>,
        ]}
      />

      <section className="log-panel">
        <div className="section-head">
          <h2>Log recente</h2>
          <p className="muted">Histórico resumido das limpezas concluídas neste navegador</p>
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
