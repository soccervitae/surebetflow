import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import { MessageCircle, Clock, CheckCircle } from "lucide-react"

const STATUS_CONFIG = {
  aberto:     { label: "Aberto",     color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Clock },
  respondido: { label: "Respondido", color: "text-blue-400",   bg: "bg-blue-500/10",   icon: MessageCircle },
  fechado:    { label: "Fechado",    color: "text-gray-400",   bg: "bg-gray-500/10",   icon: CheckCircle },
}

const PRIORIDADE_CONFIG = {
  baixa:  { label: "Baixa",  color: "text-gray-400",  bg: "bg-gray-500/10" },
  normal: { label: "Normal", color: "text-blue-400",  bg: "bg-blue-500/10" },
  alta:   { label: "Alta",   color: "text-red-400",   bg: "bg-red-500/10" },
}

export default async function AdminSuportePage() {
  const supabase = createAdminClient()

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, ticket_mensagens(id, is_admin, lida)")
    .order("updated_at", { ascending: false })

  // Get user emails
  const userIds = Array.from(new Set((tickets ?? []).map(t => t.user_id)))
  const userMap: Record<string, string> = {}
  for (const uid of userIds) {
    const { data: { user } } = await supabase.auth.admin.getUserById(uid)
    if (user) userMap[uid] = user.email ?? uid
  }

  const stats = {
    total: tickets?.length ?? 0,
    abertos: tickets?.filter(t => t.status === "aberto").length ?? 0,
    respondidos: tickets?.filter(t => t.status === "respondido").length ?? 0,
    fechados: tickets?.filter(t => t.status === "fechado").length ?? 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Suporte</h1>
        <p className="text-gray-400 text-sm mt-1">Gerenciar tickets dos usuários</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Abertos", value: stats.abertos, color: "text-yellow-400" },
          { label: "Respondidos", value: stats.respondidos, color: "text-blue-400" },
          { label: "Fechados", value: stats.fechados, color: "text-gray-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tickets */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {!tickets?.length ? (
          <div className="text-center py-16 text-gray-500">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Nenhum ticket ainda
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {tickets.map(t => {
              const st = STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.aberto
              const pr = PRIORIDADE_CONFIG[t.prioridade as keyof typeof PRIORIDADE_CONFIG] ?? PRIORIDADE_CONFIG.normal
              const StIcon = st.icon
              const unread = t.ticket_mensagens.filter((m: { is_admin: boolean; lida: boolean }) => !m.is_admin && !m.lida).length
              return (
                <Link key={t.id} href={`/admin/suporte/${t.id}`}>
                  <div className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-medium text-white truncate">{t.assunto}</span>
                          {unread > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              {unread} nova{unread > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{userMap[t.user_id] ?? t.user_id}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                            <StIcon className="w-3 h-3" />
                            {st.label}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pr.bg} ${pr.color}`}>
                            {pr.label}
                          </span>
                          <span className="text-xs text-gray-500">{t.ticket_mensagens.length} msg</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">{new Date(t.updated_at).toLocaleDateString("pt-BR")}</p>
                        <p className="text-xs text-gray-600">{new Date(t.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
