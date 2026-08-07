import { listHistory } from '../lib/history'
import type { HistoryEntry } from '../types/lead'

type HomePageProps = {
  onStart: () => void
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

export function HomePage({ onStart }: HomePageProps) {
  const history = listHistory()

  return (
    <div className="home-page">
      <section className="hero-panel">
        <p className="eyebrow">Operação comercial</p>
        <h1>Limpeza de leads</h1>
        <p className="hero-copy">
          Envie um CSV, confirme os Bads, escolha qual lead manter em cada
          conflito e exporte a base limpa.
        </p>
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Nova limpeza
        </button>
      </section>

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
