export function normalizeEmail(value: string | undefined | null): string {
  return (value ?? '').trim().toLowerCase()
}

export function normalizeCompany(value: string | undefined | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function isBadIdentificador(value: string | undefined | null): boolean {
  return (value ?? '').trim().startsWith('[BADS]')
}

export function fieldValue(
  row: Record<string, string>,
  header: string | undefined,
): string {
  if (!header) return ''
  return row[header] ?? ''
}
