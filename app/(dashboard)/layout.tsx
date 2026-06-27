"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/components/ThemeProvider"
import {
  Home, Users, Wallet, CreditCard, Settings,
  LogOut, Bell, ChevronLeft, ChevronRight,
  Circle, Sun, Moon, MessageCircle, BookOpen, ClipboardList
} from "lucide-react"
import Logo, { LogoIcon } from "@/components/Logo"
import Image from "next/image"
import { cn } from "@/lib/utils"
import RealtimeProvider from "@/components/RealtimeProvider"

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/perfis", icon: Users, label: "Perfis" },
  { href: "/apostas", icon: ClipboardList, label: "Apostas" },
  { href: "/financeiro", icon: Wallet, label: "Financeiro" },
  { href: "/tutorial", icon: BookOpen, label: "Tutorial" },
  { href: "/suporte", icon: MessageCircle, label: "Suporte" },
  { href: "/configuracoes", icon: Settings, label: "Minha Conta" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [ready, setReady] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("")
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [unread, setUnread] = useState(0)
  const [userId, setUserId] = useState("")
  const [planName, setPlanName] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      setUserId(user.id)
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("nome, sobrenome")
        .eq("id", user.id)
        .single()
      const email = user.email ?? ""
      if (usuario?.nome) {
        const fullName = `${usuario.nome} ${usuario.sobrenome ?? ""}`.trim()
        setUserName(fullName)
        const initials = `${usuario.nome.charAt(0)}${usuario.sobrenome?.charAt(0) ?? ""}`.toUpperCase()
        setUserInitials(initials)
      } else {
        setUserName(email)
        setUserInitials(email.charAt(0).toUpperCase())
      }

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .single()
      if (subData?.status === "active" || subData?.status === "trialing") {
        const names: Record<string, string> = { trader: "Trader", trader_pro: "Trader Pro", pro: "Pro" }
        setPlanName(names[subData.plan ?? ""] ?? subData.plan)
      }

      async function fetchUnread() {
        const { count } = await supabase
          .from("ticket_mensagens")
          .select("id", { count: "exact", head: true })
          .eq("is_admin", true)
          .eq("lida", false)
        setUnread(count ?? 0)
      }
      fetchUnread()

      const channel = supabase
        .channel("user-unread")
        .on("postgres_changes", { event: "*", schema: "public", table: "ticket_mensagens" }, fetchUnread)
        .subscribe()

      // Redirect to onboarding if subscribed but no profiles yet
      const isActive = subData?.status === "active" || subData?.status === "trialing"
      const isOnboardingExcluded = pathname.startsWith("/onboarding") || pathname.startsWith("/assinatura")
      if (isActive && !isOnboardingExcluded) {
        const alreadyOnboarded = typeof window !== "undefined" && localStorage.getItem("onboarding_done") === "1"
        if (!alreadyOnboarded) {
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
          if ((count ?? 0) === 0) {
            router.push("/onboarding")
            return
          } else {
            localStorage.setItem("onboarding_done", "1")
          }
        }
      }

      // Redirect brand new users (no subscription record) to /assinatura
      const noSubscription = !subData
      const allowedWithoutSub = pathname.startsWith("/assinatura") || pathname.startsWith("/configuracoes") || pathname.startsWith("/suporte")
      if (noSubscription && !allowedWithoutSub) {
        router.push("/assinatura")
        return
      }

      setReady(true)
      return () => { supabase.removeChannel(channel) }
    })
  }, [router, pathname])

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
      {/* Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col fixed top-0 left-0 h-full z-20 transition-all duration-200",
        "bg-[#0b1631] border-r border-white/5",
        sidebarW
      )}>
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-white/5",
          collapsed && "justify-center px-0"
        )}>
          {collapsed
            ? <LogoIcon size="sm" />
            : <Image src="https://gkkuttabavwxjuibmrnr.supabase.co/storage/v1/object/public/logos/surebetflow-horizontal-vazada-branca%20(1).png" alt="SurebetFlow" width={140} height={36} priority />
          }
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pb-2">
              Menu Principal
            </p>
          )}
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href))
            const isSuporteLink = href === "/suporte"
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/50 hover:bg-white/5 hover:text-white/90"
                )}
              >
                <span className="relative flex-shrink-0">
                  <Icon className="w-4 h-4" />
                  {isSuporteLink && unread > 0 && collapsed && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{label}</span>
                    {isSuporteLink && unread > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/5 p-2 space-y-1">
          {!collapsed && (
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pb-1">
              Sessão Segura
            </p>
          )}
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5",
            collapsed && "justify-center px-0"
          )}>
            <div className="w-7 h-7 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userInitials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{userName}</p>
                {planName
                  ? <p className="text-[10px] text-[#5b7ec9] font-semibold uppercase">{planName}</p>
                  : <p className="text-[10px] text-white/30 font-semibold">SEM PLANO</p>
                }
              </div>
            )}
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            title={collapsed ? "Sair" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/90 transition-colors",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && "Sair"}
          </button>
          <button
            onClick={() => setCollapsed(v => !v)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-white/50 hover:bg-white/5 hover:text-white/90 transition-colors",
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

      {/* Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-200",
        collapsed ? "md:ml-16" : "md:ml-60"
      )}>
        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Circle className="w-2 h-2 fill-[#1e3a8a] text-[#1e3a8a]" />
            <span>Sessão ativa</span>
            <span className="opacity-30">•</span>
            <span className="text-[var(--text-primary)] font-medium">{userName}</span>
            <span className="opacity-30">•</span>
            <span className="text-xs text-[var(--text-secondary)]">
              {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
            </span>
            {planName && (
              <>
                <span className="opacity-30">•</span>
                <Link href="/assinatura" className="text-xs font-semibold text-[#5b7ec9] hover:text-[#93c5fd] transition-colors">
                  {planName}
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={isDark ? "Modo claro" : "Modo escuro"}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            >
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

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 pt-[72px] md:pt-4 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Top header mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-[var(--bg-surface)] border-b border-[var(--border)] z-20 flex items-center justify-between px-4 h-14">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            title={isDark ? "Modo claro" : "Modo escuro"}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)]"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/suporte"
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)]"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
          <Link href="/configuracoes" className="w-7 h-7 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-xs font-bold">
            {userInitials}
          </Link>
        </div>
      </header>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] z-20 flex">
        {([
          { href: "/dashboard",  icon: Home,          label: "Dashboard" },
          { href: "/perfis",     icon: Users,         label: "Perfis" },
          { href: "/apostas",    icon: ClipboardList, label: "Apostas" },
          { href: "/financeiro", icon: Wallet,        label: "Financeiro" },
          { href: "/tutorial",   icon: BookOpen,      label: "Tutorial" },
        ] as { href: string; icon: React.ElementType; label: string }[]).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center py-2 text-xs gap-1",
                active ? "text-[#4d82d6]" : "text-[var(--text-secondary)]"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Global realtime sync across devices */}
      {userId && <RealtimeProvider userId={userId} />}

      {/* Logout confirmation dialog */}
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
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] text-sm font-medium transition-colors"
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
