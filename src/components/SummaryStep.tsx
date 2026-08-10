import type { CleanStats } from '../types/lead'

type SummaryStepProps = {
  fileName: string
  stats: CleanStats
  onExport: () => void
  onFinish: () => void
}

export function SummaryStep({
  fileName,
  stats,
  onExport,
  onFinish,
}: SummaryStepProps) {
  const removed =
    stats.removedBads + stats.removedEmail + stats.removedCompany

  return (
    <div className="step-card">
      <div className="section-head">
        <p className="eyebrow success">Concluído</p>
        <h2>Base limpa</h2>
        <p className="muted">Arquivo: {fileName}</p>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Clique em <strong>Exportar CSV</strong> para baixar a base limpa.
          Depois use <strong>Voltar ao início</strong>.
        </p>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Clique em <strong>Exportar CSV</strong> para baixar a base limpa.
          Depois use <strong>Voltar ao início</strong>.
        </p>
      </div>

      <div className="summary-grid">
        <div className="summary-stat">
          <span className="label">Entrada</span>
          <strong>{stats.totalIn}</strong>
        </div>
        <div className="summary-stat highlight">
          <span className="label">Mantidos</span>
          <strong>{stats.kept}</strong>
        </div>
        <div className="summary-stat">
          <span className="label">Removidos</span>
          <strong>{removed}</strong>
        </div>
        <div className="summary-stat">
          <span className="label">Bads</span>
          <strong>{stats.removedBads}</strong>
        </div>
        <div className="summary-stat">
          <span className="label">E-mail dup.</span>
          <strong>{stats.removedEmail}</strong>
        </div>
        <div className="summary-stat">
          <span className="label">Empresa dup.</span>
          <strong>{stats.removedCompany}</strong>
        </div>
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-ghost" onClick={onFinish}>
          Voltar ao início
        </button>
        <button type="button" className="btn btn-primary" onClick={onExport}>
          Exportar CSV
        </button>
      </div>
    </div>
  )
}
