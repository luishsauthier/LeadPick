import type { ReactNode } from 'react'

type GuideListProps = {
  title: string
  items: ReactNode[]
  tone?: 'info' | 'warn'
}

export function GuideList({ title, items, tone = 'info' }: GuideListProps) {
  return (
    <aside className={`guide-box guide-${tone}`} aria-label={title}>
      <p className="guide-title">{title}</p>
      <ol className="guide-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    </aside>
  )
}

type StepTipProps = {
  title: string
  children: ReactNode
  tone?: 'info' | 'warn'
}

export function StepTip({ title, children, tone = 'info' }: StepTipProps) {
  return (
    <div className={`step-tip tip-${tone}`}>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  )
}
