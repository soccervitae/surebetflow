"use client"

import { useState } from "react"
import { CheckCircle, Clock, XCircle, AlertCircle, Users, DollarSign, Search, MoreVertical, RefreshCw, Download, Gift, X, Loader2, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

type Sub = {
  id: string
  user_id: string
  plan: string | null
  status: string
  stripe_subscription_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

type Stats = {
  total: number
  active: number
  canceled: number
  incomplete: number
  mrr: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:     { label: "Ativa",     color: "text-green-400",  bg: "bg-green-500/10",  icon: CheckCircle },
  trialing:   { label: "Trial",     color: "text-blue-400",   bg: "bg-blue-500/10",   icon: Clock },
  courtesy:   { label: "Cortesia",  color: "text-purple-400", bg: "bg-purple-500/10", icon: Gift },
  past_due:   { label: "Vencida",   color: "text-red-400",    bg: "bg-red-500/10",    icon: AlertCircle },
  canceled:   { label: "Cancelada", color: "text-gray-400",   bg: "bg-gray-500/10",   icon: XCircle },
  incomplete: { label: "Pendente",  color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Clock },
  inactive:   { label: "Inativa",   color: "text-gray-400",   bg: "bg-gray-500/10",   icon: XCircle },
}

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

function exportCSV(subs: Sub[], emailMap: Record<string, string>) {
  const header = ["E-mail", "Status", "Plano", "Próx. cobrança", "Assinante desde", "ID Stripe"]
  const lines = subs.map(s => [
    `"${emailMap[s.user_id] ?? s.user_id}"`,
    s.status,
    s.plan ?? "",
    s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("pt-BR") : "",
    new Date(s.created_at).toLocaleDateString("pt-BR"),
    s.stripe_subscription_id ?? "",
  ].join(","))
  const csv = [header.join(","), ...lines].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "assinaturas.csv"; a.click()
  URL.revokeObjectURL(url)
}

export default function AssinaturasClient({ subs, emailMap, stats }: {
  subs: Sub[]
  emailMap: Record<string, string>
  stats: Stats
}) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const router = useRouter()

  // Courtesy modal state
  const [courtesyModal, setCourtesyModal] = useState<{ userId: string; email: string; isEdit?: boolean } | null>(null)
  const [selectedDays, setSelectedDays] = useState<number | null>(30)
  const [customDate, setCustomDate] = useState("")
  const [courtesyLoading, setCourtesyLoading] = useState(false)

  // New courtesy by email
  const [newCourtesyEmail, setNewCourtesyEmail] = useState("")
  const [newCourtesyModal, setNewCourtesyModal] = useState(false)
  const [newCourtesyLoading, setNewCourtesyLoading] = useState(false)
  const [newCourtesyError, setNewCourtesyError] = useState("")

  const filtered = subs.filter(s => {
    const email = emailMap[s.user_id] ?? ""
    const matchSearch = email.toLowerCase().includes(search.toLowerCase()) ||
      (s.stripe_subscription_id ?? "").toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "all" || s.status === filter
    return matchSearch && matchFilter
  })

  async function handleAction(userId: string, action: "activate" | "cancel") {
    setActionLoading(userId)
    setOpenMenu(null)
    await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action }),
    })
    setActionLoading(null)
    router.refresh()
  }

  function openCourtesyModal(userId: string, email: string, isEdit = false) {
    setOpenMenu(null)
    setSelectedDays(30)
    setCustomDate("")
    setCourtesyModal({ userId, email, isEdit })
  }

  async function grantCourtesy(userId: string) {
    const endsAt = selectedDays ? addDays(selectedDays) : customDate
    if (!endsAt) return
    setCourtesyLoading(true)
    await fetch("/api/admin/courtesy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "grant", endsAt }),
    })
    setCourtesyLoading(false)
    setCourtesyModal(null)
    router.refresh()
  }

  async function revokeCourtesy(userId: string) {
    setActionLoading(userId)
    setOpenMenu(null)
    await fetch("/api/admin/courtesy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "revoke" }),
    })
    setActionLoading(null)
    router.refresh()
  }

  async function grantCourtesyByEmail() {
    setNewCourtesyError("")
    const endsAt = selectedDays ? addDays(selectedDays) : customDate
    if (!endsAt || !newCourtesyEmail) return
    setNewCourtesyLoading(true)
    const res = await fetch("/api/admin/courtesy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newCourtesyEmail, action: "grant", endsAt }),
    })
    const data = await res.json()
    setNewCourtesyLoading(false)
    if (data.error) {
      setNewCourtesyError(data.error)
    } else {
      setNewCourtesyModal(false)
      setNewCourtesyEmail("")
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Assinaturas</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie todos os assinantes da plataforma</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setSelectedDays(30); setCustomDate(""); setNewCourtesyEmail(""); setNewCourtesyError(""); setNewCourtesyModal(true) }}
            className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Gift className="w-4 h-4" />
            Conceder cortesia
          </button>
          <button
            onClick={() => exportCSV(filtered, emailMap)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total",      value: stats.total,      color: "text-white",        icon: Users,       },
          { label: "Ativas",     value: stats.active,     color: "text-green-400",    icon: CheckCircle, },
          { label: "Canceladas", value: stats.canceled,   color: "text-gray-400",     icon: XCircle,     },
          { label: "Pendentes",  value: stats.incomplete, color: "text-yellow-400",   icon: AlertCircle, },
          { label: "MRR",        value: stats.mrr,        color: "text-blue-400",     icon: DollarSign,  },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>
                {s.label === "MRR" ? `R$ ${s.value.toLocaleString("pt-BR")}` : s.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por email ou ID da assinatura..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1e3a8a]/50"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#1e3a8a]/50"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativas</option>
          <option value="trialing">Trial</option>
          <option value="courtesy">Cortesia</option>
          <option value="past_due">Vencidas</option>
          <option value="canceled">Canceladas</option>
          <option value="incomplete">Pendentes</option>
          <option value="inactive">Inativas</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Usuário</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Plano</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Expira / Próx. cobrança</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Desde</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 text-sm">
                    Nenhuma assinatura encontrada
                  </td>
                </tr>
              ) : filtered.map(s => {
                const st = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.inactive
                const StIcon = st.icon
                const isActive = s.status === "active" || s.status === "trialing"
                const isCourtesy = s.status === "courtesy"
                const isExpired = isCourtesy && s.current_period_end && new Date(s.current_period_end) < new Date()
                return (
                  <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{emailMap[s.user_id] ?? s.user_id}</p>
                        {isCourtesy && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-purple-500/15 text-purple-400 border border-purple-500/25 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            <Gift className="w-2.5 h-2.5" />
                            Cortesia
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>
                        <StIcon className="w-3 h-3" />
                        {st.label}
                      </span>
                      {isExpired && <span className="ml-2 text-xs text-red-400">expirada</span>}
                      {s.cancel_at_period_end && <span className="ml-2 text-xs text-red-400">cancela no fim</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-white capitalize">{s.plan?.replace("_", " ") ?? "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm ${isExpired ? "text-red-400" : "text-gray-300"}`}>
                        {s.current_period_end
                          ? new Date(s.current_period_end).toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-300">
                        {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-5 py-4 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === s.id ? null : s.id)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        {actionLoading === s.user_id
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <MoreVertical className="w-4 h-4" />
                        }
                      </button>
                      {openMenu === s.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-4 top-10 z-20 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden w-48">
                            {!isActive && !isCourtesy && (
                              <button
                                onClick={() => handleAction(s.user_id, "activate")}
                                className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-gray-700 transition-colors"
                              >
                                Ativar acesso
                              </button>
                            )}
                            {!isCourtesy && (
                              <button
                                onClick={() => openCourtesyModal(s.user_id, emailMap[s.user_id] ?? s.user_id)}
                                className="w-full text-left px-4 py-2.5 text-sm text-purple-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                              >
                                <Gift className="w-3.5 h-3.5" />
                                Conceder cortesia
                              </button>
                            )}
                            {isCourtesy && (
                              <button
                                onClick={() => openCourtesyModal(s.user_id, emailMap[s.user_id] ?? s.user_id, true)}
                                className="w-full text-left px-4 py-2.5 text-sm text-purple-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                              >
                                <Gift className="w-3.5 h-3.5" />
                                Editar cortesia
                              </button>
                            )}
                            {isCourtesy && (
                              <button
                                onClick={() => revokeCourtesy(s.user_id)}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                              >
                                Revogar cortesia
                              </button>
                            )}
                            {isActive && (
                              <button
                                onClick={() => handleAction(s.user_id, "cancel")}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                              >
                                Cancelar acesso
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
            {filtered.length} assinatura{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Modal cortesia (usuário já na lista) */}
      {courtesyModal && (
        <CourtesyModal
          title={courtesyModal.isEdit ? `Editar cortesia — ${courtesyModal.email}` : `Cortesia para ${courtesyModal.email}`}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
          customDate={customDate}
          setCustomDate={setCustomDate}
          loading={courtesyLoading}
          onClose={() => setCourtesyModal(null)}
          onConfirm={() => grantCourtesy(courtesyModal.userId)}
        />
      )}

      {/* Modal cortesia (novo usuário por email) */}
      {newCourtesyModal && (
        <CourtesyModal
          title="Conceder acesso cortesia"
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
          customDate={customDate}
          setCustomDate={setCustomDate}
          loading={newCourtesyLoading}
          onClose={() => setNewCourtesyModal(false)}
          onConfirm={grantCourtesyByEmail}
          error={newCourtesyError}
        >
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1.5 block">E-mail do usuário</label>
            <input
              type="email"
              value={newCourtesyEmail}
              onChange={e => setNewCourtesyEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </CourtesyModal>
      )}
    </div>
  )
}

function CourtesyModal({ title, selectedDays, setSelectedDays, customDate, setCustomDate, loading, onClose, onConfirm, error, children }: {
  title: string
  selectedDays: number | null
  setSelectedDays: (d: number | null) => void
  customDate: string
  setCustomDate: (d: string) => void
  loading: boolean
  onClose: () => void
  onConfirm: () => void
  error?: string
  children?: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}

        <p className="text-gray-400 text-sm mb-4">Por quanto tempo?</p>
        <div className="flex gap-2 mb-4">
          {PRESETS.map(p => (
            <button
              key={p.days}
              onClick={() => { setSelectedDays(p.days); setCustomDate("") }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                selectedDays === p.days
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mb-5">
          <label className="text-xs text-gray-500 mb-1.5 block flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Ou data específica
          </label>
          <input
            type="date"
            value={customDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => { setCustomDate(e.target.value); setSelectedDays(null) }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
          />
        </div>
        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || (!selectedDays && !customDate)}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
