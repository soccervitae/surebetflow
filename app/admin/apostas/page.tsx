import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils"

const statusColor: Record<string, string> = {
  pendente: "bg-yellow-500/10 text-yellow-400",
  finalizada: "bg-green-500/10 text-green-400",
  cancelada: "bg-red-500/10 text-red-400",
}

export default async function AdminApostasPage() {
  const supabase = await createClient()
  const { data: apostas } = await supabase
    .from("apostas")
    .select("id, evento, esporte, tipo, investimento_total, lucro_garantido, roi_percentual, status, created_at, profile:profiles(nome, sobrenome, apelido)")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Apostas</h1>
        <p className="text-gray-400 text-sm mt-1">{apostas?.length ?? 0} apostas (últimas 200)</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Evento</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Perfil</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Tipo</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">Investido</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">Lucro</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">ROI</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {apostas?.map((a) => (
              <tr key={a.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-white truncate max-w-[200px]">{a.evento}</p>
                  {a.esporte && <p className="text-xs text-gray-400">{a.esporte}</p>}
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs">
                  {(() => { const pf = Array.isArray(a.profile) ? a.profile[0] : a.profile; return pf?.apelido ?? `${pf?.nome} ${pf?.sobrenome}` })()}
                </td>
                <td className="px-4 py-3 text-gray-400">{a.tipo}</td>
                <td className="px-4 py-3 text-right text-gray-300">{formatCurrency(a.investimento_total)}</td>
                <td className="px-4 py-3 text-right text-green-400 font-medium">{formatCurrency(a.lucro_garantido)}</td>
                <td className="px-4 py-3 text-right text-purple-400">{a.roi_percentual.toFixed(2)}%</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[a.status] ?? ""}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!apostas?.length && <p className="text-center text-gray-500 py-10">Nenhuma aposta registrada</p>}
      </div>
    </div>
  )
}
