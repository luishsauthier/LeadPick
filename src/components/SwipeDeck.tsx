import { useEffect, useState } from 'react'
import type { ColumnMapping, DuplicateGroup } from '../types/lead'
import { LeadCard } from './LeadCard'

type SwipeDeckProps = {
  group: DuplicateGroup
  mapping: ColumnMapping
  index: number
  total: number
  canGoBack: boolean
  onKeep: (leadIds: string[]) => void
  onBack: () => void
}

export function SwipeDeck({
  group,
  mapping,
  index,
  total,
  canGoBack,
  onKeep,
  onBack,
}: SwipeDeckProps) {
  const [multiMode, setMultiMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMultiMode(false)
    setSelected(new Set())
  }, [group.id])

  const reasonLabel =
    group.reason === 'email' ? 'mesmo e-mail' : 'mesma empresa'
  const showMultiToggle = group.leads.length > 1

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleMultiNext() {
    if (selected.size === 0) return
    onKeep([...selected])
  }

  return (
    <div className="step-card swipe-deck">
      <div className="section-head">
        <div className="deck-toolbar">
          <p className="progress-pill">
            Decisão {index + 1} de {total}
          </p>
          {showMultiToggle && (
            <label className="multi-toggle">
              <input
                type="checkbox"
                checked={multiMode}
                onChange={(e) => {
                  setMultiMode(e.target.checked)
                  setSelected(new Set())
                }}
              />
              <span>Selecionar vários</span>
            </label>
          )}
        </div>
        <h2>{multiMode ? 'Quais leads manter?' : 'Qual lead manter?'}</h2>
        <p className="muted">
          Conflito por <strong>{reasonLabel}</strong>
          {group.key ? (
            <>
              : <code>{group.key}</code>
            </>
          ) : null}
          . O mais completo aparece primeiro; grupos maiores vêm antes dos pares.
          {multiMode
            ? ' Marque os que deseja manter e avance.'
            : ' Escolha um; os demais serão removidos.'}
        </p>
      </div>

      <div className={`deck-grid deck-count-${Math.min(group.leads.length, 3)}`}>
        {group.leads.map((lead, i) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            mapping={mapping}
            badge={i === 0 ? 'Mais completo' : undefined}
            selected={multiMode ? selected.has(lead.id) : false}
            onSelect={
              multiMode
                ? () => toggleSelect(lead.id)
                : () => onKeep([lead.id])
            }
            actionLabel={
              multiMode
                ? selected.has(lead.id)
                  ? 'Selecionado'
                  : 'Selecionar'
                : 'Manter este'
            }
            multiMode={multiMode}
          />
        ))}
      </div>

      <div className="step-actions deck-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          disabled={!canGoBack}
        >
          Voltar
        </button>
        {multiMode && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={selected.size === 0}
            onClick={handleMultiNext}
          >
            Próximo ({selected.size})
          </button>
        )}
      </div>
    </div>
  )
}
