import { useState } from 'react'
import { CalendarCheck, Droplets, ListChecks, Sparkles, Timer, Trophy, X } from 'lucide-react'
import { markOnboardingSeen } from '../lib/onboarding'

interface Step {
  icon: typeof Sparkles
  title: string
  body?: string
  bullets?: string[]
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Bem-vindo ao FocoNow',
    body: 'Feito para quem vive entre reuniões e precisa proteger tempo para trabalho profundo — como montar propostas e desenhar arquiteturas. São 5 passos rápidos para entender o fluxo.',
  },
  {
    icon: ListChecks,
    title: '1. Registre suas tarefas',
    body: 'Categorize cada tarefa (Proposta, Reunião, Arquitetura, Documentação, Admin) e defina a prioridade. O 🍅 é quantos Pomodoros — blocos de ~25 min de foco — você estima que a tarefa vai levar. Isso te ajuda a dimensionar o esforço antes de começar.',
  },
  {
    icon: Timer,
    title: '2. Entre em Foco',
    body: 'Escolha uma tarefa pendente e inicie um Pomodoro: 25 min de foco, pausas de 5 min, e uma pausa longa de 15 min a cada 4 blocos. Use os espaços entre reuniões para avançar de verdade.',
  },
  {
    icon: Trophy,
    title: '3. Ganhe Recompensas',
    body: 'Cada tarefa concluída e cada bloco de foco geram pontos. Mantenha a sequência (streak) diária e desbloqueie conquistas — um empurrão extra pra manter a constância em dias cheios.',
  },
  {
    icon: Droplets,
    title: '4. Cuide de você',
    body: 'Configure seu horário de trabalho e peso no ⚙️ do topo: os lembretes de água e de inatividade só chegam dentro do expediente, e a meta diária de água é calculada pelo seu peso (35 ml/kg). Confirme cada copo no Painel para encher o copo pixel — bater a meta rende pontos e conquistas! Permita as notificações do navegador para não perder os avisos.',
  },
  {
    icon: CalendarCheck,
    title: '5. Fluxo sugerido do seu dia',
    bullets: [
      'Antes das reuniões: abra o Painel e liste as tarefas do dia (propostas, follow-ups, entregas)',
      'Num espaço livre na agenda: vá em Foco, vincule a uma tarefa e rode um Pomodoro',
      'Entre reuniões: aproveite as pausas curtas sem culpa',
      'Fim do dia: marque o que concluiu e confira pontos e streak em Recompensas',
    ],
  },
]

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const step = STEPS[index]
  const Icon = step.icon
  const isLast = index === STEPS.length - 1

  function finish() {
    markOnboardingSeen()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="pixel-panel animate-pop-in relative w-full max-w-md bg-surface p-6">
        <button onClick={finish} className="absolute right-4 top-4 p-1 text-muted hover:bg-bg" title="Pular">
          <X size={18} />
        </button>

        <div className="mb-4 flex size-12 items-center justify-center border-2 border-ink bg-brand-light text-brand-dark">
          <Icon size={24} />
        </div>

        <h2 className="mb-3 font-pixel text-xs leading-relaxed text-ink">{step.title}</h2>

        {step.body && <p className="text-sm leading-relaxed text-muted">{step.body}</p>}

        {step.bullets && (
          <ul className="flex flex-col gap-2 text-sm text-muted">
            {step.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-brand">■</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className={`size-2.5 border border-ink ${i === index ? 'bg-brand' : 'bg-bg'}`} />
            ))}
          </div>
          <div className="flex gap-3">
            {index > 0 && (
              <button onClick={() => setIndex(index - 1)} className="px-3 py-1.5 text-sm font-medium text-muted hover:bg-bg">
                Voltar
              </button>
            )}
            {isLast ? (
              <button onClick={finish} className="pixel-btn bg-brand px-4 py-1.5 text-sm font-medium text-white">
                Vamos começar
              </button>
            ) : (
              <button
                onClick={() => setIndex(index + 1)}
                className="pixel-btn bg-brand px-4 py-1.5 text-sm font-medium text-white"
              >
                Próximo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
