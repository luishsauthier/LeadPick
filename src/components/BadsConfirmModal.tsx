type BadsConfirmModalProps = {
  count: number
  onConfirm: () => void
  onCancel: () => void
}

export function BadsConfirmModal({
  count,
  onConfirm,
  onCancel,
}: BadsConfirmModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bads-title"
      >
        <p className="eyebrow danger">Atenção</p>
        <h2 id="bads-title">Apagar todos os Bads?</h2>
        <p className="modal-copy">
          Foram encontrados{' '}
          <strong className="stat-number">{count}</strong> lead
          {count === 1 ? '' : 's'} com Identificador começando em{' '}
          <code>[BADS]</code>. Essa ação remove todos eles da base desta
          limpeza.
        </p>
        <div className="step-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Apagar todos os Bads
          </button>
        </div>
      </div>
    </div>
  )
}
