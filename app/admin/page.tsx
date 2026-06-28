import { createAdminClient } from "@/lib/supabase/admin"
import { formatCurrency } from "@/lib/utils"
import { Users, UserCircle, ClipboardList, DollarSign, TrendingDown, Activity } from "lucide-react"
import AdminDashboardCharts from "./AdminDashboardCharts"

const PLAN_PRICES: Record<string, number> = {
  trader:     99,
  trader_pro: 179,
  pro:        99,
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const [
    { data: profiles },
    { data: apostas },
    { data: movimentacoes },
    { data: profileBets },
    { data: subscriptions },
  ] = await Promise.all([
    supabase.from("profiles").select("id, user_id, nome, sobrenome, apelido, email, ativo, created_at"),
    supabase.from("apostas").select("id, profile_id, investimento_total, lucro_garantido, resultado_real, status, created_at"),
    supabase.from("movimentacoes_financeiras").select("profile_id, tipo, valor"),
    supabase.from("profile_bets").select("profile_id, saldo, ativo"),
    supabase.from("subscriptions").select("user_id, stripe_customer_id, status, plan, created_at"),
  ])

  const stripeMap = new Map<string, boolean>()
  for (const s of subscriptions ?? []) {
    if (s.stripe_customer_id) stripeMap.set(s.user_id, true)
  }

  type ProfileRow = {
    id: string; user_id: string; nome: string; sobrenome: string
    apelido: string | null; email: string | null; ativo: boolean; created_at: string
    totalApostas: number; apostasPendentes: number; apostasFinalizadas: number
    lucroRealizado: number; lucroPendente: number; totalInvestido: number
    totalDepositos: number; totalSaques: number; saldoTotal: number
    betsCount: number; hasStripe: boolean
  }

  const profileMap = new Map<string, ProfileRow>()
  for (const p of profiles ?? []) {
    profileMap.set(p.id, {
      ...p,
      totalApostas: 0, apostasPendentes: 0, apostasFinalizadas: 0,
      lucroRealizado: 0, lucroPendente: 0, totalInvestido: 0,
      totalDepositos: 0, totalSaques: 0, saldoTotal: 0, betsCount: 0,
      hasStripe: stripeMap.get(p.user_id) ?? false,
    })
  }

  for (const a of apostas ?? []) {
    const p = profileMap.get(a.profile_id)
    if (!p) continue
    p.totalApostas++
    if (a.status === "pendente") {
      p.apostasPendentes++
      p.lucroPendente  += Number(a.lucro_garantido ?? 0)
      p.totalInvestido += Number(a.investimento_total ?? 0)
    } else if (a.status === "finalizada") {
      p.apostasFinalizadas++
      p.lucroRealizado += Number(a.resultado_real ?? 0)
      p.totalInvestido += Number(a.investimento_total ?? 0)
    }
  }

  for (const m of movimentacoes ?? []) {
    const p = profileMap.get(m.profile_id)
    if (!p) continue
    if (m.tipo === "deposito") p.totalDepositos += Number(m.valor)
    else if (m.tipo === "saque") p.totalSaques += Number(m.valor)
  }

  for (const pb of profileBets ?? []) {
    const p = profileMap.get(pb.profile_id)
    if (!p) continue
    p.saldoTotal += Number(pb.saldo ?? 0)
    if (pb.ativo) p.betsCount++
  }

  const allProfiles    = Array.from(profileMap.values())
  const totalUsuarios  = new Set(allProfiles.map(p => p.user_id)).size
  const totalPerfis    = allProfiles.length
  const totalApostas   = allProfiles.reduce((s, p) => s + p.totalApostas, 0)
  const totalDepositos = allProfiles.reduce((s, p) => s + p.totalDepositos, 0)
  const totalSaques    = allProfiles.reduce((s, p) => s + p.totalSaques, 0)
  const totalLucro     = allProfiles.reduce((s, p) => s + p.lucroRealizado, 0)

  // Real MRR based on actual plan prices
  const mrr = (subscriptions ?? [])
    .filter(s => s.status === "active" || s.status === "trialing")
    .reduce((sum, s) => sum + (PLAN_PRICES[s.plan ?? ""] ?? 99), 0)

  const stats = [
    { label: "Usuários",         value: totalUsuarios,             icon: Users,        color: "text-blue-400",   bg: "bg-blue-500/10" },
    { label: "Perfis",           value: totalPerfis,               icon: UserCircle,   color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Apostas",          value: totalApostas,              icon: ClipboardList,color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Lucro Total",      value: formatCurrency(totalLucro),icon: Activity,     color: totalLucro >= 0 ? "text-green-400" : "text-red-400", bg: totalLucro >= 0 ? "bg-green-500/10" : "bg-red-500/10" },
    { label: "Total Depositado", value: formatCurrency(totalDepositos), icon: DollarSign,  color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Total Sacado",     value: formatCurrency(totalSaques),    icon: TrendingDown,color: "text-red-400",   bg: "bg-red-500/10" },
  ]

  // Chart data — last 12 months
  const now = new Date()
  const months: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`)
  }

  const userMonthMap: Record<string, Set<string>> = {}
  for (const m of months) userMonthMap[m] = new Set()
  for (const p of profiles ?? []) {
    const d = new Date(p.created_at)
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`
    userMonthMap[key]?.add(p.user_id)
  }

  const subMonthMrr: Record<string, number> = {}
  for (const m of months) subMonthMrr[m] = 0
  for (const s of subscriptions ?? []) {
    if (s.status !== "active" && s.status !== "trialing") continue
    const d = new Date(s.created_at)
    const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`
    if (key in subMonthMrr) subMonthMrr[key] += PLAN_PRICES[s.plan ?? ""] ?? 99
  }

  let cumMrr = 0
  const chartData = months.map(m => {
    cumMrr += subMonthMrr[m] ?? 0
    return { mes: m, usuarios: userMonthMap[m]?.size ?? 0, mrr: cumMrr }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral de toda a plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${bg} rounded-lg`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real MRR highlight */}
      <div className="bg-gray-900 border border-green-500/20 rounded-xl p-5 flex items-center gap-4">
        <div className="p-3 bg-green-500/10 rounded-xl">
          <DollarSign className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <p className="text-xs text-gray-400">MRR Real (assinaturas ativas)</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(mrr)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Calculado com os preços reais de cada plano</p>
        </div>
      </div>

      {/* Charts */}
      <AdminDashboardCharts data={chartData} />

      {/* Profiles table */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Perfis de Apostadores</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Perfil</th>
                  <th className="text-center px-3 py-3">Stripe</th>
                  <th className="text-center px-3 py-3">Status</th>
                  <th className="text-right px-3 py-3">Apostas</th>
                  <th className="text-right px-3 py-3">Pendentes</th>
                  <th className="text-right px-3 py-3">Lucro Real.</th>
                  <th className="text-right px-3 py-3">Lucro Pend.</th>
                  <th className="text-right px-3 py-3">Investido</th>
                  <th className="text-right px-3 py-3">Depósitos</th>
                  <th className="text-right px-3 py-3">Saques</th>
                  <th className="text-right px-4 py-3">Saldo Bets</th>
                </tr>
              </thead>
              <tbody>
                {allProfiles.length === 0 && (
                  <tr><td colSpan={11} className="text-center py-12 text-gray-500">Nenhum perfil cadastrado</td></tr>
                )}
                {allProfiles.map((p, i) => (
                  <tr key={p.id} className={`border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-gray-800/20"}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.apelido || `${p.nome} ${p.sobrenome}`}</p>
                      {p.email && <p className="text-xs text-gray-500">{p.email}</p>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.hasStripe ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"}`}>
                        {p.hasStripe ? "Stripe ativo" : "Sem Stripe"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.ativo ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.ativo ? "bg-green-500" : "bg-red-500"}`} />
                        {p.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-gray-300">{p.totalApostas}</td>
                    <td className="px-3 py-3 text-right text-yellow-400">{p.apostasPendentes}</td>
                    <td className={`px-3 py-3 text-right font-medium ${p.lucroRealizado >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(p.lucroRealizado)}</td>
                    <td className="px-3 py-3 text-right text-yellow-400">{formatCurrency(p.lucroPendente)}</td>
                    <td className="px-3 py-3 text-right text-gray-300">{formatCurrency(p.totalInvestido)}</td>
                    <td className="px-3 py-3 text-right text-green-400">{formatCurrency(p.totalDepositos)}</td>
                    <td className="px-3 py-3 text-right text-red-400">{formatCurrency(p.totalSaques)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${p.saldoTotal >= 0 ? "text-white" : "text-red-400"}`}>{formatCurrency(p.saldoTotal)}</td>
                  </tr>
                ))}
              </tbody>
              {allProfiles.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-700 bg-gray-800/50 text-xs font-semibold">
                    <td className="px-4 py-3 text-gray-400 uppercase tracking-wide">Total</td>
                    <td className="px-3 py-3" /><td className="px-3 py-3" />
                    <td className="px-3 py-3 text-right text-white">{totalApostas}</td>
                    <td className="px-3 py-3 text-right text-yellow-400">{allProfiles.reduce((s, p) => s + p.apostasPendentes, 0)}</td>
                    <td className={`px-3 py-3 text-right ${totalLucro >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(totalLucro)}</td>
                    <td className="px-3 py-3 text-right text-yellow-400">{formatCurrency(allProfiles.reduce((s, p) => s + p.lucroPendente, 0))}</td>
                    <td className="px-3 py-3 text-right text-white">{formatCurrency(allProfiles.reduce((s, p) => s + p.totalInvestido, 0))}</td>
                    <td className="px-3 py-3 text-right text-green-400">{formatCurrency(totalDepositos)}</td>
                    <td className="px-3 py-3 text-right text-red-400">{formatCurrency(totalSaques)}</td>
                    <td className="px-4 py-3 text-right text-white">{formatCurrency(allProfiles.reduce((s, p) => s + p.saldoTotal, 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
