import { createClient } from "@/lib/supabase/server"

export default async function AdminPerfisPage() {
  const supabase = await createClient()
  const { data: perfis } = await supabase
    .from("profiles")
    .select("id, nome, sobrenome, apelido, email, ativo, created_at, apostas:apostas(count), profile_bets:profile_bets(count)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfis</h1>
        <p className="text-gray-400 text-sm mt-1">{perfis?.length ?? 0} perfis cadastrados</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Perfil</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">E-mail</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Apostas</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Casas</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {perfis?.map((p) => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{p.apelido ?? `${p.nome} ${p.sobrenome}`}</p>
                  {p.apelido && <p className="text-xs text-gray-400">{p.nome} {p.sobrenome}</p>}
                </td>
                <td className="px-4 py-3 text-gray-300">{p.email ?? "—"}</td>
                <td className="px-4 py-3 text-center text-gray-300">{p.apostas?.[0]?.count ?? 0}</td>
                <td className="px-4 py-3 text-center text-gray-300">{p.profile_bets?.[0]?.count ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.ativo ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.ativo ? "bg-green-400" : "bg-red-400"}`} />
                    {p.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!perfis?.length && <p className="text-center text-gray-500 py-10">Nenhum perfil cadastrado</p>}
      </div>
    </div>
  )
}
