import type { ColumnMapping, DuplicateGroup, Lead } from '../types/lead'
import { fieldValue, isBadIdentificador, normalizeCompany, normalizeEmail } from './normalize'

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

function groupByKey(
  leads: Lead[],
  getKey: (lead: Lead) => string,
  reason: DuplicateGroup['reason'],
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
      leads: groupLeads,
    })
  }
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
  )
}

export function applyKeepOne(
  allLeads: Lead[],
  group: DuplicateGroup,
  keepId: string,
): { leads: Lead[]; removed: number } {
  const ids = new Set(group.leads.map((l) => l.id))
  const next: Lead[] = []
  let removed = 0
  for (const lead of allLeads) {
    if (!ids.has(lead.id)) {
      next.push(lead)
      continue
    }
    if (lead.id === keepId) {
      next.push(lead)
    } else {
      removed += 1
    }
  }
  return { leads: next, removed }
}
