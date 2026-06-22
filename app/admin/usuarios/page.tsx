import { createClient } from "@/lib/supabase/server"

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nome, sobrenome, apelido, email, cpf, ativo, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Usuários / Perfis</h1>
        <p className="text-gray-400 text-sm mt-1">{profiles?.length ?? 0} perfis cadastrados</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">E-mail</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">CPF</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{p.apelido ?? `${p.nome} ${p.sobrenome}`}</p>
                  {p.apelido && <p className="text-xs text-gray-400">{p.nome} {p.sobrenome}</p>}
                </td>
                <td className="px-4 py-3 text-gray-300">{p.email ?? "—"}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                  {p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.ativo ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.ativo ? "bg-green-400" : "bg-red-400"}`} />
                    {p.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!profiles?.length && (
          <p className="text-center text-gray-500 py-10">Nenhum usuário cadastrado</p>
        )}
      </div>
    </div>
  )
}
