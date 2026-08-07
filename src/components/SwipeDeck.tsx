import type { ColumnMapping, DuplicateGroup } from '../types/lead'
import { LeadCard } from './LeadCard'

type SwipeDeckProps = {
  group: DuplicateGroup
  mapping: ColumnMapping
  index: number
  total: number
  onKeep: (leadId: string) => void
}

export function SwipeDeck({
  group,
  mapping,
  index,
  total,
  onKeep,
}: SwipeDeckProps) {
  const reasonLabel =
    group.reason === 'email' ? 'mesmo e-mail' : 'mesma empresa'

  return (
    <div className="step-card swipe-deck">
      <div className="section-head">
        <p className="progress-pill">
          Decisão {index + 1} de {total}
        </p>
        <h2>Qual lead manter?</h2>
        <p className="muted">
          Conflito por <strong>{reasonLabel}</strong>
          {group.key ? (
            <>
              : <code>{group.key}</code>
            </>
          ) : null}
          . Escolha um; os demais serão removidos.
        </p>
      </div>

      <div className={`deck-grid deck-count-${Math.min(group.leads.length, 3)}`}>
        {group.leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            mapping={mapping}
            onSelect={() => onKeep(lead.id)}
          />
        ))}
      </div>
    </div>
  )
}
