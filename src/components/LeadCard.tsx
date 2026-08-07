import type { ColumnMapping, Lead } from '../types/lead'
import { fieldValue } from '../lib/normalize'

type LeadCardProps = {
  lead: Lead
  mapping: ColumnMapping
  selected?: boolean
  multiMode?: boolean
  badge?: string
  onSelect?: () => void
  actionLabel?: string
}

export function LeadCard({
  lead,
  mapping,
  selected,
  multiMode,
  badge,
  onSelect,
  actionLabel = 'Manter este',
}: LeadCardProps) {
  const nome = fieldValue(lead.row, mapping.nome) || '—'
  const email = fieldValue(lead.row, mapping.email) || '—'
  const empresa = fieldValue(lead.row, mapping.empresa) || '—'
  const telefone = fieldValue(lead.row, mapping.telefone) || '—'
  const celular = fieldValue(lead.row, mapping.celular) || '—'
  const dataConversao = fieldValue(lead.row, mapping.dataConversao) || '—'
  const identificador = fieldValue(lead.row, mapping.identificador) || '—'

  return (
    <article
      className={`lead-card ${selected ? 'is-selected' : ''} ${multiMode ? 'is-multi' : ''}`}
    >
      {badge && <span className="lead-badge">{badge}</span>}
      <h3>{nome}</h3>
      <dl className="lead-dl">
        <div>
          <dt>Email</dt>
          <dd>{email}</dd>
        </div>
        <div>
          <dt>Empresa</dt>
          <dd>{empresa}</dd>
        </div>
        <div>
          <dt>Telefone</dt>
          <dd>{telefone}</dd>
        </div>
        <div>
          <dt>Celular</dt>
          <dd>{celular}</dd>
        </div>
        <div>
          <dt>Data da Conversão</dt>
          <dd>{dataConversao}</dd>
        </div>
        <div>
          <dt>Identificador</dt>
          <dd>{identificador}</dd>
        </div>
      </dl>
      {onSelect && (
        <button
          type="button"
          className={`btn ${multiMode && selected ? 'btn-keep' : multiMode ? 'btn-ghost' : 'btn-keep'}`}
          onClick={onSelect}
        >
          {actionLabel}
        </button>
      )}
    </article>
  )
}
