import { useState } from 'react'
import { MonitorDown, Share, SquarePlus, X } from 'lucide-react'
import { useInstallPrompt } from '../lib/installPrompt'

export function InstallButton() {
  const { installed, canPrompt, isIOS, install } = useInstallPrompt()
  const [iosHelpOpen, setIosHelpOpen] = useState(false)

  // Já instalado ou navegador sem suporte: não mostra nada
  if (installed || (!canPrompt && !isIOS)) return null

  return (
    <>
      <button
        onClick={() => (canPrompt ? install() : setIosHelpOpen(true))}
        title="Instalar o FocoNow como aplicativo"
        className="pixel-btn flex items-center gap-1.5 bg-surface p-1.5 text-muted hover:bg-bg hover:text-ink"
      >
        <MonitorDown size={18} />
        <span className="hidden text-sm font-medium lg:inline">Instalar app</span>
      </button>

      {iosHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="pixel-panel animate-pop-in relative w-full max-w-sm bg-surface p-6">
            <button
              onClick={() => setIosHelpOpen(false)}
              className="absolute right-4 top-4 p-1 text-muted hover:bg-bg"
              title="Fechar"
            >
              <X size={18} />
            </button>
            <h2 className="mb-4 font-pixel text-xs text-ink">Instalar no iPhone/iPad</h2>
            <ol className="flex flex-col gap-3 text-sm text-muted">
              <li className="flex items-center gap-2">
                1. Toque em <Share size={16} className="shrink-0 text-ink" />
                <span className="font-semibold text-ink">Compartilhar</span> no Safari
              </li>
              <li className="flex items-center gap-2">
                2. Escolha <SquarePlus size={16} className="shrink-0 text-ink" />
                <span className="font-semibold text-ink">Adicionar à Tela de Início</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  )
}
