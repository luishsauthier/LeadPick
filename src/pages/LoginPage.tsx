import { useState, type FormEvent } from 'react'
import { login } from '../lib/auth'

type LoginPageProps = {
  onSuccess: () => void
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (login(email, password)) {
      onSuccess()
      return
    }
    setError('E-mail ou senha inválidos.')
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-hero">
          <p className="eyebrow">BIMachine · Comercial</p>
          <h1 className="login-brand">LeadPick</h1>
          <p className="login-lead">
            Limpe bases de leads com segurança: remova Bads, resolva e-mails e
            empresas duplicadas, e exporte a lista pronta.
          </p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Acesso da equipe</h2>
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="comercial@bimachine.com.br"
              required
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block">
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}
