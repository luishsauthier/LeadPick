import type { ColumnMapping, Lead } from '../types/lead'
import { fieldValue } from '../lib/normalize'

type LeadCardProps = {
  lead: Lead
  mapping: ColumnMapping
  selected?: boolean
  onSelect?: () => void
  actionLabel?: string
}

export function LeadCard({
  lead,
  mapping,
  selected,
  onSelect,
  actionLabel = 'Manter este',
}: LeadCardProps) {
  const nome = fieldValue(lead.row, mapping.nome) || '—'
  const email = fieldValue(lead.row, mapping.email) || '—'
  const empresa = fieldValue(lead.row, mapping.empresa) || '—'
  const telefone = fieldValue(lead.row, mapping.telefone) || '—'
  const identificador = fieldValue(lead.row, mapping.identificador) || '—'

  return (
    <article className={`lead-card ${selected ? 'is-selected' : ''}`}>
      <h3>{nome}</h3>
      <dl className="lead-dl">
        <div>
          <dt>E-mail</dt>
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
          <dt>Identificador</dt>
          <dd>{identificador}</dd>
        </div>
      </dl>
      {onSelect && (
        <button type="button" className="btn btn-keep" onClick={onSelect}>
          {actionLabel}
        </button>
      )}
    </article>
  )
}
