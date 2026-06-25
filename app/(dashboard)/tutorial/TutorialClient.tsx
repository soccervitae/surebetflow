"use client"

import { useState, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import {
  BookOpen, Home, Users, Calculator, DollarSign,
  Settings, HelpCircle, ChevronRight, CheckCircle,
  TrendingUp, Clock, ArrowUpRight, Wallet, Plus,
  Search, CreditCard, MessageSquare, Star, Zap,
  BarChart2, ChevronLeft, Circle, Bell, Sun,
  Filter, ArrowRight, QrCode, Activity, Hash,
  Calendar, RefreshCw, Lock, MoreHorizontal, X,
} from "lucide-react"

const SECTIONS = [
  { id: "inicio",        label: "Dashboard",      icon: Home },
  { id: "perfis",        label: "Perfis",          icon: Users },
  { id: "calculadora",   label: "Calculadora",     icon: Calculator },
  { id: "apostas",       label: "Apostas",         icon: BookOpen },
  { id: "financeiro",    label: "Financeiro",      icon: DollarSign },
  { id: "assinatura",    label: "Assinatura",      icon: CreditCard },
  { id: "configuracoes", label: "Configurações",   icon: Settings },
  { id: "suporte",       label: "Suporte",         icon: HelpCircle },
]

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-[#1e3a8a]/10 border border-[#1e3a8a]/20 rounded-xl px-4 py-3">
      <Zap className="w-4 h-4 text-[var(--accent-text)] shrink-0 mt-0.5" />
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
    </div>
  )
}

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[#1e3a8a]/20 border border-[#1e3a8a]/40 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[var(--accent-text)] text-xs font-bold">{num}</span>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{text}</p>
    </div>
  )
}

