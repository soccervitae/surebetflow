"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/components/ThemeProvider"
import {
  Home, Users, Wallet, CreditCard, Calculator, BookOpen,
  Settings, LogOut, TrendingUp, Bell, ChevronLeft, ChevronRight,
  Circle, Sun, Moon, MessageCircle, HelpCircle, Menu, X, MoreHorizontal
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard",     icon: Home,          label: "Dashboard" },
  { href: "/perfis",        icon: Users,         label: "Perfis" },
  { href: "/calculadora",   icon: Calculator,    label: "Calculadora" },
  { href: "/apostas",       icon: BookOpen,      label: "Apostas" },
  { href: "/financeiro",    icon: Wallet,        label: "Financeiro" },
  { href: "/assinatura",    icon: CreditCard,    label: "Assinatura" },
  { href: "/tutorial",      icon: HelpCircle,    label: "Tutorial" },
  { href: "/suporte",       icon: MessageCircle, label: "Suporte" },
  { href: "/configuracoes", icon: Settings,      label: "Configurações" },
]

// First 4 in bottom bar, rest in drawer
const bottomItems = navItems.slice(0, 4)
const drawerItems = navItems.slice(4)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [ready, setReady] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("")
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, sobrenome")
        .limit(1)
        .single()
      if (profile) {
        setUserName(`${profile.nome} ${profile.sobrenome}`)
        setUserInitials(`${profile.nome.charAt(0)}${profile.sobrenome.charAt(0)}`.toUpperCase())
      } else {
        const email = user.email ?? ""
        setUserName(email)
        setUserInitials(email.charAt(0).toUpperCase())
      }
      setReady(true)
    })
  }, [router, pathname])

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#1e3a8a] rounded-full animate-pulse" />
          <p className="text-[var(--text-secondary)] text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  const isDark = theme === "dark"
  const sidebarW = collapsed ? "w-16" : "w-60"

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={cn(
        "hidden md:flex flex-col fixed top-0 left-0 h-full z-20 transition-all duration-200",
        "bg-[var(--bg-surface)] border-r border-[var(--border)]",
        sidebarW
      )}>
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]",
          collapsed && "justify-center px-0"
        )}>
          <div className="w-8 h-8 bg-[#1e3a8a] rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-[var(--text-primary)] text-sm">SureBetFlow</span>}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 pb-2">
              Menu Principal
            </p>
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
                    ? "bg-[#1e3a8a]/15 text-[#1e3a8a] border border-[#1e3a8a]/20"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-2 space-y-1">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-3 pb-1">
              Sessão Segura
            </p>
          )}
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-elevated)]",
            collapsed && "justify-center px-0"
          )}>
            <div className="w-7 h-7 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userInitials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{userName}</p>
                <p className="text-[10px] text-[#1e3a8a] font-semibold">APOSTADOR</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            title={collapsed ? "Sair" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && "Sair"}
          </button>
          <button
            onClick={() => setCollapsed(v => !v)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <><ChevronLeft className="w-4 h-4" /><span>Recolher menu</span></>
            }
          </button>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-200",
        collapsed ? "md:ml-16" : "md:ml-60"
      )}>

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Circle className="w-2 h-2 fill-[#1e3a8a] text-[#1e3a8a]" />
            <span>Sessão ativa</span>
            <span className="opacity-30">•</span>
            <span className="text-[var(--text-primary)] font-medium">{userName}</span>
            <span className="opacity-30">•</span>
            <span className="text-xs font-semibold bg-[#1e3a8a]/20 text-[#1e3a8a] px-2 py-0.5 rounded border border-[#1e3a8a]/30">
              APOSTADOR
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} title={isDark ? "Modo claro" : "Modo escuro"}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#1e3a8a] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[var(--text-primary)] text-sm">SureBetFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="w-8 h-8 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[var(--bg-surface)] border-t border-[var(--border)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center">
          {bottomItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors relative",
                  active ? "text-[#1e3a8a]" : "text-[var(--text-muted)]"
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#1e3a8a] rounded-full" />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors",
              drawerOpen ? "text-[#1e3a8a]" : "text-[var(--text-muted)]"
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] rounded-t-3xl border-t border-[var(--border)] shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {userInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[180px]">{userName}</p>
                  <p className="text-[11px] text-[#1e3a8a] font-semibold">APOSTADOR</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav items */}
            <div className="px-4 py-3 grid grid-cols-3 gap-2">
              {drawerItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href))
                return (
                  <Link key={href} href={href}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 rounded-2xl text-center transition-colors",
                      active
                        ? "bg-[#1e3a8a]/15 text-[#1e3a8a] border border-[#1e3a8a]/25"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] font-medium">{label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Logout */}
            <div className="px-4 pb-4">
              <button
                onClick={() => { setDrawerOpen(false); setConfirmLogout(true) }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium transition-colors hover:bg-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── LOGOUT DIALOG ── */}
      {confirmLogout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full mx-auto mb-4">
              <LogOut className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] text-center mb-1">Sair da conta?</h2>
            <p className="text-[var(--text-secondary)] text-sm text-center mb-6">
              Você será desconectado e precisará fazer login novamente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogout(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
