"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { LayoutDashboard, Users, Building2, ClipboardList, LogOut, MessageCircle, Settings, CreditCard, Camera, Bot } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/casas", label: "Casas de Apostas", icon: Building2 },
  { href: "/admin/apostas", label: "Apostas", icon: ClipboardList },
  { href: "/admin/suporte", label: "Suporte", icon: MessageCircle },
  { href: "/admin/prints", label: "Prints Mobile", icon: Camera },
  { href: "/admin/agente", label: "Agente IA", icon: Bot },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      const { count } = await supabase
        .from("ticket_mensagens")
        .select("id", { count: "exact", head: true })
        .eq("is_admin", false)
        .eq("lida", false)
      setUnread(count ?? 0)
    }
    fetchUnread()

    const channel = supabase
      .channel("admin-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_mensagens" }, fetchUnread)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-gray-800">
          <span className="font-bold text-lg text-white">⚙️ Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
            const isSuporteLink = href === "/admin/suporte"
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#1e3a8a] text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isSuporteLink && unread > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>

      {/* Logout confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full mx-auto mb-4">
              <LogOut className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white text-center mb-1">Sair da conta?</h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Você será desconectado do painel administrativo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
