import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim()).filter(Boolean)

export default async function AdminUsuariosPage() {
  const supabase = createAdminClient()

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })

  if (error) {
    return <p className="text-red-400">Erro ao carregar usuários: {error.message}</p>
  }

  // Exclude admin accounts
  const filtered = users.filter(u => !ADMIN_EMAILS.includes(u.email ?? ""))

  // Get profile counts per user
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, user_id")

  const profileCountMap: Record<string, number> = {}
  for (const p of profiles ?? []) {
    profileCountMap[p.user_id] = (profileCountMap[p.user_id] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <p className="text-gray-400 text-sm mt-1">{filtered.length} usuário(s) cadastrado(s)</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">E-mail</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome</th>
              <th className="text-center px-4 py-3 text-gray-400 font-medium">Perfis</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Cadastro</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Último acesso</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-10">Nenhum usuário cadastrado</td>
              </tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 text-gray-200">{u.email ?? "—"}</td>
                <td className="px-4 py-3 text-gray-300">{u.user_metadata?.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-center">
                  <span className="bg-[#1e3a8a]/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {profileCountMap[u.id] ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "Nunca"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Ver perfis →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
