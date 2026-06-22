"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DollarSign, TrendingUp, Clock, ArrowUpRight, Users, ClipboardList, Wallet, ChevronRight } from "lucide-react"
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
  { href: "/perfis", icon: Users, label: "Perfis", sub: "Gerenciar", color: "text-[#a855f7]", bg: "bg-[#a855f7]/10 border-[#a855f7]/20" },
  { href: "/apostas", icon: ClipboardList, label: "Apostas", sub: "Registrar", color: "text-[var(--accent-text)]", bg: "bg-[#1e3a8a]/10 border-[#1e3a8a]/20" },
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
    { label: "Saldo Total", value: formatCurrency(dashboard?.saldo_total ?? 0), icon: DollarSign, color: "text-[#3b82f6]", ring: "border-[#3b82f6]/20", bg: "bg-[#3b82f6]/10" },
    { label: "Lucro Realizado", value: formatCurrency(dashboard?.lucro_realizado ?? 0), icon: TrendingUp, color: "text-[var(--accent-text)]", ring: "border-[#1e3a8a]/20", bg: "bg-[#1e3a8a]/10" },
    { label: "Lucro Pendente", value: formatCurrency(dashboard?.lucro_pendente ?? 0), icon: Clock, color: "text-yellow-500", ring: "border-yellow-500/20", bg: "bg-yellow-500/10" },
    { label: "ROI", value: `${(dashboard?.roi_percentual ?? 0).toFixed(2)}%`, icon: ArrowUpRight, color: "text-[#a855f7]", ring: "border-[#a855f7]/20", bg: "bg-[#a855f7]/10" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Painel Geral <span>📊</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Visão consolidada de todos os seus perfis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, ring, bg }) => (
          <div key={label} className={`rounded-xl border ${ring} bg-[var(--bg-surface)] p-5`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 ${bg} rounded-lg border ${ring}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-secondary)]">{label}</p>
                <p className={`text-lg font-bold ${color} truncate`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Lucro Acumulado</h2>
            <span className="text-xs text-[var(--text-secondary)]">Apostas finalizadas</span>
          </div>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-[var(--text-secondary)] text-sm">
              Nenhuma aposta finalizada ainda
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }}
                  formatter={(v: unknown) => [formatCurrency(v as number), "Lucro"]}
                />
                <Line type="monotone" dataKey="lucro" stroke="#1e3a8a" strokeWidth={2.5} dot={{ fill: "#1e3a8a", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resumo Financeiro */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">Resumo Financeiro</h2>
          <div className="flex-1 space-y-3">
            {[
              { label: "Total Investido", value: formatCurrency(dashboard?.total_investido ?? 0), cls: "text-[var(--text-primary)]" },
              { label: "Lucro Realizado", value: formatCurrency(dashboard?.lucro_realizado ?? 0), cls: "text-[var(--accent-text)]" },
              { label: "Lucro Pendente", value: formatCurrency(dashboard?.lucro_pendente ?? 0), cls: "text-yellow-500" },
              { label: "Total Apostas", value: String(dashboard?.total_apostas ?? 0), cls: "text-[var(--text-primary)]" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                <span className={`text-sm font-semibold ${cls}`}>{value}</span>
              </div>
            ))}
          </div>
          <Link
            href="/financeiro"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-[#1e3a8a]/40 text-[var(--accent-text)] text-sm font-medium hover:bg-[#1e3a8a]/10 transition-colors"
          >
            <Wallet className="w-4 h-4" />
            Ver Financeiro
          </Link>
        </div>
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">Ações Rápidas</h2>
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
                  <p className="text-[10px] text-[var(--text-secondary)]">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Atividades */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Atividades Recentes</h2>
            <Link href="/apostas" className="text-xs text-[var(--accent-text)] hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentApostas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Nenhuma atividade recente</p>
              <p className="text-xs text-[var(--text-muted)]">As apostas registradas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentApostas.slice(0, 6).map(a => (
                <Link key={a.id} href={`/apostas/${a.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0 group-hover:bg-[#1e3a8a]/20">
                    <ClipboardList className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent-text)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{a.evento}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {a.profile ? (a.profile.apelido ?? `${a.profile.nome} ${a.profile.sobrenome}`) : "—"} · {new Date(a.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusBadge(a.status)}
                    <span className="text-xs font-semibold text-[var(--accent-text)]">{formatCurrency(a.lucro_garantido)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profiles */}
      {profiles.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Perfis</h2>
            <Link href="/perfis" className="text-xs text-[var(--accent-text)] hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {profiles.map(p => (
              <Link
                key={p.profile_id}
                href={`/perfis/${p.profile_id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-muted)] hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all"
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-[#1e3a8a]/20 text-[var(--accent-text)] text-sm font-bold">
                    {p.nome.charAt(0)}{p.sobrenome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{p.apelido ?? `${p.nome} ${p.sobrenome}`}</p>
                  <p className="text-xs text-[var(--accent-text)] font-semibold">{formatCurrency(p.saldo_total)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
