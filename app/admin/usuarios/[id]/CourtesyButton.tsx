"use client"

import { useState } from "react"
import { Gift, X, Loader2, Calendar } from "lucide-react"

const PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "1 ano", days: 365 },
]

function addDays(d: number) {
  const dt = new Date()
  dt.setDate(dt.getDate() + d)
  return dt.toISOString().slice(0, 10)
}

export default function CourtesyButton({ userId, hasCourtesy, expiresAt }: {
  userId: string
  hasCourtesy: boolean
  expiresAt: string | null
}) {
  const [active, setActive] = useState(hasCourtesy)
  const [expires, setExpires] = useState<string | null>(expiresAt)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number | null>(30)
  const [customDate, setCustomDate] = useState("")

  async function grant() {
    setLoading(true)
    const endDate = selectedDays ? addDays(selectedDays) : customDate
    const res = await fetch("/api/admin/courtesy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "grant", endsAt: endDate }),
    })
    if (res.ok) {
      setActive(true)
      setExpires(endDate)
      setShowModal(false)
    }
    setLoading(false)
  }

  async function revoke() {
    setLoading(true)
    const res = await fetch("/api/admin/courtesy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "revoke" }),
    })
    if (res.ok) {
      setActive(false)
      setExpires(null)
    }
    setLoading(false)
  }

  const isExpired = expires ? new Date(expires) < new Date() : false
  const expiresLabel = expires
    ? new Date(expires).toLocaleDateString("pt-BR")
    : null

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        {active && expiresLabel && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            isExpired ? "bg-red-500/10 text-red-400" : "bg-purple-500/10 text-purple-400"
          }`}>
            <Calendar className="inline w-3 h-3 mr-1" />
            {isExpired ? "Expirou em" : "Expira em"} {expiresLabel}
          </span>
        )}
        {active ? (
          <button
            onClick={revoke}
            disabled={loading}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            Revogar cortesia
          </button>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400"
          >
            <Gift className="w-4 h-4" />
            Conceder cortesia
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Conceder acesso cortesia</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">Por quanto tempo este usuário terá acesso gratuito?</p>

            <div className="flex gap-2 mb-4">
              {PRESETS.map(p => (
                <button
                  key={p.days}
                  onClick={() => { setSelectedDays(p.days); setCustomDate("") }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    selectedDays === p.days
                      ? "bg-[#1e3a8a] border-[#1e3a8a] text-white"
                      : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-xs text-gray-500 mb-1.5 block">Ou escolha uma data específica</label>
              <input
                type="date"
                value={customDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => { setCustomDate(e.target.value); setSelectedDays(null) }}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#1e3a8a]/60"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={grant}
                disabled={loading || (!selectedDays && !customDate)}
                className="flex-1 py-2.5 rounded-xl bg-[#1e3a8a] hover:bg-[#1e40af] disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
