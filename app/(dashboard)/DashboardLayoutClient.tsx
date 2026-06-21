"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Home, Users, Calculator, BookOpen, DollarSign,
  CreditCard, Settings, LogOut, Menu, X, TrendingUp
} from "lucide-react"
const navItems = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/perfis", label: "Perfis", icon: Users },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/apostas", label: "Apostas", icon: BookOpen },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-[#FAFAF8] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-[#E5E1D8] flex-shrink-0">
        <div className="flex items-center gap-3 p-6 border-b border-[#E5E1D8]">
          <div className="flex items-center justify-center w-9 h-9 bg-[#16A34A] rounded-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">SureBetFlow</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-[#16A34A]/10 text-[#16A34A]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#E5E1D8]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full"
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
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 bg-[#16A34A] rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">SureBetFlow</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
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
                      ? "bg-[#16A34A]/10 text-[#16A34A]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-[#E5E1D8]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full"
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
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-[#E5E1D8]">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 bg-[#16A34A] rounded-lg">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">SureBetFlow</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden bg-white border-t border-[#E5E1D8] px-2 py-2 safe-area-bottom">
          <div className="flex items-center justify-around">
            {navItems.slice(0, 5).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-0",
                  isActive(item.href) ? "text-[#16A34A]" : "text-gray-500"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
