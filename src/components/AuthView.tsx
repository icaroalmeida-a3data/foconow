import { useState, type FormEvent } from 'react'
import { LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../lib/auth'

function PixelLogo() {
  return (
    <svg viewBox="0 0 16 16" className="size-10" shapeRendering="crispEdges" aria-hidden>
      <g fill="var(--color-brand)">
        <rect x="7" y="1" width="2" height="4" />
        <rect x="7" y="11" width="2" height="4" />
        <rect x="1" y="7" width="4" height="2" />
        <rect x="11" y="7" width="4" height="2" />
        <rect x="3" y="3" width="2" height="2" />
        <rect x="11" y="3" width="2" height="2" />
        <rect x="3" y="11" width="2" height="2" />
        <rect x="11" y="11" width="2" height="2" />
        <rect x="5" y="5" width="6" height="6" />
      </g>
      <rect x="7" y="7" width="2" height="2" fill="var(--color-bg)" />
    </svg>
  )
}

export function AuthView() {
  const signIn = useAuth((s) => s.signIn)
  const signUp = useAuth((s) => s.signUp)

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        const err = await signIn(email, password)
        if (err) setError(err)
        // sucesso: onAuthStateChange troca a tela sozinho
      } else {
        const { error: err, needsConfirmation } = await signUp(email, password)
        if (err) setError(err)
        else if (needsConfirmation) {
          setInfo('Conta criada! Confira seu e-mail para confirmar o cadastro antes de entrar.')
          setMode('login')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="pixel-panel animate-pop-in w-full max-w-sm bg-surface p-6">
        <div className="mb-6 flex flex-col items-center gap-3">
          <PixelLogo />
          <h1 className="font-pixel text-sm text-ink">FocoNow</h1>
          <p className="text-center text-sm text-muted">
            {mode === 'login' ? 'Entre para acessar suas tarefas e seu progresso.' : 'Crie sua conta para salvar tudo na nuvem.'}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
            E-mail
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pixel-input px-3 py-2 text-sm font-normal text-ink"
              placeholder="voce@exemplo.com"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
            Senha
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pixel-input px-3 py-2 text-sm font-normal text-ink"
              placeholder="mínimo 6 caracteres"
            />
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}
          {info && <p className="text-xs text-focus">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="pixel-btn mt-1 flex items-center justify-center gap-2 bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(null)
            setInfo(null)
          }}
          className="mt-4 w-full text-center text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          {mode === 'login' ? 'Não tem conta? Criar uma agora' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}
