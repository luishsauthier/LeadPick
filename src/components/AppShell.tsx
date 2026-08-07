import type { ReactNode } from 'react'
import logoIcon from '../assets/lead_pick_icon.png'
import { getSessionEmail, logout } from '../lib/auth'

type AppShellProps = {
  children: ReactNode
  onLogout?: () => void
  showNav?: boolean
}

export function AppShell({ children, onLogout, showNav = true }: AppShellProps) {
  const email = getSessionEmail()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img
            className="brand-icon"
            src={logoIcon}
            alt=""
            width={34}
            height={34}
          />
          <div>
            <p className="brand-name">LeadPick</p>
            <p className="brand-tag">Limpeza de base comercial</p>
          </div>
        </div>
        {showNav && email && (
          <div className="topbar-actions">
            <span className="user-chip">{email}</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                logout()
                onLogout?.()
              }}
            >
              Sair
            </button>
          </div>
        )}
      </header>
      <main className="shell-main">{children}</main>
    </div>
  )
}
