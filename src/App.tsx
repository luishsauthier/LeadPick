import { useState } from 'react'
import { AppShell } from './components/AppShell'
import { isAuthenticated } from './lib/auth'
import { CleanWizard } from './pages/CleanWizard'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import './App.css'

type Screen = 'home' | 'wizard'

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const [screen, setScreen] = useState<Screen>('home')
  const [homeKey, setHomeKey] = useState(0)

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />
  }

  return (
    <AppShell
      onLogout={() => {
        setAuthed(false)
        setScreen('home')
      }}
    >
      {screen === 'home' ? (
        <HomePage key={homeKey} onStart={() => setScreen('wizard')} />
      ) : (
        <CleanWizard
          onCancel={() => setScreen('home')}
          onComplete={() => {
            setHomeKey((k) => k + 1)
            setScreen('home')
          }}
        />
      )}
    </AppShell>
  )
}
