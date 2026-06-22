"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DollarSign, TrendingUp, Clock, Calculator, ArrowUpRight, Users, ClipboardList, Wallet, ChevronRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { DashboardGeral, ProfileDashboard, Aposta } from "@/lib/types"

interface Props {
  dashboard: DashboardGeral | null
  profiles: ProfileDashboard[]
  recentApostas: (Aposta & { profile?: { nome: string; sobrenome: string; apelido?: string | null } })[]
  apostasFinalizadas: { lucro_garantido: number; resultado_real?: number | null; finalizada_at?: string | null }[]
}

function statusBadge(status: string) {
  switch (status) {
    case "finalizada": return <Badge variant="default">Finalizada</Badge>
    case "cancelada": return <Badge variant="destructive">Cancelada</Badge>
    default: return <Badge variant="yellow">Pendente</Badge>
  }
}

const quickActions = [
  { href: "/calculadora", icon: Calculator, label: "Calculadora", sub: "Calcular", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10 border-[#3b82f6]/20" },
  { href: "/perfis", icon: Users, label: "Perfis", sub: "Gerenciar", color: "text-[#a855f7]", bg: "bg-[#a855f7]/10 border-[#a855f7]/20" },
  { href: "/apostas", icon: ClipboardList, label: "Apostas", sub: "Registrar", color: "text-[#16A34A]", bg: "bg-[#16A34A]/10 border-[#16A34A]/20" },
  { href: "/financeiro", icon: Wallet, label: "Financeiro", sub: "Movimentar", color: "text-[#f97316]", bg: "bg-[#f97316]/10 border-[#f97316]/20" },
]

export default function HomeDashboard({ dashboard, profiles, recentApostas, apostasFinalizadas }: Props) {
  let cumulative = 0
  const chartData = apostasFinalizadas.map(a => {
    cumulative += a.resultado_real ?? a.lucro_garantido
    return {
      date: a.finalizada_at
        ? new Date(a.finalizada_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
        : "",
      lucro: parseFloat(cumulative.toFixed(2)),
    }
  })

  const stats = [
    {
      label: "Saldo Total",
      value: formatCurrency(dashboard?.saldo_total ?? 0),
      icon: DollarSign,
      color: "text-[#3b82f6]",
      bg: "bg-[#3b82f6]/10",
      border: "border-[#3b82f6]/20",
    },
    {
      label: "Lucro Realizado",
      value: formatCurrency(dashboard?.lucro_realizado ?? 0),
      icon: TrendingUp,
      color: "text-[#16A34A]",
      bg: "bg-[#16A34A]/10",
      border: "border-[#16A34A]/20",
    },
    {
      label: "Lucro Pendente",
      value: formatCurrency(dashboard?.lucro_pendente ?? 0),
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/20",
    },
    {
      label: "ROI",
      value: `${(dashboard?.roi_percentual ?? 0).toFixed(2)}%`,
      icon: ArrowUpRight,
      color: "text-[#a855f7]",
      bg: "bg-[#a855f7]/10",
      border: "border-[#a855f7]/20",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e6edf3]">
            Painel Geral <span className="text-2xl">📊</span>
          </h1>
          <p className="text-[#8b949e] text-sm mt-1">Visão consolidada de todos os seus perfis</p>
        </div>
        <Link
          href="/calculadora"
          className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Calculator className="h-4 w-4" />
          Calculadora
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-xl border ${border} bg-[#161b22] p-5`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 ${bg} rounded-lg border ${border}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#8b949e]">{label}</p>
                <p className={`text-lg font-bold ${color} truncate`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wide">Lucro Acumulado</h2>
            <span className="text-xs text-[#8b949e]">Apostas finalizadas</span>
          </div>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-[#8b949e] text-sm">
              Nenhuma aposta finalizada ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8b949e" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8b949e" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#21262d", border: "1px solid #30363d", borderRadius: "8px", color: "#e6edf3" }}
                  formatter={(v: unknown) => [formatCurrency(v as number), "Lucro"]}
                />
                <Line type="monotone" dataKey="lucro" stroke="#16A34A" strokeWidth={2.5} dot={{ fill: "#16A34A", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resumo Financeiro */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wide mb-4">Resumo Financeiro</h2>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#21262d]">
              <span className="text-sm text-[#8b949e]">Total Investido</span>
              <span className="text-sm font-semibold text-[#e6edf3]">{formatCurrency(dashboard?.total_investido ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#21262d]">
              <span className="text-sm text-[#8b949e]">Lucro Realizado</span>
              <span className="text-sm font-semibold text-[#16A34A]">{formatCurrency(dashboard?.lucro_realizado ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#21262d]">
              <span className="text-sm text-[#8b949e]">Lucro Pendente</span>
              <span className="text-sm font-semibold text-yellow-400">{formatCurrency(dashboard?.lucro_pendente ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#8b949e]">Total Apostas</span>
              <span className="text-sm font-semibold text-[#e6edf3]">{dashboard?.total_apostas ?? 0}</span>
            </div>
          </div>
          <Link
            href="/financeiro"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#16A34A]/40 text-[#16A34A] text-sm font-medium hover:bg-[#16A34A]/10 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            Ver Financeiro
          </Link>
        </div>
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <h2 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wide mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(({ href, icon: Icon, label, sub, color, bg }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${bg} hover:scale-[1.02] transition-transform`}
              >
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="text-center">
                  <p className={`text-xs font-semibold ${color}`}>{label}</p>
                  <p className="text-[10px] text-[#8b949e]">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Apostas */}
        <div className="lg:col-span-2 rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wide">Atividades Recentes</h2>
            <Link href="/apostas" className="text-xs text-[#16A34A] hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentApostas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <div className="w-10 h-10 rounded-full bg-[#21262d] flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[#8b949e]" />
              </div>
              <p className="text-sm text-[#8b949e]">Nenhuma atividade recente</p>
              <p className="text-xs text-[#8b949e]">As apostas registradas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentApostas.slice(0, 6).map(a => (
                <Link key={a.id} href={`/apostas/${a.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#21262d] transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-[#21262d] flex items-center justify-center flex-shrink-0 group-hover:bg-[#16A34A]/20">
                    <ClipboardList className="w-4 h-4 text-[#8b949e] group-hover:text-[#16A34A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e6edf3] truncate">{a.evento}</p>
                    <p className="text-xs text-[#8b949e]">
                      {a.profile ? (a.profile.apelido ?? `${a.profile.nome} ${a.profile.sobrenome}`) : "—"} · {new Date(a.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusBadge(a.status)}
                    <span className="text-xs font-semibold text-[#16A34A]">{formatCurrency(a.lucro_garantido)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profiles row */}
      {profiles.length > 0 && (
        <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#e6edf3] uppercase tracking-wide">Perfis</h2>
            <Link href="/perfis" className="text-xs text-[#16A34A] hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {profiles.map(p => (
              <Link
                key={p.profile_id}
                href={`/perfis/${p.profile_id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#21262d] bg-[#0d1117] hover:border-[#16A34A]/40 hover:bg-[#16A34A]/5 transition-all"
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  {p.foto_url && <AvatarFallback className="bg-[#16A34A] text-white text-sm">
                    {p.nome.charAt(0)}{p.sobrenome.charAt(0)}
                  </AvatarFallback>}
                  <AvatarFallback className="bg-[#16A34A]/20 text-[#16A34A] text-sm font-bold">
                    {p.nome.charAt(0)}{p.sobrenome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e6edf3] truncate">{p.apelido ?? `${p.nome} ${p.sobrenome}`}</p>
                  <p className="text-xs text-[#16A34A] font-semibold">{formatCurrency(p.saldo_total)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
