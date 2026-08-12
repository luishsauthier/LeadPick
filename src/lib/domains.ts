/** Domínios pessoais / free / temporários sugeridos para exclusão. */
export const SUGGESTED_EXCLUDE_DOMAINS: string[] = [
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'hotmail.com',
  'hotmail.com.br',
  'outlook.com',
  'outlook.com.br',
  'live.com',
  'live.com.br',
  'msn.com',
  // Yahoo
  'yahoo.com',
  'yahoo.com.br',
  'ymail.com',
  // Brasil
  'terra.com.br',
  'uol.com.br',
  'bol.com.br',
  'ig.com.br',
  'zipmail.com.br',
  'globo.com',
  'globomail.com',
  'r7.com',
  'oi.com.br',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // Outros free
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'gmx.com',
  'mail.com',
  // Temporários / descartáveis conhecidos
  'gufum.com',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.org',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'emailondeck.com',
]

export function normalizeDomainInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, '')
}

export function isValidDomain(value: string): boolean {
  const d = normalizeDomainInput(value)
  // simples: tem pelo menos um ponto e chars válidos
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(
    d,
  )
}
