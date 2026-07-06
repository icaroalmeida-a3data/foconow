export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function notify(title: string, body: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'granted') {
    const n = new Notification(title, { body, icon: '/favicon.svg' })
    // clicar na notificação traz o app para frente (para confirmar o copo, por exemplo)
    n.onclick = () => {
      window.focus()
      n.close()
    }
  }
}

let audioCtx: AudioContext | null = null

function beep(ctx: AudioContext, startAt: number, frequency: number, durationSec: number, peakGain = 0.2) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec)
  osc.start(startAt)
  osc.stop(startAt + durationSec)
}

/** Toca ao fim de um bloco de foco: duas notas ascendentes, tom de comemoração. */
export function playFocusEndChime() {
  try {
    audioCtx ??= new AudioContext()
    const ctx = audioCtx
    beep(ctx, ctx.currentTime, 880, 0.22)
    beep(ctx, ctx.currentTime + 0.16, 1318.5, 0.35)
  } catch {
    // ambiente sem suporte a áudio, ignora
  }
}

/** Toca ao fim de uma pausa: um único beep mais grave, sinalizando volta ao foco. */
export function playBreakEndChime() {
  try {
    audioCtx ??= new AudioContext()
    const ctx = audioCtx
    beep(ctx, ctx.currentTime, 587.33, 0.45, 0.16)
  } catch {
    // ambiente sem suporte a áudio, ignora
  }
}
