import { useMemo, useState, type FormEvent } from 'react'
import {
  isValidDomain,
  normalizeDomainInput,
  SUGGESTED_EXCLUDE_DOMAINS,
} from '../lib/domains'
import { countDomainExclusions, countLeadsByDomain } from '../lib/rules'
import type { ColumnMapping, Lead } from '../types/lead'

type DomainFilterStepProps = {
  leads: Lead[]
  mapping: ColumnMapping
  selectedDomains: string[]
  onChange: (domains: string[]) => void
  onBack: () => void
  onContinue: (domainsToRemove: string[]) => void
}

export function DomainFilterStep({
  leads,
  mapping,
  selectedDomains,
  onChange,
  onBack,
  onContinue,
}: DomainFilterStepProps) {
  const [custom, setCustom] = useState('')
  const [error, setError] = useState('')

  const selectedSet = useMemo(
    () => new Set(selectedDomains.map(normalizeDomainInput)),
    [selectedDomains],
  )

  const allDomains = useMemo(() => {
    const set = new Set<string>([
      ...SUGGESTED_EXCLUDE_DOMAINS,
      ...selectedDomains.map(normalizeDomainInput),
    ])
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [selectedDomains])

  const counts = useMemo(
    () => countLeadsByDomain(leads, mapping, allDomains),
    [leads, mapping, allDomains],
  )

  const totalToRemove = useMemo(
    () => countDomainExclusions(leads, mapping, selectedDomains),
    [leads, mapping, selectedDomains],
  )

  const suggestedSet = useMemo(
    () => new Set(SUGGESTED_EXCLUDE_DOMAINS),
    [],
  )

  function toggle(domain: string) {
    const d = normalizeDomainInput(domain)
    if (selectedSet.has(d)) {
      onChange(selectedDomains.filter((x) => normalizeDomainInput(x) !== d))
    } else {
      onChange([...selectedDomains, d])
    }
  }

  function selectAllSuggested() {
    const next = new Set(selectedDomains.map(normalizeDomainInput))
    for (const d of SUGGESTED_EXCLUDE_DOMAINS) next.add(d)
    onChange([...next])
  }

  function clearAll() {
    onChange([])
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError('')
    const d = normalizeDomainInput(custom)
    if (!d) {
      setError('Digite um domínio, ex.: empresa.com.br')
      return
    }
    if (!isValidDomain(d)) {
      setError('Domínio inválido. Use o formato nome.com ou nome.com.br')
      return
    }
    if (!selectedSet.has(d)) {
      onChange([...selectedDomains, d])
    }
    setCustom('')
  }

  return (
    <div className="step-card">
      <div className="section-head">
        <h2>Excluir e-mails por @domínio</h2>
        <p className="muted">
          Marque os domínios que devem sair da base (pessoais, free e
          temporários). Desmarque o que quiser manter. Você também pode
          adicionar outros @.
        </p>
      </div>

      <div className="domain-toolbar">
        <button type="button" className="btn btn-ghost" onClick={selectAllSuggested}>
          Marcar sugeridos
        </button>
        <button type="button" className="btn btn-ghost" onClick={clearAll}>
          Desmarcar todos
        </button>
        <span className="domain-total">
          <strong>{totalToRemove}</strong> lead{totalToRemove === 1 ? '' : 's'}{' '}
          serão removidos
        </span>
      </div>

      <div className="domain-grid">
        {allDomains.map((domain) => {
          const checked = selectedSet.has(domain)
          const count = counts.get(domain) ?? 0
          const isSuggested = suggestedSet.has(domain)
          return (
            <label
              key={domain}
              className={`domain-chip ${checked ? 'is-on' : 'is-off'}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(domain)}
              />
              <span className="domain-name">@{domain}</span>
              <span className="domain-count">{count}</span>
              {isSuggested ? (
                <span className="domain-tag">sugerido</span>
              ) : (
                <span className="domain-tag is-custom">custom</span>
              )}
            </label>
          )
        })}
      </div>

      <form className="domain-add" onSubmit={handleAdd}>
        <label className="field">
          <span>Adicionar outro domínio</span>
          <div className="domain-add-row">
            <span className="domain-at">@</span>
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="ex.: gufum.com ou meudominio.com.br"
            />
            <button type="submit" className="btn btn-primary">
              Adicionar
            </button>
          </div>
        </label>
        {error && <p className="form-error">{error}</p>}
      </form>

      <div className="step-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Voltar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onContinue(selectedDomains)}
        >
          {totalToRemove > 0
            ? `Excluir ${totalToRemove} e continuar`
            : 'Continuar sem excluir @'}
        </button>
      </div>
    </div>
  )
}
