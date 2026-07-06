import { useEffect } from 'react'
import { AlarmClock, AlertTriangle, Coffee, Droplets, PartyPopper, X } from 'lucide-react'
import { useAppStore } from '../store'

const KIND_META = {
  foco: { icon: PartyPopper, className: 'bg-brand-light text-brand-dark' },
  pausa: { icon: Coffee, className: 'bg-focus-light text-focus' },
  agua: { icon: Droplets, className: 'bg-water-light text-water' },
  inatividade: { icon: AlarmClock, className: 'bg-warn-light text-warn' },
  erro: { icon: AlertTriangle, className: 'bg-danger-light text-danger' },
} as const

export function Toast() {
  const toast = useAppStore((s) => s.toast)
  const clearToast = useAppStore((s) => s.clearToast)
  const addWater = useAppStore((s) => s.addWater)

  useEffect(() => {
    if (!toast) return
    // o aviso de água fica mais tempo na tela para dar chance de confirmar o copo
    const timeout = setTimeout(clearToast, toast.kind === 'agua' ? 20000 : 5000)
    return () => clearTimeout(timeout)
  }, [toast, clearToast])

  if (!toast) return null
  const { icon: Icon, className } = KIND_META[toast.kind]

  return (
    <div className="pixel-panel fixed bottom-6 right-6 z-40 flex max-w-xs items-start gap-3 bg-surface p-4 animate-pop-in">
      <div className={`flex size-9 shrink-0 items-center justify-center border-2 border-ink ${className}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        <p className="text-xs text-muted">{toast.body}</p>
        {toast.kind === 'agua' && (
          <button
            onClick={() => {
              addWater()
              clearToast()
            }}
            className="pixel-btn mt-2 flex items-center gap-1.5 bg-water px-2.5 py-1 text-xs font-medium text-white"
          >
            <Droplets size={13} /> Bebi! Confirmar copo
          </button>
        )}
      </div>
      <button onClick={clearToast} className="p-1 text-muted hover:bg-bg">
        <X size={14} />
      </button>
    </div>
  )
}
