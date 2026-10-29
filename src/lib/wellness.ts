import { notify } from './notifications'
import { useAppStore } from '../store'
import { todayKey } from './rewards'
import { mlOnDay, waterGoalMl } from './water'

/** Intervalo entre lembretes de hidratação, em minutos. */
export const WATER_INTERVAL_MIN = 45
/** Tempo sem interação até considerar o usuário ausente, em minutos. */
export const IDLE_AFTER_MIN = 10
/** Intervalo mínimo entre avisos de inatividade, em minutos. */
export const IDLE_REPEAT_MIN = 15

let started = false

/** Lembretes só chegam dentro do horário de trabalho configurado. */
function inWorkHours() {
  const { workStart, workEnd } = useAppStore.getState().settings
  const now = new Date()
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return hm >= workStart && hm < workEnd
}

/** Timestamp do início do expediente de hoje (workStart do dia atual). */
function todayWorkStartTs() {
  const { workStart } = useAppStore.getState().settings
  const [h, m] = workStart.split(':').map(Number)
  const start = new Date()
  start.setHours(h, m, 0, 0)
  return start.getTime()
}

/**
 * Liga os lembretes de bem-estar: beber água em intervalo fixo e um chamado
 * de volta ao foco quando o app fica muito tempo sem uso (aba aberta,
 * mas sem interação e sem timer rodando). Ambos respeitam o horário
 * de trabalho, e o de água para quando a meta do dia é batida.
 */
export function startWellnessReminders() {
  if (started) return
  started = true

  setInterval(() => {
    if (!inWorkHours()) return
    const { settings, water } = useAppStore.getState()
    if (mlOnDay(water, todayKey()) >= waterGoalMl(settings.weightKg)) return
    const title = 'Hora de beber água 💧'
    const body = 'Beba um copo e confirme no app para encher a meta do dia.'
    notify(title, body)
    useAppStore.setState({ toast: { id: Date.now(), kind: 'agua', title, body } })
  }, WATER_INTERVAL_MIN * 60_000)

  let lastActivity = Date.now()
  let lastNudge = 0
  const bump = () => {
    lastActivity = Date.now()
  }
  for (const event of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']) {
    window.addEventListener(event, bump, { passive: true })
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) bump()
  })

  setInterval(() => {
    if (!inWorkHours()) return
    if (useAppStore.getState().timerRunning) return
    // Inatividade nunca conta antes do expediente de hoje: se o app ficou
    // aberto durante a noite, o contador recomeça a partir do workStart.
    const idleSince = Math.max(lastActivity, todayWorkStartTs())
    const idleMinutes = Math.floor((Date.now() - idleSince) / 60_000)
    const sinceNudgeMinutes = (Date.now() - lastNudge) / 60_000
    if (idleMinutes >= IDLE_AFTER_MIN && sinceNudgeMinutes >= IDLE_REPEAT_MIN) {
      lastNudge = Date.now()
      const title = 'Cadê você? 👾'
      const body = `Já são ${idleMinutes} min longe do FocoNow. Volte para focar nas tarefas!`
      notify(title, body)
      useAppStore.setState({ toast: { id: Date.now(), kind: 'inatividade', title, body } })
    }
  }, 60_000)
}
