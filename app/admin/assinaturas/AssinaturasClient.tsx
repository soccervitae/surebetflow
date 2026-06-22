"use client"

import { useState } from "react"
import { CheckCircle, Clock, XCircle, AlertCircle, TrendingUp, Users, DollarSign, Search, MoreVertical, RefreshCw } from "lucide-react"
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
  past_due:   { label: "Vencida",   color: "text-red-400",    bg: "bg-red-500/10",    icon: AlertCircle },
  canceled:   { label: "Cancelada", color: "text-gray-400",   bg: "bg-gray-500/10",   icon: XCircle },
  incomplete: { label: "Pendente",  color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Clock },
  inactive:   { label: "Inativa",   color: "text-gray-400",   bg: "bg-gray-500/10",   icon: XCircle },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Assinaturas</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie todos os assinantes da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total",      value: stats.total,      color: "text-white",        icon: Users,      suffix: "" },
          { label: "Ativas",     value: stats.active,     color: "text-green-400",    icon: CheckCircle,suffix: "" },
          { label: "Canceladas", value: stats.canceled,   color: "text-gray-400",     icon: XCircle,    suffix: "" },
          { label: "Pendentes",  value: stats.incomplete, color: "text-yellow-400",   icon: AlertCircle,suffix: "" },
          { label: "MRR",        value: stats.mrr,        color: "text-[#1e3a8a]",    icon: DollarSign, suffix: "" },
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
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Próx. cobrança</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Assinante desde</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">ID MP</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 text-sm">
                    Nenhuma assinatura encontrada
                  </td>
                </tr>
              ) : filtered.map(s => {
                const st = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.inactive
                const StIcon = st.icon
                const isActive = s.status === "active" || s.status === "trialing"
                return (
                  <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{emailMap[s.user_id] ?? s.user_id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${st.bg} ${st.color}`}>
                        <StIcon className="w-3 h-3" />
                        {st.label}
                      </span>
                      {s.cancel_at_period_end && (
                        <span className="ml-2 text-xs text-red-400">cancela no fim</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-white capitalize">{s.plan ?? "—"}</span>
                      <p className="text-xs text-gray-500">R$ 99,00/mês</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-300">
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
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500 font-mono">
                        {s.stripe_subscription_id
                          ? s.stripe_subscription_id.slice(0, 16) + "..."
                          : "—"}
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
                        <div className="absolute right-4 top-10 z-10 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden w-44">
                          {!isActive && (
                            <button
                              onClick={() => handleAction(s.user_id, "activate")}
                              className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-gray-700 transition-colors"
                            >
                              Ativar acesso
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
    </div>
  )
}
