import { useEffect, useState } from 'react'
import type { ColumnMapping, DuplicateGroup } from '../types/lead'
import { LeadCard } from './LeadCard'

type SwipeDeckProps = {
  group: DuplicateGroup
  mapping: ColumnMapping
  index: number
  total: number
  canGoBack: boolean
  /** Escolha anterior ao voltar — destaca o que foi marcado */
  resumeIds?: string[] | null
  onKeep: (leadIds: string[]) => void
  onBack: () => void
  onResumeConsumed?: () => void
}

export function SwipeDeck({
  group,
  mapping,
  index,
  total,
  canGoBack,
  resumeIds = null,
  onKeep,
  onBack,
  onResumeConsumed,
}: SwipeDeckProps) {
  const [multiMode, setMultiMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    setMultiMode(false)
    setSelected(new Set())
    setReviewing(false)
  }, [group.id])

  useEffect(() => {
    if (!resumeIds?.length) return
    const valid = resumeIds.filter((id) =>
      group.leads.some((l) => l.id === id),
    )
    if (valid.length === 0) return
    setSelected(new Set(valid))
    setMultiMode(valid.length > 1)
    setReviewing(true)
    onResumeConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, resumeIds])

  const reasonLabel =
    group.reason === 'email' ? 'mesmo e-mail' : 'mesma empresa'
  const showConfirm = multiMode || reviewing

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function chooseSingle(id: string) {
    setSelected(new Set([id]))
  }

  function handleCardClick(id: string) {
    if (multiMode) {
      toggleSelect(id)
      return
    }
    if (reviewing) {
      chooseSingle(id)
      return
    }
    onKeep([id])
  }

  function handleConfirm() {
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
          {group.leads.length > 1 && (
            <label className="multi-toggle">
              <input
                type="checkbox"
                checked={multiMode}
                onChange={(e) => {
                  const on = e.target.checked
                  setMultiMode(on)
                  if (on) {
                    setReviewing(false)
                  } else if (selected.size > 1) {
                    const first = [...selected][0]
                    setSelected(first ? new Set([first]) : new Set())
                  }
                }}
              />
              <span>Selecionar vários</span>
            </label>
          )}
        </div>
        <h2>
          {reviewing
            ? 'Revisar decisão anterior'
            : multiMode
              ? 'Quais leads manter?'
              : 'Qual lead manter?'}
        </h2>
        <p className="muted">
          Conflito por <strong>{reasonLabel}</strong>
          {group.key ? (
            <>
              : <code>{group.key}</code>
            </>
          ) : null}
          .
          {reviewing
            ? ' Mostramos o que você tinha marcado. Pode trocar e confirmar.'
            : multiMode
              ? ' Marque os que deseja manter e avance.'
              : ' Um toque mantém e avança. O mais completo vem primeiro.'}
        </p>
      </div>

      <div className={`deck-grid deck-count-${Math.min(group.leads.length, 3)}`}>
        {group.leads.map((lead, i) => {
          const isSelected = selected.has(lead.id)
          const badge =
            reviewing && isSelected
              ? 'Sua escolha'
              : !reviewing && i === 0
                ? 'Mais completo'
                : undefined

          return (
            <LeadCard
              key={lead.id}
              lead={lead}
              mapping={mapping}
              badge={badge}
              selected={isSelected}
              multiMode={showConfirm}
              onSelect={() => handleCardClick(lead.id)}
              actionLabel={
                multiMode
                  ? isSelected
                    ? 'Selecionado'
                    : 'Selecionar'
                  : reviewing
                    ? isSelected
                      ? 'Escolhido'
                      : 'Trocar para este'
                    : 'Manter este'
              }
            />
          )
        })}
      </div>

      <div className="step-actions deck-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onBack}
          disabled={!canGoBack}
          title={
            canGoBack
              ? 'Voltar à decisão anterior e revisar a marcação'
              : 'Não há decisão anterior'
          }
        >
          Decisão anterior
        </button>
        {showConfirm && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={selected.size === 0}
            onClick={handleConfirm}
          >
            {reviewing
              ? 'Confirmar e avançar'
              : `Próximo (${selected.size})`}
          </button>
        )}
      </div>
    </div>
  )
}
