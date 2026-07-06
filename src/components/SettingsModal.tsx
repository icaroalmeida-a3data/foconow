import { useState } from 'react'
import { LogOut, X } from 'lucide-react'
import { useAppStore } from '../store'
import { useAuth } from '../lib/auth'
import { ML_PER_KG, waterGoalMl } from '../lib/water'
import { IDLE_AFTER_MIN, WATER_INTERVAL_MIN } from '../lib/wellness'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useAppStore((s) => s.settings)
  const saveSettings = useAppStore((s) => s.saveSettings)
  const user = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)

  const [workStart, setWorkStart] = useState(settings.workStart)
  const [workEnd, setWorkEnd] = useState(settings.workEnd)
  const [weightKg, setWeightKg] = useState(settings.weightKg?.toString() ?? '')
  const [cupMl, setCupMl] = useState(settings.cupMl)

  const weight = Number(weightKg)
  const previewGoal = waterGoalMl(weight > 0 ? weight : null)
  const invalidHours = workEnd <= workStart

  async function save() {
    await saveSettings({
      workStart,
      workEnd,
      weightKg: weight > 0 ? weight : null,
      cupMl: Math.min(1000, Math.max(100, Math.round(cupMl) || 250)),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="pixel-panel animate-pop-in relative w-full max-w-md bg-surface p-6">
        <button onClick={onClose} className="absolute right-4 top-4 p-1 text-muted hover:bg-bg" title="Fechar">
          <X size={18} />
        </button>

        <h2 className="mb-4 font-pixel text-xs text-ink">Ajustes</h2>

        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-ink">Horário de trabalho</legend>
            <div className="flex items-center gap-2 text-sm text-muted">
              <label className="flex items-center gap-1.5">
                das
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="pixel-input px-2 py-1 text-sm text-ink"
                />
              </label>
              <label className="flex items-center gap-1.5">
                às
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="pixel-input px-2 py-1 text-sm text-ink"
                />
              </label>
            </div>
            {invalidHours && <p className="text-xs text-danger">O fim precisa ser depois do início.</p>}
            <p className="text-xs text-muted">
              Lembretes de água (a cada {WATER_INTERVAL_MIN} min) e de inatividade ({IDLE_AFTER_MIN} min parado) só chegam
              dentro desse horário.
            </p>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-ink">Hidratação</legend>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <label className="flex items-center gap-1.5">
                Peso
                <input
                  type="number"
                  min={20}
                  max={300}
                  placeholder="kg"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="pixel-input w-20 px-2 py-1 text-sm text-ink"
                />
                kg
              </label>
              <label className="flex items-center gap-1.5">
                Copo de
                <input
                  type="number"
                  min={100}
                  max={1000}
                  step={50}
                  value={cupMl}
                  onChange={(e) => setCupMl(Number(e.target.value))}
                  className="pixel-input w-20 px-2 py-1 text-sm text-ink"
                />
                ml
              </label>
            </div>
            <p className="text-xs text-muted">
              Meta diária: <span className="font-semibold text-water">{previewGoal} ml</span> ({ML_PER_KG} ml por kg
              {weight > 0 ? '' : ' — usando padrão de 2000 ml até você informar o peso'}) ≈{' '}
              {Math.ceil(previewGoal / Math.max(100, cupMl || 250))} copos. Bater a meta rende pontos e conquistas!
            </p>
          </fieldset>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => signOut()}
            title={user?.email ? `Sair da conta ${user.email}` : 'Sair da conta'}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted hover:bg-bg hover:text-danger"
          >
            <LogOut size={14} /> Sair{user?.email ? ` (${user.email})` : ''}
          </button>
          <button
            onClick={save}
            disabled={invalidHours}
            className="pixel-btn bg-brand px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
