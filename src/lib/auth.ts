const AUTH_EMAIL = 'comercial@bimachine.com.br'
const AUTH_PASSWORD = 'LeadPick#BM2026!'
const SESSION_KEY = 'leadpick_session'

export function login(email: string, password: string): boolean {
  const ok =
    email.trim().toLowerCase() === AUTH_EMAIL && password === AUTH_PASSWORD
  if (ok) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: AUTH_EMAIL, at: Date.now() }))
  }
  return ok
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function isAuthenticated(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const data = JSON.parse(raw) as { email?: string }
    return data.email === AUTH_EMAIL
  } catch {
    return false
  }
}

export function getSessionEmail(): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { email?: string }
    return data.email ?? null
  } catch {
    return null
  }
}
