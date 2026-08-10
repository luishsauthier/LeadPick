import { useEffect, useState } from 'react'
import { AppShell } from './components/AppShell'
import { isAuthenticated } from './lib/auth'
import {
  clearDraft,
  loadDraft,
  peekDraftSummary,
  type CleaningDraft,
} from './lib/draft'
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

  useEffect(() => {
    // Garante migração de rascunho legado ao abrir o app
    void loadDraft()
  }, [])

  async function openNewWizard() {
    const existing = peekDraftSummary() ?? (await loadDraft())
    if (existing) {
      const ok = window.confirm(
        'Já existe uma limpeza em andamento neste navegador.\n\nSe continuar, esse progresso será descartado. Deseja mesmo começar uma nova limpeza?',
      )
      if (!ok) return
    }
    await clearDraft()
    setWizardDraft(null)
    setWizardKey((k) => k + 1)
    setScreen('wizard')
  }

  async function openResumeWizard() {
    const draft = await loadDraft()
    if (!draft) {
      window.alert(
        'Não encontramos progresso salvo neste navegador.\n\nSe você baixou o arquivo de progresso (.json), use “Continuar de arquivo” na home.',
      )
      setHomeKey((k) => k + 1)
      return
    }
    setWizardDraft(draft)
    setWizardKey((k) => k + 1)
    setScreen('wizard')
  }

  async function openImportedDraft(draft: CleaningDraft) {
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
          onStart={() => void openNewWizard()}
          onResume={() => void openResumeWizard()}
          onImportDraft={(draft) => void openImportedDraft(draft)}
          onDiscardDraft={() => {
            const ok = window.confirm(
              'Descartar a limpeza em andamento? Essa ação não pode ser desfeita.',
            )
            if (!ok) return
            void clearDraft().then(() => setHomeKey((k) => k + 1))
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
