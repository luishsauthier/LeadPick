import { useState } from 'react'
import { AppShell } from './components/AppShell'
import { isAuthenticated } from './lib/auth'
import { clearDraft, loadDraft, type CleaningDraft } from './lib/draft'
import { CleanWizard } from './pages/CleanWizard'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import './App.css'

type Screen = 'home' | 'wizard'

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const [screen, setScreen] = useState<Screen>('home')
  const [homeKey, setHomeKey] = useState(0)
  const [wizardDraft, setWizardDraft] = useState<CleaningDraft | null>(null)
  const [wizardKey, setWizardKey] = useState(0)

  function openNewWizard() {
    clearDraft()
    setWizardDraft(null)
    setWizardKey((k) => k + 1)
    setScreen('wizard')
  }

  function openResumeWizard() {
    const draft = loadDraft()
    if (!draft) return
    setWizardDraft(draft)
    setWizardKey((k) => k + 1)
    setScreen('wizard')
  }

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
        <HomePage
          key={homeKey}
          onStart={openNewWizard}
          onResume={openResumeWizard}
          onDiscardDraft={() => {
            clearDraft()
            setHomeKey((k) => k + 1)
          }}
        />
      ) : (
        <CleanWizard
          key={wizardKey}
          initialDraft={wizardDraft}
          onCancel={() => {
            setHomeKey((k) => k + 1)
            setScreen('home')
          }}
          onComplete={() => {
            setWizardDraft(null)
            setHomeKey((k) => k + 1)
            setScreen('home')
          }}
        />
      )}
    </AppShell>
  )
}
