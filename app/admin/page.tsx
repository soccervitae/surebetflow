import { createClient } from "@/lib/supabase/server"
import { Users, UserCircle, Building2, ClipboardList, TrendingUp, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalUsuarios },
    { count: totalPerfis },
    { count: totalCasas },
    { count: totalApostas },
    { data: financeiro },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("bets").select("*", { count: "exact", head: true }),
    supabase.from("apostas").select("*", { count: "exact", head: true }),
    supabase.from("movimentacoes_financeiras").select("tipo, valor"),
  ])

  const totalDepositos = financeiro?.filter(m => m.tipo === "deposito").reduce((s, m) => s + m.valor, 0) ?? 0
  const totalSaques = financeiro?.filter(m => m.tipo === "saque").reduce((s, m) => s + m.valor, 0) ?? 0

  const stats = [
    { label: "Usuários", value: totalUsuarios ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Perfis", value: totalPerfis ?? 0, icon: UserCircle, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Casas de Apostas", value: totalCasas ?? 0, icon: Building2, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Apostas", value: totalApostas ?? 0, icon: ClipboardList, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Total Depositado", value: formatCurrency(totalDepositos), icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Total Sacado", value: formatCurrency(totalSaques), icon: TrendingUp, color: "text-red-400", bg: "bg-red-500/10" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral de toda a plataforma</p>
      </div>

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
    </div>
  )
}
