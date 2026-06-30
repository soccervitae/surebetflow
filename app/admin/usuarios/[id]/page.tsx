import { createAdminClient } from "@/lib/supabase/admin"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import CourtesyButton from "./CourtesyButton"

export default async function AdminUsuarioDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: { user }, error } = await supabase.auth.admin.getUserById(params.id)
  if (error || !user) notFound()

  const [{ data: profiles }, { data: apostas }, { data: movimentacoes }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("id, nome, sobrenome, apelido, email, ativo, created_at").eq("user_id", params.id),
    supabase.from("apostas").select("profile_id, investimento_total, resultado_real, lucro_garantido, status"),
    supabase.from("movimentacoes_financeiras").select("profile_id, tipo, valor"),
    supabase.from("subscriptions").select("status, plan, current_period_end").eq("user_id", params.id).maybeSingle(),
  ])

  const hasCourtesy = subscription?.status === "courtesy"
  const expiresAt = subscription?.current_period_end ?? null

  const profileIds = (profiles ?? []).map(p => p.id)

  // Aggregate per profile
  type ProfileStats = { lucroRealizado: number; lucroPendente: number; totalInvestido: number; depositos: number; saques: number; apostas: number }
  const statsMap: Record<string, ProfileStats> = {}
  for (const pid of profileIds) {
    statsMap[pid] = { lucroRealizado: 0, lucroPendente: 0, totalInvestido: 0, depositos: 0, saques: 0, apostas: 0 }
  }
  for (const a of apostas ?? []) {
    const s = statsMap[a.profile_id]
    if (!s) continue
    s.apostas++
    if (a.status === "finalizada") { s.lucroRealizado += Number(a.resultado_real ?? 0); s.totalInvestido += Number(a.investimento_total) }
    if (a.status === "pendente") { s.lucroPendente += Number(a.lucro_garantido ?? 0); s.totalInvestido += Number(a.investimento_total) }
  }
  for (const m of movimentacoes ?? []) {
    const s = statsMap[m.profile_id]
    if (!s) continue
    if (m.tipo === "deposito") s.depositos += Number(m.valor)
    else if (m.tipo === "saque") s.saques += Number(m.valor)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/admin/usuarios" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.user_metadata?.full_name ?? user.email}</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {user.email} · Cadastrado em {new Date(user.created_at).toLocaleDateString("pt-BR")}
              {subscription && (
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  subscription.status === "active" || subscription.status === "trialing"
                    ? "bg-green-500/10 text-green-400"
                    : subscription.status === "courtesy"
                      ? "bg-purple-500/10 text-purple-400"
                      : "bg-gray-700 text-gray-400"
                }`}>
                  {subscription.status === "courtesy" ? "Cortesia" : subscription.status === "active" ? "Ativo" : subscription.status}
                </span>
              )}
            </p>
          </div>
        </div>
        <CourtesyButton userId={params.id} hasCourtesy={hasCourtesy} expiresAt={expiresAt} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Perfis <span className="text-gray-500 font-normal text-sm">({profiles?.length ?? 0})</span>
        </h2>

        {!profiles?.length ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500">
            Nenhum perfil cadastrado para este usuário
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Perfil</th>
                    <th className="text-center px-3 py-3">Status</th>
                    <th className="text-right px-3 py-3">Apostas</th>
                    <th className="text-right px-3 py-3">Lucro Real.</th>
                    <th className="text-right px-3 py-3">Lucro Pend.</th>
                    <th className="text-right px-3 py-3">Investido</th>
                    <th className="text-right px-3 py-3">Depósitos</th>
                    <th className="text-right px-4 py-3">Saques</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p, i) => {
                    const s = statsMap[p.id] ?? { lucroRealizado: 0, lucroPendente: 0, totalInvestido: 0, depositos: 0, saques: 0, apostas: 0 }
                    return (
                      <tr key={p.id} className={`border-b border-gray-800/50 ${i % 2 === 0 ? "" : "bg-gray-800/20"}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{p.apelido || `${p.nome} ${p.sobrenome}`}</p>
                          {p.email && <p className="text-xs text-gray-500">{p.email}</p>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.ativo ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.ativo ? "bg-green-500" : "bg-red-500"}`} />
                            {p.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-gray-300">{s.apostas}</td>
                        <td className={`px-3 py-3 text-right font-medium ${s.lucroRealizado >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {formatCurrency(s.lucroRealizado)}
                        </td>
                        <td className="px-3 py-3 text-right text-yellow-400">{formatCurrency(s.lucroPendente)}</td>
                        <td className="px-3 py-3 text-right text-gray-300">{formatCurrency(s.totalInvestido)}</td>
                        <td className="px-3 py-3 text-right text-green-400">{formatCurrency(s.depositos)}</td>
                        <td className="px-4 py-3 text-right text-red-400">{formatCurrency(s.saques)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
