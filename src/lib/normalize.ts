export function normalizeEmail(value: string | undefined | null): string {
  return (value ?? '').trim().toLowerCase()
}

export function emailDomain(value: string | undefined | null): string {
  const email = normalizeEmail(value)
  const at = email.lastIndexOf('@')
  if (at < 0 || at === email.length - 1) return ''
  return email.slice(at + 1)
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
