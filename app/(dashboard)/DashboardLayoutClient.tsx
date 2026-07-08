"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Home, Users, BookOpen, DollarSign,
  CreditCard, Settings, LogOut, Menu, X, HelpCircle, Plus, MessageCircle, UserCircle, Zap, Calculator, Lightbulb
} from "lucide-react"
import Logo from "@/components/Logo"
import GlobalFAB from "@/components/GlobalFAB"

const navItems = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/perfis", label: "Perfis", icon: Users },
  { href: "/surebet", label: "Surebets", icon: Zap },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/apostas", label: "Apostas", icon: BookOpen },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/dicas", label: "Dicas", icon: Lightbulb },
  { href: "/tutorial", label: "Tutorial", icon: HelpCircle },
  { href: "/suporte", label: "SureBet AI", icon: MessageCircle },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/surebet", label: "Surebets", icon: Zap },
  null, // FAB placeholder
  { href: "/apostas", label: "Apostas", icon: BookOpen },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
]

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
  }, [])

  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "?"

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  function openMobileFAB() {
    window.dispatchEvent(new Event("open-mobile-fab"))
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-[#FAFAF8] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[var(--bg-surface)] border-r border-[var(--border)] flex-shrink-0">
        <div className="flex items-center p-6 border-b border-[var(--border)]">
          <Logo size="md" />
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-[#1e3a8a]/10 text-[var(--accent-text)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--border)] space-y-1">
          <Link
            href="/configuracoes"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive("/configuracoes")
                ? "bg-[#1e3a8a]/10 text-[var(--accent-text)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            )}
          >
            <div className="w-5 h-5 rounded-full bg-[#1e3a8a] flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-white">{userInitials}</span>
            </div>
            Minha Conta
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[var(--bg-surface)] flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <Logo size="md" />
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-[var(--bg-elevated)]">
                <X className="h-5 w-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-[#1e3a8a]/10 text-[var(--accent-text)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-[var(--border)] space-y-1">
              <Link
                href="/configuracoes"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive("/configuracoes")
                    ? "bg-[#1e3a8a]/10 text-[var(--accent-text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                )}
              >
                <div className="w-5 h-5 rounded-full bg-[#1e3a8a] flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-white">{userInitials}</span>
                </div>
                Minha Conta
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] w-full"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--bg-surface)] border-b border-[var(--border)]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)]">
            <Menu className="h-5 w-5 text-[var(--text-secondary)]" />
          </button>
          <Logo size="sm" />
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden bg-[var(--bg-surface)] border-t border-[var(--border)] px-2 py-2 safe-area-bottom">
          <div className="flex items-center justify-around">
            {BOTTOM_NAV.map((item, i) =>
              item === null ? (
                <button
                  key="fab"
                  onClick={openMobileFAB}
                  className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-0"
                >
                  <div className="w-9 h-9 rounded-full bg-[#0f172a] flex items-center justify-center shadow-md -mt-5">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-0",
                    isActive(item.href) ? "text-[var(--accent-text)]" : "text-[var(--text-secondary)]"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-[10px] font-medium truncate">{item.label}</span>
                </Link>
              )
            )}
          </div>
        </nav>
      </div>

      {/* GlobalFAB fora dos wrappers overflow-hidden para position:fixed funcionar */}
      <GlobalFAB />
    </div>
  )
}
