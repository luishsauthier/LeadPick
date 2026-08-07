import { getDraftSummary, stepLabel } from '../lib/draft'
import { listHistory } from '../lib/history'
import type { HistoryEntry } from '../types/lead'

type HomePageProps = {
  onStart: () => void
  onResume: () => void
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

export function HomePage({ onStart, onResume, onDiscardDraft }: HomePageProps) {
  const history = listHistory()
  const draft = getDraftSummary()

  return (
    <div className="home-page">
      <section className="hero-panel">
        <p className="eyebrow">Operação comercial</p>
        <h1>Limpeza de leads</h1>
        <p className="hero-copy">
          Envie um CSV, confirme os Bads, escolha qual lead manter em cada
          conflito e exporte a base limpa. O progresso fica salvo neste
          navegador para continuar depois.
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
        </div>
      </section>

      {draft && (
        <section className="draft-panel">
          <div className="section-head">
            <h2>Em andamento</h2>
            <p className="muted">Salvo automaticamente neste navegador</p>
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
