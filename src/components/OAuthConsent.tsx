import { useEffect, useState } from 'react'
import { Check, PlugZap, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

// Tela de consentimento do servidor OAuth do Supabase (Authentication > OAuth Server >
// Authorization Path = /oauth/consent). É por aqui que o Claude ganha acesso às tarefas
// pelo conector MCP: o Supabase manda o usuário para cá com ?authorization_id=...

type Details = { clientName: string; redirectUri: string; scopes: string[] }

export function OAuthConsent() {
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const authorizationId = new URLSearchParams(window.location.search).get('authorization_id')

  const [details, setDetails] = useState<Details | null>(null)
  const [error, setError] = useState<string | null>(
    authorizationId ? null : 'Link de autorização inválido: falta o authorization_id.',
  )
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!authorizationId) return
    supabase.auth.oauth.getAuthorizationDetails(authorizationId).then(({ data, error: err }) => {
      if (err || !data) {
        setError(err?.message ?? 'Não foi possível carregar o pedido de acesso.')
      } else if ('authorization_id' in data) {
        setDetails({
          clientName: data.client.name,
          redirectUri: data.redirect_uri,
          scopes: data.scope.split(' ').filter(Boolean),
        })
      } else {
        // já autorizado antes: o Supabase devolve direto o redirect com o código
        window.location.href = data.redirect_url
      }
    })
  }, [authorizationId])

  async function decide(approve: boolean) {
    if (!authorizationId) return
    setBusy(true)
    const { data, error: err } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId)
    if (err || !data) {
      setError(err?.message ?? 'Não foi possível concluir. Tente de novo.')
      setBusy(false)
      return
    }
    window.location.href = data.redirect_url
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="pixel-panel animate-pop-in w-full max-w-sm bg-surface p-6">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <PlugZap size={32} className="text-brand" />
          <h1 className="font-pixel text-sm text-ink">Conectar ao FocoNow</h1>
        </div>

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        {!error && !details && <p className="text-center text-sm text-muted">Carregando pedido…</p>}

        {!error && details && (
          <>
            <p className="mb-3 text-sm text-ink">
              <strong>{details.clientName}</strong> quer acessar o FocoNow como <strong>{user?.email}</strong>.
            </p>
            <p className="mb-2 text-sm text-muted">Com esse acesso ele poderá:</p>
            <ul className="mb-4 list-disc pl-5 text-sm text-muted">
              <li>ver suas tarefas e o histórico</li>
              <li>criar, editar, concluir e excluir tarefas</li>
            </ul>
            <p className="mb-5 break-all text-xs text-muted">Retorno para: {details.redirectUri}</p>

            <div className="flex gap-2">
              <button
                onClick={() => decide(false)}
                disabled={busy}
                className="pixel-btn flex flex-1 items-center justify-center gap-2 bg-surface px-4 py-2 text-sm text-ink disabled:opacity-50"
              >
                <X size={16} /> Negar
              </button>
              <button
                onClick={() => decide(true)}
                disabled={busy}
                className="pixel-btn flex flex-1 items-center justify-center gap-2 bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <Check size={16} /> {busy ? 'Aguarde…' : 'Permitir'}
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => signOut()}
          className="mt-4 w-full text-center text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Não é você? Entrar com outra conta
        </button>
      </div>
    </div>
  )
}