/* ── MOCKUP SHELL MOBILE ── */
function MockShellMobile({ activeNav, children }: { activeNav: string; children: React.ReactNode }) {
  const nav = [
    { href: "/dashboard", icon: Home,     label: "Dashboard" },
    { href: "/perfis",    icon: Users,    label: "Perfis" },
    { href: "/apostas",   icon: BookOpen, label: "Apostas" },
    { href: "/financeiro",icon: Wallet,   label: "Financeiro" },
  ]
  return (
    <div className="rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden mx-auto" style={{ maxWidth: 320 }}>
      <div className="bg-[#1a1a1a] px-4 py-1.5 flex items-center justify-between border-b border-white/5">
        <span className="text-[9px] text-gray-500 font-mono">9:41</span>
        <div className="w-14 h-3 bg-black/60 rounded-full" />
        <div className="flex items-center gap-1">
          <div className="w-3 h-1.5 bg-gray-500 rounded-sm" />
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
        </div>
      </div>
      <div className="bg-[#0d0d0d] flex flex-col" style={{ minHeight: 400 }}>
        <div className="flex items-center justify-between px-3 py-2 bg-[#111] border-b border-white/5">
          <div className="w-6 h-6 bg-[#1e3a8a] rounded-lg flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white">SureBetFlow</span>
          <div className="w-6 h-6 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-[7px] font-bold">JS</div>
        </div>
        <div className="flex-1 p-3 overflow-hidden">
          {children}
        </div>
        <div className="bg-[#111] border-t border-white/5 flex items-center justify-around px-2 py-1.5">
          {nav.map(({ href, icon: Icon, label }) => {
            const isActive = activeNav === href
            return (
              <div key={href} className="flex flex-col items-center gap-0.5">
                {isActive && <div className="w-4 h-0.5 bg-[#60a5fa] rounded-full -mt-1.5 mb-0.5" />}
                <Icon className={`w-4 h-4 ${isActive ? "text-[#60a5fa]" : "text-gray-500"}`} />
                <span className={`text-[7px] font-medium ${isActive ? "text-[#60a5fa]" : "text-gray-500"}`}>{label}</span>
              </div>
            )
          })}
          <div className="flex flex-col items-center gap-0.5">
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
            <span className="text-[7px] font-medium text-gray-500">Mais</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockBoth({ url, activeNav, mobileContent, children }: {
  url: string; activeNav: string;
  mobileContent: React.ReactNode;
  children: React.ReactNode
}) {
  return (
    <>
      <div className="md:hidden"><MockShellMobile activeNav={activeNav}>{mobileContent}</MockShellMobile></div>
      <div className="hidden md:block"><MockShell url={url}>{children}</MockShell></div>
    </>
  )
}

/* ── MOCKUP SHELL DESKTOP ── */
function MockShell({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] shadow-xl overflow-x-auto">
      <div style={{ minWidth: 480 }}>
      <div className="bg-[#1a1a1a] px-4 py-2 flex items-center gap-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 bg-black/40 rounded-md px-3 py-0.5 text-[10px] text-gray-500 font-mono">
          surebetflow.bet{url}
        </div>
      </div>
      <div className="bg-[#0d0d0d] flex" style={{ minHeight: 300 }}>
        <div className="w-44 bg-[#111] border-r border-white/5 flex flex-col shrink-0">
          <div className="flex items-center gap-2 px-3 py-3 border-b border-white/5">
            <div className="w-6 h-6 bg-[#1e3a8a] rounded-md flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="text-white text-[10px] font-bold">SureBetFlow</span>
          </div>
          <nav className="flex-1 px-2 py-2 space-y-0.5">
            <p className="text-[8px] text-gray-600 uppercase tracking-widest px-2 pb-1">Menu Principal</p>
            {[
              { href: "/dashboard",    icon: Home,        label: "Dashboard" },
              { href: "/perfis",       icon: Users,       label: "Perfis" },
              { href: "/calculadora",  icon: Calculator,  label: "Calculadora" },
              { href: "/apostas",      icon: BookOpen,    label: "Apostas" },
              { href: "/financeiro",   icon: Wallet,      label: "Financeiro" },
              { href: "/assinatura",   icon: CreditCard,  label: "Assinatura" },
            ].map(({ href, icon: Icon, label }) => {
              const active = url === href || (url.startsWith(href) && href !== "/dashboard") || (url === href)
              return (
                <div key={href} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[9px] font-medium ${active ? "bg-[#1e3a8a]/20 text-[var(--accent-text)] border border-[#1e3a8a]/25" : "text-gray-500"}`}>
                  <Icon className="w-3 h-3 shrink-0" />
                  {label}
                </div>
              )
            })}
          </nav>
          <div className="border-t border-white/5 p-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/5">
              <div className="w-5 h-5 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-[7px] font-bold">JS</div>
              <div>
                <p className="text-[8px] text-white">João Silva</p>
                <p className="text-[7px] text-[var(--accent-text)] font-semibold">APOSTADOR</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-white/5">
            <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
              <Circle className="w-1.5 h-1.5 fill-[var(--accent-text)] text-[var(--accent-text)]" />
              Sessão ativa · <span className="text-white">João Silva</span>
              <span className="text-[8px] bg-[#1e3a8a]/20 text-[var(--accent-text)] px-1.5 py-0.5 rounded border border-[#1e3a8a]/30 ml-1">APOSTADOR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sun className="w-3 h-3 text-gray-500" />
              <Bell className="w-3 h-3 text-gray-500" />
              <div className="w-5 h-5 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-[7px] font-bold">JS</div>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

/* ── SECTION CONTENT (shared between desktop and Sheet) ── */
function SectionContent({ id }: { id: string }) {
  return (
    <div className="space-y-8 overflow-hidden">

      {/* ── DASHBOARD ── */}
      {id === "inicio" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Dashboard — Painel Geral</h2>
            <p className="text-sm text-[var(--text-secondary)]">Visão consolidada de todos os seus perfis e apostas.</p>
          </div>

          <MockBoth url="/dashboard" activeNav="/dashboard" mobileContent={
            <>
              <p className="text-[10px] font-bold text-white mb-2">Dashboard</p>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {[
                  { l: "Saldo Total", v: "R$ 2.000,00", c: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                  { l: "Lucro Realizado", v: "R$ 120,00", c: "text-[#60a5fa]", bg: "bg-blue-500/10 border-blue-500/20" },
                  { l: "Lucro Pendente", v: "R$ 0,00", c: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
                  { l: "ROI", v: "5.00%", c: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
                ].map(({ l, v, c, bg }) => (
                  <div key={l} className={`rounded-xl border ${bg} p-2`}>
                    <p className="text-[7px] text-gray-400 mb-0.5">{l}</p>
                    <p className={`text-[9px] font-bold ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                <p className="text-[8px] font-semibold text-gray-300 mb-1.5">Lucro Acumulado</p>
                <div className="flex items-end gap-1 h-12 px-1">
                  {[2,5,3,8,6,9,7].map((h,i) => (
                    <div key={i} className="flex-1 bg-[#1e3a8a]/60 rounded-t" style={{ height:`${h*10}%` }} />
                  ))}
                </div>
              </div>
            </>
          }>
            <p className="text-[10px] font-bold text-white mb-3">Painel Geral 📊</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { l: "Saldo Total", v: "R$ 2.000,00", c: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                { l: "Lucro Realizado", v: "R$ 120,00", c: "text-[var(--accent-text)]", bg: "bg-[#1e3a8a]/10 border-[#1e3a8a]/20" },
                { l: "Lucro Pendente", v: "R$ 0,00", c: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" },
                { l: "ROI", v: "5.00%", c: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
              ].map(({ l, v, c, bg }) => (
                <div key={l} className={`rounded-xl border ${bg} p-2`}>
                  <p className="text-[7px] text-gray-400 mb-0.5">{l}</p>
                  <p className={`text-[9px] font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 rounded-xl border border-white/5 bg-white/5 p-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[8px] font-semibold text-gray-300 uppercase tracking-wide">Lucro Acumulado</p>
                  <p className="text-[7px] text-gray-500">Apostas finalizadas</p>
                </div>
                <div className="flex items-end gap-1 h-10 px-1">
                  {[2, 5, 3, 8, 6, 9, 7].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#1e3a8a]/50 rounded-t" style={{ height: `${h * 10}%` }} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-2">
                <p className="text-[8px] font-semibold text-gray-300 uppercase tracking-wide mb-2">Resumo Financeiro</p>
                {[
                  { l: "Total Investido", v: "R$ 2.400,00", c: "text-white" },
                  { l: "Lucro Realizado", v: "R$ 120,00", c: "text-[var(--accent-text)]" },
                  { l: "Lucro Pendente", v: "R$ 0,00", c: "text-yellow-500" },
                  { l: "Total Apostas", v: "1", c: "text-white" },
                ].map(({ l, v, c }) => (
                  <div key={l} className="flex justify-between py-0.5 border-b border-white/5 last:border-0">
                    <span className="text-[7px] text-gray-500">{l}</span>
                    <span className={`text-[7px] font-semibold ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </MockBoth>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que você encontra aqui</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: TrendingUp, label: "Lucro Realizado", desc: "Soma de todos os lucros confirmados" },
                { icon: Clock,      label: "Lucro Pendente",  desc: "Apostas ainda não finalizadas" },
                { icon: ArrowUpRight, label: "ROI",           desc: "Retorno sobre investimento total" },
                { icon: BarChart2,  label: "Gráfico",         desc: "Evolução do lucro acumulado ao longo do tempo" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4 text-[var(--accent-text)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <Tip text="Troque o filtro de período (Dia, Semana, Mês, Ano) no canto superior do gráfico para ver resultados em diferentes janelas de tempo." />
        </div>
      )}

      {/* ── PERFIS ── */}
      {id === "perfis" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Perfis de Apostador</h2>
            <p className="text-sm text-[var(--text-secondary)]">Organize suas apostas separando diferentes estratégias ou bancas.</p>
          </div>

          <MockBoth url="/perfis" activeNav="/perfis" mobileContent={
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-white">Perfis</p>
                <div className="flex items-center gap-1 bg-[#1e3a8a] px-2 py-1 rounded-lg">
                  <Plus className="w-2.5 h-2.5 text-white" /><span className="text-[7px] text-white">Novo</span>
                </div>
              </div>
              {["Perfil Principal", "Banca Conservadora"].map((name, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2.5 mb-1.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-[8px] font-bold shrink-0">{name[0]}S</div>
                    <div>
                      <p className="text-[9px] font-semibold text-white">{name}</p>
                      <span className="text-[7px] bg-green-500/10 text-green-400 px-1 rounded-full border border-green-500/20">Ativo</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    {["12 apostas","R$ 120","5% ROI"].map(v=>(
                      <div key={v} className="bg-black/30 rounded-lg p-1"><p className="text-[7px] font-bold text-white">{v}</p></div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          }>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold text-white">Perfis</p>
                <p className="text-[8px] text-gray-500">Gerencie seus perfis de apostador</p>
              </div>
              <div className="flex items-center gap-1 bg-[#1e3a8a] px-2 py-1 rounded-lg">
                <Plus className="w-2.5 h-2.5 text-white" />
                <span className="text-[8px] text-white font-medium">Novo perfil</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Perfil Principal", "Banca Conservadora"].map((name, i) => (
                <div key={i} className="bg-white/5 border border-white/10 hover:border-[#1e3a8a]/40 rounded-xl p-2.5 cursor-pointer">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                      {name[0]}S
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <p className="text-[9px] font-semibold text-white truncate">{name}</p>
                        <span className="text-[7px] bg-green-500/10 text-green-500 px-1 rounded-full border border-green-500/20 flex items-center gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-green-500" />Ativo
                        </span>
                      </div>
                      <p className="text-[7px] text-gray-500">perfil@email.com</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {["Apostas", "Lucro", "ROI"].map((lbl, j) => (
                      <div key={lbl} className="bg-black/30 rounded-lg p-1 text-center">
                        <p className="text-[6px] text-gray-500">{lbl}</p>
                        <p className="text-[8px] font-bold text-white">{["12", "R$120", "5%"][j]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </MockBoth>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como criar um perfil</h3>
            <div className="space-y-3">
              <Step num={1} text='Acesse "Perfis" no menu lateral.' />
              <Step num={2} text='Clique em "Novo perfil" no canto superior direito.' />
              <Step num={3} text="Preencha nome, sobrenome, apelido (opcional) e foto (opcional)." />
              <Step num={4} text='Clique em "Salvar" — o perfil aparece na grade imediatamente.' />
              <Step num={5} text="Clique no card do perfil para ver apostas, casas e estatísticas." />
            </div>
          </div>
          <Tip text="Crie perfis separados por estratégia: um para surebets, outro para value bets. Assim seus resultados ficam organizados e fáceis de comparar." />
        </div>
      )}

      {/* ── CALCULADORA ── */}
      {id === "calculadora" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Calculadora de Surebet</h2>
            <p className="text-sm text-[var(--text-secondary)]">Calcule apostas 2-way e 3-way para garantir lucro independente do resultado.</p>
          </div>

          <MockBoth url="/calculadora" activeNav="/dashboard" mobileContent={
            <>
              <p className="text-[10px] font-bold text-white mb-2">Calculadora de Surebet</p>
              <div className="space-y-1.5 mb-2">
                {["Resultado 1 — Casa A","Resultado 2 — Casa B"].map((label,i)=>(
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2">
                    <p className="text-[7px] text-gray-400 mb-1">{label}</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1">
                        <p className="text-[6px] text-gray-500">Odd</p>
                        <p className="text-[9px] text-white font-mono">{["2.10","2.20"][i]}</p>
                      </div>
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1">
                        <p className="text-[6px] text-gray-500">Stake</p>
                        <p className="text-[9px] text-[#60a5fa] font-mono font-bold">{["R$95,24","R$90,91"][i]}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2 flex items-center justify-between">
                <div><p className="text-[7px] text-gray-400">Lucro garantido</p><p className="text-[10px] font-bold text-green-400">R$ 9,83</p></div>
                <div className="text-right"><p className="text-[7px] text-gray-400">ROI</p><p className="text-[10px] font-bold text-green-400">5.2%</p></div>
              </div>
            </>
          }>
            <p className="text-[10px] font-bold text-white mb-1">Calculadora de Surebet</p>
            <p className="text-[8px] text-gray-500 mb-3">Calcule suas surebets 2-way e 3-way</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {["Resultado 1 — Casa A", "Resultado 2 — Casa B"].map((label, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2">
                  <p className="text-[7px] text-gray-400 mb-1.5">{label}</p>
                  <div className="space-y-1">
                    <div className="bg-black/40 border border-white/10 rounded-lg px-2 py-1">
                      <p className="text-[7px] text-gray-500">Odd</p>
                      <p className="text-[9px] text-white font-mono">{["2.10", "2.20"][i]}</p>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-lg px-2 py-1">
                      <p className="text-[7px] text-gray-500">Stake sugerida</p>
                      <p className="text-[9px] text-[var(--accent-text)] font-mono font-bold">{["R$ 95,24", "R$ 90,91"][i]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2 flex items-center justify-between">
              <div>
                <p className="text-[7px] text-gray-400">Lucro garantido</p>
                <p className="text-[10px] font-bold text-green-400">R$ 9,83</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] text-gray-400">ROI</p>
                <p className="text-[10px] font-bold text-green-400">5.2%</p>
              </div>
              <div className="bg-[#1e3a8a] px-2 py-1 rounded-lg">
                <p className="text-[7px] text-white font-medium">Registrar apostas</p>
              </div>
            </div>
          </MockBoth>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como usar a calculadora</h3>
            <div className="space-y-3">
              <Step num={1} text='Escolha "2-way" (dois resultados) ou "3-way" (futebol com empate).' />
              <Step num={2} text="Digite as odds de cada resultado encontradas em casas diferentes." />
              <Step num={3} text="Informe o valor total que deseja investir." />
              <Step num={4} text="A calculadora mostra quanto apostar em cada odd e o lucro garantido." />
              <Step num={5} text='"Registrar apostas" salva as entradas diretamente no perfil selecionado.' />
            </div>
          </div>
          <Tip text="Surebets acima de 3% de ROI têm odds que fecham rápido. Confirme os valores nas casas antes de apostar." />
        </div>
      )}

      {/* ── APOSTAS ── */}
      {id === "apostas" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Registro de Apostas</h2>
            <p className="text-sm text-[var(--text-secondary)]">Registre e acompanhe todas as suas apostas em um só lugar.</p>
          </div>

          <MockBoth url="/apostas" activeNav="/apostas" mobileContent={
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-white">Apostas</p>
                <div className="bg-[#1e3a8a] rounded-lg px-2 py-1 flex items-center gap-1">
                  <Plus className="w-2.5 h-2.5 text-white"/><span className="text-[7px] text-white">Nova</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { ev: "Flamengo x Corinthians", casa: "Bet365 · R$ 95,24", lucro: "+R$ 9,83", s: "green" },
                  { ev: "Real Madrid x Barcelona", casa: "Betano · R$ 100,00", lucro: "-R$ 100,00", s: "red" },
                  { ev: "Djokovic x Alcaraz", casa: "Superbet · R$ 80,00", lucro: "Pendente", s: "yellow" },
                ].map(({ ev, casa, lucro, s }, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-8 rounded-full ${s==="green"?"bg-green-500":s==="red"?"bg-red-500":"bg-yellow-500"}`} />
                      <div>
                        <p className="text-[8px] font-semibold text-white truncate max-w-[120px]">{ev}</p>
                        <p className="text-[7px] text-gray-500">{casa}</p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-bold ${s==="green"?"text-green-400":s==="red"?"text-red-400":"text-yellow-400"}`}>{lucro}</span>
                  </div>
                ))}
              </div>
            </>
          }>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold text-white">Apostas</p>
              </div>
              <div className="flex items-center gap-1">
                <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 flex items-center gap-1">
                  <Search className="w-2.5 h-2.5 text-gray-500" />
                  <span className="text-[7px] text-gray-500">Buscar...</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-1">
                  <Filter className="w-2.5 h-2.5 text-gray-500" />
                </div>
                <div className="bg-[#1e3a8a] rounded-lg px-2 py-1 flex items-center gap-1">
                  <Plus className="w-2.5 h-2.5 text-white" />
                  <span className="text-[7px] text-white">Nova</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              {[
                { ev: "Flamengo x Corinthians", casa: "Bet365", stake: "R$ 95,24", lucro: "+R$ 9,83", s: "green" },
                { ev: "Real Madrid x Barcelona", casa: "Betano", stake: "R$ 100,00", lucro: "-R$ 100,00", s: "red" },
                { ev: "Djokovic x Alcaraz", casa: "Superbet", stake: "R$ 80,00", lucro: "Pendente", s: "yellow" },
              ].map(({ ev, casa, stake, lucro, s }, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-6 rounded-full ${s === "green" ? "bg-green-500" : s === "red" ? "bg-red-500" : "bg-yellow-500"}`} />
                    <div>
                      <p className="text-[8px] font-semibold text-white">{ev}</p>
                      <p className="text-[7px] text-gray-500">{casa} · {stake}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-bold ${s === "green" ? "text-green-400" : s === "red" ? "text-red-400" : "text-yellow-400"}`}>{lucro}</span>
                </div>
              ))}
            </div>
          </MockBoth>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como registrar uma aposta</h3>
            <div className="space-y-3">
              <Step num={1} text='Acesse "Apostas" no menu lateral.' />
              <Step num={2} text='Clique em "+ Nova Aposta" e selecione o perfil.' />
              <Step num={3} text="Preencha evento, mercado, odd, valor e casa de aposta." />
              <Step num={4} text="Após o resultado, volte e marque como Ganho, Perdido ou Devolvido." />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pendente",  color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", desc: "Aguardando resultado" },
              { label: "Ganho",     color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",   desc: "Aposta vencedora" },
              { label: "Perdido",   color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",       desc: "Aposta perdedora" },
            ].map(({ label, color, bg, desc }) => (
              <div key={label} className={`border rounded-xl p-3 ${bg}`}>
                <p className={`text-sm font-semibold mb-1 ${color}`}>{label}</p>
                <p className="text-xs text-[var(--text-muted)]">{desc}</p>
              </div>
            ))}
          </div>
          <Tip text="Registre cada aposta logo após realizá-la. Quanto mais completo o histórico, mais precisas são suas estatísticas." />
        </div>
      )}

      {/* ── FINANCEIRO ── */}
      {id === "financeiro" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Financeiro</h2>
            <p className="text-sm text-[var(--text-secondary)]">Análise detalhada do seu desempenho financeiro.</p>
          </div>

          <MockBoth url="/financeiro" activeNav="/financeiro" mobileContent={
            <>
              <p className="text-[10px] font-bold text-white mb-2">Financeiro</p>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {[
                  { l:"Total Investido", v:"R$ 2.400", c:"text-white" },
                  { l:"Lucro Realizado", v:"R$ 120,00", c:"text-[#60a5fa]" },
                  { l:"Lucro Pendente", v:"R$ 0,00", c:"text-yellow-400" },
                  { l:"ROI Médio", v:"5.00%", c:"text-green-400" },
                ].map(({l,v,c})=>(
                  <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                    <p className="text-[6px] text-gray-500 mb-0.5">{l}</p>
                    <p className={`text-[9px] font-bold ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                <p className="text-[8px] font-semibold text-gray-300 mb-1.5">Evolução da Banca</p>
                <div className="flex items-end gap-0.5 h-12 px-1">
                  {[3,5,4,7,5,9,8,6,8,10].map((h,i)=>(
                    <div key={i} className="flex-1 bg-[#1e3a8a]/60 rounded-t" style={{height:`${h*9}%`}} />
                  ))}
                </div>
              </div>
            </>
          }>
            <p className="text-[10px] font-bold text-white mb-3">Financeiro</p>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { l: "Total Investido", v: "R$ 2.400", c: "text-white" },
                { l: "Lucro Realizado", v: "R$ 120,00", c: "text-[var(--accent-text)]" },
                { l: "Lucro Pendente", v: "R$ 0,00", c: "text-yellow-500" },
                { l: "ROI Médio", v: "5.00%", c: "text-green-400" },
              ].map(({ l, v, c }) => (
                <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-1.5 text-center">
                  <p className="text-[7px] text-gray-500">{l}</p>
                  <p className={`text-[9px] font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[8px] font-semibold text-gray-300 uppercase tracking-wide">Evolução da Banca</p>
                <div className="flex gap-1">
                  {["Dia","Sem","Mês","Ano"].map(f => (
                    <span key={f} className={`text-[6px] px-1.5 py-0.5 rounded ${f === "Mês" ? "bg-[#1e3a8a] text-white" : "text-gray-500"}`}>{f}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-1 h-12 px-1">
                {[3,5,4,7,5,9,8,6,8,10].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#1e3a8a]/60 rounded-t" style={{ height: `${h * 9}%` }} />
                ))}
              </div>
            </div>
          </MockBoth>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que você encontra aqui</h3>
            <div className="space-y-2.5">
              {[
                { icon: BarChart2,   label: "Evolução da banca",    desc: "Gráfico do crescimento do saldo ao longo do tempo com filtros de período." },
                { icon: ArrowUpRight,label: "ROI por período",      desc: "Retorno sobre investimento filtrado por dia, semana, mês ou ano." },
                { icon: Filter,      label: "Filtros avançados",    desc: "Filtre por perfil e bet para análises específicas." },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                  <div className="w-8 h-8 bg-[#1e3a8a]/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[var(--accent-text)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Tip text="Se um perfil tem ROI negativo, compare as casas de apostas usadas. Às vezes uma única casa está puxando o resultado para baixo." />
        </div>
      )}

      {/* ── ASSINATURA ── */}
      {id === "assinatura" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Assinatura</h2>
            <p className="text-sm text-[var(--text-secondary)]">Gerencie seu plano e forma de pagamento.</p>
          </div>

          <MockBoth url="/assinatura" activeNav="/dashboard" mobileContent={
            <>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-[#60a5fa]" />
                <p className="text-[10px] font-bold text-white">Assinatura</p>
              </div>
              <div className="bg-white/5 border border-[#1e3a8a]/30 rounded-xl p-2.5 mb-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="w-3 h-3 text-[#60a5fa]" />
                  <span className="text-[9px] font-bold text-white">Pro</span>
                  <span className="text-[7px] bg-green-500/20 text-green-400 px-1.5 rounded-full border border-green-500/20 ml-1">Ativa</span>
                </div>
                <p className="text-[11px] font-bold text-white">R$ 99<span className="text-[8px] font-normal text-gray-500">,00/mês</span></p>
                <p className="text-[7px] text-gray-400 mt-0.5">Próxima cobrança em <span className="text-white">21/07/2026</span></p>
                <div className="mt-2 flex items-center gap-1 bg-[#1e3a8a] w-fit px-2 py-1 rounded-lg">
                  <RefreshCw className="w-2.5 h-2.5 text-white" />
                  <span className="text-[7px] text-white font-medium">Atualizar pagamento</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {[
                  { l:"Status", v:"Ativa", c:"text-green-400" },
                  { l:"Plano", v:"Pro · R$ 99/mês", c:"text-white" },
                  { l:"Próx. cobrança", v:"21/07/2026", c:"text-white" },
                ].map(({l,v,c})=>(
                  <div key={l} className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-[7px] text-gray-500">{l}</span>
                    <span className={`text-[7px] font-medium ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          }>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-[#1e3a8a]/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-3 h-3 text-[var(--accent-text)]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white">Assinatura</p>
                <p className="text-[7px] text-gray-500">Gerencie seu plano do SureBetFlow</p>
              </div>
            </div>
            <div className="bg-white/5 border border-[#1e3a8a]/30 rounded-xl p-2.5 mb-2 relative">
              <div className="absolute top-2 right-2">
                <span className="text-[6px] bg-[#1e3a8a]/20 text-[var(--accent-text)] px-1.5 py-0.5 rounded-full">Plano único</span>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="w-3 h-3 text-[var(--accent-text)]" />
                <span className="text-[9px] font-bold text-white">Pro</span>
                <span className="text-[7px] bg-green-500/20 text-green-400 px-1.5 rounded-full border border-green-500/20 ml-1">Ativa</span>
              </div>
              <p className="text-[11px] font-bold text-white">R$ 99<span className="text-[8px] font-normal text-gray-500">,00/mês</span></p>
              <p className="text-[7px] text-gray-400 mt-0.5">Próxima cobrança em <span className="text-white">21/07/2026</span></p>
              <div className="mt-2 flex items-center gap-1 bg-[#1e3a8a] w-fit px-2 py-1 rounded-lg">
                <RefreshCw className="w-2.5 h-2.5 text-white" />
                <span className="text-[7px] text-white font-medium">Atualizar pagamento</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-2.5 py-1.5 border-b border-white/5">
                <p className="text-[8px] font-semibold text-white">Detalhes da assinatura</p>
              </div>
              {[
                { icon: Activity, l: "Status", v: "Ativa", c: "text-green-400" },
                { icon: Star,     l: "Plano",  v: "Pro — R$ 99,00/mês", c: "text-white" },
                { icon: Calendar, l: "Próxima cobrança", v: "21/07/2026", c: "text-white" },
                { icon: Hash,     l: "ID da assinatura", v: "pix_123456...", c: "text-gray-500" },
              ].map(({ icon: Icon, l, v, c }) => (
                <div key={l} className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-2.5 h-2.5 text-gray-500" />
                    <span className="text-[7px] text-gray-500">{l}</span>
                  </div>
                  <span className={`text-[7px] font-medium ${c}`}>{v}</span>
                </div>
              ))}
            </div>
          </MockBoth>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como assinar o plano</h3>
            <div className="space-y-3">
              <Step num={1} text='Acesse "Assinatura" no menu lateral.' />
              <Step num={2} text='Clique em "Assinar agora" para ir à página de pagamento.' />
              <Step num={3} text="Escolha PIX (aprovação imediata) ou Cartão de crédito/débito." />
              <Step num={4} text="PIX: gere o QR Code, escaneie no banco e aguarde confirmação automática." />
              <Step num={5} text="Cartão: preencha os dados e clique em assinar. Ativação imediata." />
            </div>
          </div>
          <Tip text="Para cancelar a assinatura, abra um ticket no Suporte. Nossa equipe responde em até 24 horas." />
        </div>
      )}

      {/* ── CONFIGURAÇÕES ── */}
      {id === "configuracoes" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Configurações</h2>
            <p className="text-sm text-[var(--text-secondary)]">Personalize sua conta e preferências.</p>
          </div>

          <MockBoth url="/configuracoes" activeNav="/dashboard" mobileContent={
            <>
              <p className="text-[10px] font-bold text-white mb-2">Configurações</p>
              <div className="space-y-1.5">
                {[
                  { label:"Meu perfil",   sub:"Altere nome, foto e e-mail" },
                  { label:"Segurança",    sub:"Alterar senha de acesso" },
                  { label:"Aparência",    sub:"Tema claro ou escuro" },
                  { label:"Notificações", sub:"Gerencie alertas por e-mail" },
                ].map(({label,sub})=>(
                  <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-medium text-white">{label}</p>
                      <p className="text-[7px] text-gray-500">{sub}</p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-gray-600" />
                  </div>
                ))}
              </div>
            </>
          }>
            <p className="text-[10px] font-bold text-white mb-3">Configurações</p>
            <div className="space-y-1.5">
              {[
                { label: "Meu perfil",    sub: "Altere nome, foto e e-mail da conta" },
                { label: "Segurança",     sub: "Alterar senha de acesso" },
                { label: "Aparência",     sub: "Tema claro ou escuro" },
                { label: "Notificações",  sub: "Gerencie alertas por e-mail" },
              ].map(({ label, sub }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between hover:border-[#1e3a8a]/30 cursor-pointer">
                  <div>
                    <p className="text-[9px] font-medium text-white">{label}</p>
                    <p className="text-[7px] text-gray-500">{sub}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                </div>
              ))}
            </div>
          </MockBoth>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">O que você pode configurar</h3>
            <div className="space-y-2.5">
              {[
                { label: "Meu perfil",    desc: "Atualize seu nome, foto de perfil e endereço de e-mail." },
                { label: "Segurança",     desc: "Altere sua senha de acesso quando necessário." },
                { label: "Aparência",     desc: "Alterne entre tema escuro e claro conforme sua preferência." },
                { label: "Notificações",  desc: "Escolha quais alertas deseja receber por e-mail." },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-start gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                  <CheckCircle className="w-4 h-4 text-[var(--accent-text)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Tip text="Mantenha seu e-mail sempre atualizado para receber notificações importantes sobre sua assinatura." />
        </div>
      )}

      {/* ── SUPORTE ── */}
      {id === "suporte" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Suporte</h2>
            <p className="text-sm text-[var(--text-secondary)]">Abra tickets e acompanhe o atendimento da nossa equipe.</p>
          </div>

          <MockBoth url="/suporte" activeNav="/dashboard" mobileContent={
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-white">Suporte</p>
                <div className="flex items-center gap-1 bg-[#1e3a8a] px-2 py-1 rounded-lg">
                  <Plus className="w-2.5 h-2.5 text-white"/><span className="text-[7px] text-white">Novo ticket</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-2 mb-2">
                <p className="text-[8px] font-semibold text-white mb-1.5">Novo Ticket</p>
                <div className="space-y-1.5">
                  <div className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 flex items-center justify-between">
                    <span className="text-[7px] text-gray-400">Selecione o assunto</span>
                    <ChevronRight className="w-2 h-2 text-gray-600 rotate-90" />
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-lg px-2 py-3">
                    <p className="text-[6px] text-gray-600">Descreva seu problema...</p>
                  </div>
                  <div className="bg-[#1e3a8a] rounded-lg py-1.5 text-center">
                    <span className="text-[7px] text-white font-medium">Abrir ticket</span>
                  </div>
                </div>
              </div>
              {[
                { assunto:"Dúvidas", status:"respondido", cor:"text-blue-400", badge:"bg-blue-500/10 border-blue-500/20" },
                { assunto:"Sugestões", status:"aberto", cor:"text-yellow-400", badge:"bg-yellow-500/10 border-yellow-500/20" },
              ].map(({assunto,status,cor,badge})=>(
                <div key={assunto} className="bg-white/5 border border-white/10 rounded-xl p-2 mb-1 flex items-center justify-between">
                  <p className="text-[8px] font-semibold text-white">{assunto}</p>
                  <span className={`text-[7px] font-medium border px-1.5 py-0.5 rounded-full ${badge} ${cor}`}>{status}</span>
                </div>
              ))}
            </>
          }>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-bold text-white">Suporte</p>
                <p className="text-[7px] text-gray-500">Envie mensagens e acompanhe seus tickets</p>
              </div>
              <div className="flex items-center gap-1 bg-[#1e3a8a] px-2 py-1 rounded-lg">
                <Plus className="w-2.5 h-2.5 text-white" />
                <span className="text-[7px] text-white font-medium">Novo ticket</span>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 mb-2">
              <p className="text-[8px] font-semibold text-white mb-2">Novo Ticket</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="col-span-2">
                  <p className="text-[6px] text-gray-500 mb-1">Assunto</p>
                  <div className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 flex items-center justify-between">
                    <span className="text-[7px] text-gray-400">Selecione o assunto</span>
                    <ChevronRight className="w-2 h-2 text-gray-600 rotate-90" />
                  </div>
                  <div className="mt-1 bg-black/40 border border-white/10 rounded-lg px-1.5 py-0.5 flex gap-1">
                    {["Dúvidas", "Sugestões", "Críticas"].map(o => (
                      <span key={o} className={`text-[6px] px-1 py-0.5 rounded ${o === "Dúvidas" ? "bg-[#1e3a8a] text-white" : "text-gray-500"}`}>{o}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[6px] text-gray-500 mb-1">Prioridade</p>
                  <div className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 flex items-center justify-between">
                    <span className="text-[7px] text-gray-400">Normal</span>
                    <ChevronRight className="w-2 h-2 text-gray-600 rotate-90" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[6px] text-gray-500 mb-1">Mensagem</p>
                <div className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 h-8">
                  <p className="text-[6px] text-gray-600">Descreva detalhadamente sua dúvida ou problema...</p>
                </div>
              </div>
            </div>
            {[
              { assunto: "Dúvidas", msg: "Como funciona o cálculo de ROI?", status: "respondido", cor: "text-blue-400", badge: "bg-blue-500/10 border-blue-500/20" },
              { assunto: "Sugestões", msg: "Adicionar exportação para Excel", status: "aberto", cor: "text-yellow-400", badge: "bg-yellow-500/10 border-yellow-500/20" },
            ].map(({ assunto, msg, status, cor, badge }) => (
              <div key={assunto} className="bg-white/5 border border-white/10 rounded-xl p-2 mb-1 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-semibold text-white">{assunto}</p>
                  <p className="text-[7px] text-gray-500 truncate">{msg}</p>
                </div>
                <span className={`text-[7px] font-medium border px-1.5 py-0.5 rounded-full ${badge} ${cor}`}>{status}</span>
              </div>
            ))}
          </MockBoth>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Como abrir um ticket</h3>
            <div className="space-y-3">
              <Step num={1} text='Acesse "Suporte" no menu lateral.' />
              <Step num={2} text='Clique em "+ Novo ticket".' />
              <Step num={3} text="Selecione o assunto: Dúvidas, Sugestões ou Críticas." />
              <Step num={4} text="Escolha a prioridade e descreva detalhadamente o problema." />
              <Step num={5} text="Clique em Abrir ticket — nossa equipe responde em até 24 horas úteis." />
              <Step num={6} text="Acompanhe e responda clicando no ticket aberto na lista." />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Aberto",     color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", desc: "Aguardando resposta" },
              { label: "Respondido", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",    desc: "Equipe respondeu" },
              { label: "Fechado",    color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-500/20",    desc: "Resolvido e encerrado" },
            ].map(({ label, color, bg, desc }) => (
              <div key={label} className={`border rounded-xl p-3 ${bg}`}>
                <p className={`text-sm font-semibold mb-1 ${color}`}>{label}</p>
                <p className="text-xs text-[var(--text-muted)]">{desc}</p>
              </div>
            ))}
          </div>
          <Tip text="Inclua prints e o máximo de detalhes no ticket. Isso agiliza muito a resolução do problema." />
        </div>
      )}
    </div>
  )
}

export default function TutorialClient() {
  const [active, setActive] = useState("inicio")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetSection, setSheetSection] = useState("inicio")
  const IDS = SECTIONS.map(s => s.id)
  const touchStartX = useRef(0)

  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 50) return
    const idx = IDS.indexOf(sheetSection)
    if (dx < 0 && idx < IDS.length - 1) setSheetSection(IDS[idx + 1])
    if (dx > 0 && idx > 0) setSheetSection(IDS[idx - 1])
  }

  function openSheet(id: string) { setSheetSection(id); setSheetOpen(true) }

  const sheetIdx = IDS.indexOf(sheetSection)
  const currentSection = SECTIONS.find(s => s.id === sheetSection)

  return (
    <div className="max-w-5xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="hidden md:flex w-9 h-9 bg-[#1e3a8a]/10 rounded-xl items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-[var(--accent-text)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tutorial</h1>
          <p className="text-sm text-[var(--text-secondary)]">Aprenda a usar todas as funcionalidades do SureBetFlow</p>
        </div>
      </div>

      {/* Mobile: card grid */}
      <div className="md:hidden grid grid-cols-2 gap-3 mb-2">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => openSheet(id)}
            className="flex flex-col items-center gap-3 p-5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all text-left active:scale-95"
          >
            <div className="w-10 h-10 bg-[#1e3a8a]/10 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-[var(--accent-text)]" />
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)] text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Desktop: tabs + content */}
      <div className="hidden md:block">
        <div className="mb-6">
          <div className="flex overflow-x-auto scrollbar-hide border-b border-[var(--border)]">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 -mb-px transition-colors ${
                  active === id
                    ? "border-[#1e3a8a] text-[var(--accent-text)]"
                    : "border-transparent text-[var(--text-secondary)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <SectionContent id={active} />

        {/* Desktop bottom navigation */}
        <div className="flex items-center justify-between pt-4 mt-8 border-t border-[var(--border)]">
          <button
            onClick={() => {
              const idx = SECTIONS.findIndex(s => s.id === active)
              if (idx > 0) setActive(SECTIONS[idx - 1].id)
            }}
            disabled={SECTIONS[0].id === active}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Anterior
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {SECTIONS.findIndex(s => s.id === active) + 1} / {SECTIONS.length}
          </span>
          <button
            onClick={() => {
              const idx = SECTIONS.findIndex(s => s.id === active)
              if (idx < SECTIONS.length - 1) setActive(SECTIONS[idx + 1].id)
            }}
            disabled={SECTIONS[SECTIONS.length - 1].id === active}
            className="flex items-center gap-2 text-sm text-[var(--accent-text)] hover:text-[#1e40af] disabled:opacity-30 transition-colors font-medium"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[95vh] flex flex-col p-0 rounded-t-2xl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sheet header with navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
            <button
              onClick={() => sheetIdx > 0 && setSheetSection(IDS[sheetIdx - 1])}
              disabled={sheetIdx === 0}
              className="flex items-center gap-1 text-sm text-[var(--text-secondary)] disabled:opacity-30 transition-colors p-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              {currentSection && <currentSection.icon className="w-4 h-4 text-[var(--accent-text)]" />}
              <SheetTitle className="text-sm font-semibold text-[var(--text-primary)]">
                {currentSection?.label}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => sheetIdx < IDS.length - 1 && setSheetSection(IDS[sheetIdx + 1])}
                disabled={sheetIdx === IDS.length - 1}
                className="flex items-center gap-1 text-sm text-[var(--text-secondary)] disabled:opacity-30 transition-colors p-1"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <SheetClose className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors ml-1">
                <X className="w-4 h-4" />
              </SheetClose>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0">
            {SECTIONS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSheetSection(s.id)}
                className={`rounded-full transition-all ${
                  s.id === sheetSection
                    ? "w-4 h-1.5 bg-[#1e3a8a]"
                    : "w-1.5 h-1.5 bg-[var(--border)]"
                }`}
              />
            ))}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            <SectionContent id={sheetSection} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
