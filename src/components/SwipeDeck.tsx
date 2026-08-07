import { useEffect, useMemo, useState } from 'react'
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

function sameSelection(a: string[], b: Set<string>): boolean {
  if (a.length !== b.size) return false
  return a.every((id) => b.has(id))
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
  const [originalIds, setOriginalIds] = useState<string[]>([])

  useEffect(() => {
    setMultiMode(false)
    setSelected(new Set())
    setReviewing(false)
    setOriginalIds([])
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [group.id])

  useEffect(() => {
    if (!resumeIds?.length) return
    const valid = resumeIds.filter((id) =>
      group.leads.some((l) => l.id === id),
    )
    if (valid.length === 0) return
    setSelected(new Set(valid))
    setOriginalIds(valid)
    setMultiMode(valid.length > 1)
    setReviewing(true)
    onResumeConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, resumeIds])

  const reasonLabel =
    group.reason === 'email' ? 'mesmo e-mail' : 'mesma empresa'
  const showConfirm = multiMode || reviewing

  const selectionChanged = useMemo(
    () => reviewing && originalIds.length > 0 && !sameSelection(originalIds, selected),
    [reviewing, originalIds, selected],
  )

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

  function restoreOriginalSelection() {
    setSelected(new Set(originalIds))
    setMultiMode(originalIds.length > 1)
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
                    // multi manual fora do fluxo de revisão “travada”
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
            ? selectionChanged
              ? ' Você alterou a marcação. Pode restaurar a escolha original ou confirmar a nova.'
              : ' Mostramos o que você tinha marcado. Pode trocar e confirmar.'
            : multiMode
              ? ' Marque os que deseja manter e avance.'
              : ' Um toque mantém e avança. O mais completo vem primeiro.'}
        </p>
      </div>

      <div className={`deck-grid deck-count-${Math.min(group.leads.length, 3)}`}>
        {group.leads.map((lead, i) => {
          const isSelected = selected.has(lead.id)
          const wasOriginal = originalIds.includes(lead.id)

          let badge: string | undefined
          if (reviewing && wasOriginal && isSelected) {
            badge = 'Sua escolha'
          } else if (reviewing && wasOriginal && !isSelected) {
            badge = 'Escolha anterior'
          } else if (!reviewing && i === 0) {
            badge = 'Mais completo'
          }

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
        <div className="deck-actions-inner">
          <div className="deck-actions-left">
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
            {selectionChanged && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={restoreOriginalSelection}
              >
                Manter seleção anterior
              </button>
            )}
          </div>
          {showConfirm ? (
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
          ) : (
            <span className="deck-actions-hint muted">
              Toque em “Manter este” para avançar
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
