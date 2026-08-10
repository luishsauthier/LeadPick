import type { ColumnMapping, SystemField } from '../types/lead'

const FIELDS: { key: SystemField; label: string; required?: boolean }[] = [
  { key: 'email', label: 'Email', required: true },
  { key: 'empresa', label: 'Empresa', required: true },
  { key: 'identificador', label: 'Identificador (Bads)', required: true },
  { key: 'nome', label: 'Nome' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'celular', label: 'Celular' },
  { key: 'dataConversao', label: 'Data da Conversão' },
]

type MappingStepProps = {
  headers: string[]
  mapping: ColumnMapping
  onChange: (mapping: ColumnMapping) => void
  onBack: () => void
  onContinue: () => void
}

export function MappingStep({
  headers,
  mapping,
  onChange,
  onBack,
  onContinue,
}: MappingStepProps) {
  const ready = Boolean(mapping.email && mapping.empresa && mapping.identificador)

  return (
    <div className="step-card">
      <div className="section-head">
        <h2>Mapear colunas</h2>
        <p className="muted">
          Padrão esperado: Data da Conversão, Email, Identificador, Nome,
          Empresa, Telefone, Celular. Ajuste só se algum header estiver
          diferente — Email, Empresa e Identificador são obrigatórios.
        </p>
      </div>

      <div className="mapping-grid">
        {FIELDS.map((field) => (
          <label key={field.key} className="field">
            <span>
              {field.label}
              {field.required ? ' *' : ''}
            </span>
            <select
              value={mapping[field.key] ?? ''}
              onChange={(e) =>
                onChange({
                  ...mapping,
                  [field.key]: e.target.value || undefined,
                })
              }
            >
              <option value="">— selecionar —</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Voltar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!ready}
          onClick={onContinue}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
