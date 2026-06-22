"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Home, Users, Calculator, ClipboardList, Wallet, CreditCard,
  Settings, LogOut, TrendingUp, Bell, ChevronLeft, ChevronRight,
  Circle
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/perfis", icon: Users, label: "Perfis" },
  { href: "/calculadora", icon: Calculator, label: "Calculadora" },
  { href: "/apostas", icon: ClipboardList, label: "Apostas" },
  { href: "/financeiro", icon: Wallet, label: "Financeiro" },
  { href: "/assinatura", icon: CreditCard, label: "Assinatura" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      if (!pathname.startsWith("/onboarding")) {
        const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true })
        if (count === 0) { router.push("/onboarding/perfil"); return }
      }
      // Get user name from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, sobrenome")
        .limit(1)
        .single()
      if (profile) {
        const fullName = `${profile.nome} ${profile.sobrenome}`
        setUserName(fullName)
        setUserInitials(`${profile.nome.charAt(0)}${profile.sobrenome.charAt(0)}`.toUpperCase())
      } else {
        const email = user.email ?? ""
        setUserName(email)
        setUserInitials(email.charAt(0).toUpperCase())
      }
      setReady(true)
    })
  }, [router, pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
          <p className="text-[#8b949e] text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  const sidebarW = collapsed ? "w-16" : "w-60"

  return (
    <div className="flex min-h-screen bg-[#0d1117]">
      {/* Sidebar desktop */}
      <aside className={cn("hidden md:flex flex-col bg-[#161b22] border-r border-[#30363d] fixed top-0 left-0 h-full z-20 transition-all duration-200", sidebarW)}>
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-[#30363d]", collapsed && "justify-center px-0")}>
          <div className="w-8 h-8 bg-[#16A34A] rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-white text-sm">SureBetFlow</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest px-3 pb-2">Menu Principal</p>
          )}
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-[#16A34A]/15 text-[#16A34A] border border-[#16A34A]/20"
                    : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-[#30363d] p-2 space-y-2">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-widest px-3 pb-1">Sessão Segura</p>
          )}
          <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg bg-[#21262d]", collapsed && "justify-center px-0")}>
            <div className="w-7 h-7 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userInitials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#e6edf3] truncate">{userName}</p>
                <p className="text-[10px] text-[#16A34A] font-semibold">APOSTADOR</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={collapsed ? "Sair" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && "Sair"}
          </button>
          <button
            onClick={() => setCollapsed(v => !v)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Recolher menu</span></>}
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className={cn("flex-1 flex flex-col transition-all duration-200", collapsed ? "md:ml-16" : "md:ml-60")}>
        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 bg-[#161b22] border-b border-[#30363d] sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-[#8b949e]">
            <Circle className="w-2 h-2 fill-[#16A34A] text-[#16A34A]" />
            <span>Sessão ativa</span>
            <span className="text-[#30363d]">•</span>
            <span className="text-[#e6edf3] font-medium">{userName}</span>
            <span className="text-[#30363d]">•</span>
            <span>Modo:</span>
            <span className="text-xs font-semibold bg-[#16A34A]/20 text-[#16A34A] px-2 py-0.5 rounded border border-[#16A34A]/30">APOSTADOR</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[#16A34A] font-medium">
              <Circle className="w-2 h-2 fill-[#16A34A] text-[#16A34A]" />
              CONECTADO AO SUPABASE
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-[#30363d] z-20 flex">
        {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center py-2 text-xs gap-1",
                active ? "text-[#16A34A]" : "text-[#8b949e]"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
