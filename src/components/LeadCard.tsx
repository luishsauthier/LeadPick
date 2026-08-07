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
  const nomeRaw = fieldValue(lead.row, mapping.nome).trim()
  const email = fieldValue(lead.row, mapping.email) || '—'
  const empresa = fieldValue(lead.row, mapping.empresa) || '—'
  const telefone = fieldValue(lead.row, mapping.telefone) || '—'
  const celular = fieldValue(lead.row, mapping.celular) || '—'
  const dataConversao = fieldValue(lead.row, mapping.dataConversao) || '—'
  const identificador = fieldValue(lead.row, mapping.identificador) || '—'

  // Título: nome real; se o "nome" for e-mail/vazio, usa empresa ou e-mail
  const title =
    nomeRaw && !nomeRaw.includes('@')
      ? nomeRaw
      : empresa !== '—'
        ? empresa
        : email !== '—'
          ? email
          : nomeRaw || 'Lead'

  return (
    <article
      className={`lead-card ${selected ? 'is-selected' : ''} ${multiMode ? 'is-multi' : ''}`}
    >
      {badge && <span className="lead-badge">{badge}</span>}
      <h3 title={title}>{title}</h3>
      <dl className="lead-dl">
        {nomeRaw && (
          <div>
            <dt>Nome</dt>
            <dd>{nomeRaw}</dd>
          </div>
        )}
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
          className={`btn lead-card-action ${multiMode && selected ? 'btn-keep' : multiMode ? 'btn-ghost' : 'btn-keep'}`}
          onClick={onSelect}
        >
          {actionLabel}
        </button>
      )}
    </article>
  )
}
