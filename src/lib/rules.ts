import type { ColumnMapping, DuplicateGroup, Lead } from '../types/lead'
import {
  emailDomain,
  fieldValue,
  isBadIdentificador,
  normalizeCompany,
  normalizeEmail,
} from './normalize'
import { normalizeDomainInput } from './domains'

export function countBads(leads: Lead[], mapping: ColumnMapping): number {
  const col = mapping.identificador
  if (!col) return 0
  return leads.filter((l) => isBadIdentificador(fieldValue(l.row, col))).length
}

export function removeBads(
  leads: Lead[],
  mapping: ColumnMapping,
): { kept: Lead[]; removed: number } {
  const col = mapping.identificador
  if (!col) return { kept: leads, removed: 0 }

  const kept: Lead[] = []
  let removed = 0
  for (const lead of leads) {
    if (isBadIdentificador(fieldValue(lead.row, col))) {
      removed += 1
    } else {
      kept.push(lead)
    }
  }
  return { kept, removed }
}

export function countLeadsByDomain(
  leads: Lead[],
  mapping: ColumnMapping,
  domains: string[],
): Map<string, number> {
  const set = new Set(domains.map(normalizeDomainInput).filter(Boolean))
  const counts = new Map<string, number>()
  for (const d of set) counts.set(d, 0)

  const col = mapping.email
  if (!col) return counts

  for (const lead of leads) {
    const domain = emailDomain(fieldValue(lead.row, col))
    if (!domain || !set.has(domain)) continue
    counts.set(domain, (counts.get(domain) ?? 0) + 1)
  }
  return counts
}

export function countDomainExclusions(
  leads: Lead[],
  mapping: ColumnMapping,
  domains: string[],
): number {
  const set = new Set(domains.map(normalizeDomainInput).filter(Boolean))
  if (set.size === 0) return 0
  const col = mapping.email
  if (!col) return 0
  let n = 0
  for (const lead of leads) {
    const domain = emailDomain(fieldValue(lead.row, col))
    if (domain && set.has(domain)) n += 1
  }
  return n
}

export function removeByDomains(
  leads: Lead[],
  mapping: ColumnMapping,
  domains: string[],
): { kept: Lead[]; removed: number } {
  const set = new Set(domains.map(normalizeDomainInput).filter(Boolean))
  if (set.size === 0) return { kept: leads, removed: 0 }
  const col = mapping.email
  if (!col) return { kept: leads, removed: 0 }

  const kept: Lead[] = []
  let removed = 0
  for (const lead of leads) {
    const domain = emailDomain(fieldValue(lead.row, col))
    if (domain && set.has(domain)) {
      removed += 1
    } else {
      kept.push(lead)
    }
  }
  return { kept, removed }
}

/** Prioriza o lead com mais campos preenchidos (e mais conteúdo no total). */
export function completenessScore(lead: Lead, mapping: ColumnMapping): number {
  const mappedCols = [
    mapping.email,
    mapping.empresa,
    mapping.identificador,
    mapping.nome,
    mapping.telefone,
    mapping.celular,
    mapping.dataConversao,
  ].filter((c): c is string => Boolean(c))

  let mappedFilled = 0
  for (const col of mappedCols) {
    if (fieldValue(lead.row, col).trim()) mappedFilled += 10
  }

  let anyFilled = 0
  let charWeight = 0
  for (const value of Object.values(lead.row)) {
    const trimmed = value.trim()
    if (!trimmed) continue
    anyFilled += 1
    charWeight += Math.min(trimmed.length, 40)
  }

  return mappedFilled + anyFilled + charWeight / 100
}

export function sortByCompleteness(
  leads: Lead[],
  mapping: ColumnMapping,
): Lead[] {
  return [...leads].sort(
    (a, b) => completenessScore(b, mapping) - completenessScore(a, mapping),
  )
}

function groupByKey(
  leads: Lead[],
  getKey: (lead: Lead) => string,
  reason: DuplicateGroup['reason'],
  mapping: ColumnMapping,
): DuplicateGroup[] {
  const map = new Map<string, Lead[]>()
  for (const lead of leads) {
    const key = getKey(lead)
    if (!key) continue
    const list = map.get(key)
    if (list) list.push(lead)
    else map.set(key, [lead])
  }

  const groups: DuplicateGroup[] = []
  let i = 0
  for (const [key, groupLeads] of map) {
    if (groupLeads.length < 2) continue
    groups.push({
      id: `${reason}-${i++}-${key.slice(0, 24)}`,
      reason,
      key,
      leads: sortByCompleteness(groupLeads, mapping),
    })
  }

  // Maiores primeiro; no fim ficam os pares (2 leads)
  groups.sort((a, b) => {
    if (b.leads.length !== a.leads.length) return b.leads.length - a.leads.length
    return a.key.localeCompare(b.key)
  })

  return groups
}

export function findEmailDuplicates(
  leads: Lead[],
  mapping: ColumnMapping,
): DuplicateGroup[] {
  const col = mapping.email
  if (!col) return []
  return groupByKey(
    leads,
    (lead) => normalizeEmail(fieldValue(lead.row, col)),
    'email',
    mapping,
  )
}

export function findCompanyDuplicates(
  leads: Lead[],
  mapping: ColumnMapping,
): DuplicateGroup[] {
  const col = mapping.empresa
  if (!col) return []
  return groupByKey(
    leads,
    (lead) => normalizeCompany(fieldValue(lead.row, col)),
    'empresa',
    mapping,
  )
}

export function applyKeepMany(
  allLeads: Lead[],
  group: DuplicateGroup,
  keepIds: string[],
): { leads: Lead[]; removed: number } {
  const keep = new Set(keepIds)
  const ids = new Set(group.leads.map((l) => l.id))
  const next: Lead[] = []
  let removed = 0
  for (const lead of allLeads) {
    if (!ids.has(lead.id)) {
      next.push(lead)
      continue
    }
    if (keep.has(lead.id)) {
      next.push(lead)
    } else {
      removed += 1
    }
  }
  return { leads: next, removed }
}
