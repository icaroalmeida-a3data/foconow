import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthState {
  user: User | null
  authLoaded: boolean
  init: () => void
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

let initialized = false

export const useAuth = create<AuthState>((set) => ({
  user: null,
  authLoaded: false,

  init: () => {
    if (initialized) return
    initialized = true
    supabase.auth.getSession().then(async ({ data }) => {
      // Auto-login SÓ em dev, com uma conta de teste comum (RLS vale igual).
      // Configure VITE_DEV_LOGIN_EMAIL/PASSWORD no .env.local; builds de
      // produção ignoram isso mesmo que as variáveis existam.
      if (!data.session && import.meta.env.DEV) {
        const email = import.meta.env.VITE_DEV_LOGIN_EMAIL as string | undefined
        const password = import.meta.env.VITE_DEV_LOGIN_PASSWORD as string | undefined
        if (email && password) {
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (!error) return // onAuthStateChange assume daqui
          console.warn('Auto-login de dev falhou:', error.message)
        }
      }
      set({ user: data.session?.user ?? null, authLoaded: true })
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, authLoaded: true })
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? traduzErro(error.message) : null
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: traduzErro(error.message), needsConfirmation: false }
    // Sem sessão na resposta = projeto exige confirmação por e-mail
    return { error: null, needsConfirmation: !data.session }
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },
}))

function traduzErro(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered')) return 'Este e-mail já tem cadastro. Tente entrar.'
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  if (m.includes('fetch')) return 'Sem conexão com o servidor. Verifique sua internet.'
  return message
}
