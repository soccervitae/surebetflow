"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertTriangle, DollarSign, TrendingUp, Clock, ArrowUpRight,
  ClipboardList, Wallet, ChevronRight, Target,
  CheckCircle2, BookOpen,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { DashboardGeral, ProfileDashboard, Aposta, ApostaLeg } from "@/lib/types"
import ApostaDesktopCard from "@/components/ApostaDesktopCard"
import ApostaMobileCard from "@/components/ApostaMobileCard"
import MovimentacaoRow from "@/components/MovimentacaoRow"
import type { MovimentacaoItem } from "@/components/MovimentacaoRow"

interface Props {
  dashboard: DashboardGeral | null
  profiles: ProfileDashboard[]
  recentApostas: (Aposta & { profile?: { nome: string; sobrenome: string; apelido?: string | null } })[]
  apostasFinalizadas: { lucro_garantido: number; resultado_real?: number | null; finalizada_at?: string | null }[]
  apostasPendentesAntigas?: number
  pendentesCount?: number
  recentMovimentacoes?: any[]
}

function statusBadge(status: string) {
  switch (status) {
    case "finalizada": return <Badge variant="default">Finalizada</Badge>
    case "cancelada": return <Badge variant="destructive">Cancelada</Badge>
    default: return <Badge variant="yellow">Pendente</Badge>
  }
}

function detectGreenLegId(legs: ApostaLeg[], investimento_total: number, resultado_real: number | null | undefined): string | null {
  if (resultado_real == null || !legs?.length) return null
  const inv = parseFloat(String(investimento_total))
  const res = parseFloat(String(resultado_real))
  let minDiff = Infinity, minId: string | null = null
  for (const l of legs) {
    const diff = Math.abs(parseFloat(String(l.stake)) * parseFloat(String(l.odd)) - inv - res)
    if (diff < minDiff) { minDiff = diff; minId = l.id }
  }
  return minDiff < 5 ? minId : null
}


export default function HomeDashboard({
  dashboard, profiles, recentApostas, apostasFinalizadas,
  apostasPendentesAntigas = 0, pendentesCount = 0, recentMovimentacoes = [],
}: Props) {
  // Chart data
  let cumulative = 0
  const chartData = apostasFinalizadas.map(a => {
    cumulative += parseFloat(String(a.resultado_real ?? a.lucro_garantido))
    return {
      date: a.finalizada_at
        ? new Date(a.finalizada_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
        : "",
      lucro: parseFloat(cumulative.toFixed(2)),
    }
  })

  // Apostas summary
  const totalFinalizadas = apostasFinalizadas.length
  const wins = apostasFinalizadas.filter(a => parseFloat(String(a.resultado_real ?? 0)) > 0).length
  const winRate = totalFinalizadas > 0 ? (wins / totalFinalizadas) * 100 : 0

  // Summary stats
  const summaryStats = [
    { label: "Saldo Total", value: formatCurrency(dashboard?.saldo_total ?? 0), icon: DollarSign, color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10", border: "border-[#3b82f6]/20" },
    { label: "Lucro", value: formatCurrency(dashboard?.lucro_realizado ?? 0), icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    { label: "Lucro Pendente", value: formatCurrency(dashboard?.lucro_pendente ?? 0), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "ROI", value: `${parseFloat(String(dashboard?.roi_percentual ?? 0)).toFixed(2)}%`, icon: ArrowUpRight, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10", border: "border-[#a855f7]/20" },
  ]

  const apostasStats = [
    { label: "Total Apostas", value: String(dashboard?.total_apostas ?? 0), icon: ClipboardList, color: "text-[var(--text-primary)]", bg: "bg-[var(--bg-elevated)]", border: "border-[var(--border)]" },
    { label: "Finalizadas", value: String(totalFinalizadas), icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    { label: "Pendentes", value: String(pendentesCount), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "Taxa de Acerto", value: `${winRate.toFixed(1)}%`, icon: Target, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10", border: "border-[#a855f7]/20" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Painel Geral</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Visão consolidada de todos os seus perfis</p>
      </div>

      {/* Pending bets alert */}
      {apostasPendentesAntigas > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
              Você tem {apostasPendentesAntigas} aposta{apostasPendentesAntigas > 1 ? "s" : ""} pendente{apostasPendentesAntigas > 1 ? "s" : ""} há mais de 3 dias.
            </p>
            <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-0.5">Finalize-as para atualizar seu saldo.</p>
          </div>
          <Link href="/apostas?status=pendente" className="flex-shrink-0 text-xs font-medium text-yellow-700 dark:text-yellow-300 underline underline-offset-2 hover:opacity-80 transition-opacity">
            Ver pendentes
          </Link>
        </div>
      )}

      {/* Financial Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryStats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-xl border ${border} bg-[var(--bg-surface)] p-4`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-secondary)] truncate">{label}</p>
                <p className={`text-sm font-bold ${color} truncate`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Apostas Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {apostasStats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-xl border ${border} bg-[var(--bg-surface)] p-4`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-2 ${bg} rounded-lg flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-secondary)] truncate">{label}</p>
                <p className={`text-sm font-bold ${color} truncate`}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Resumo Financeiro */}
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
              { label: "Lucro", value: formatCurrency(dashboard?.lucro_realizado ?? 0), cls: "text-green-500" },
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

      {/* Financeiro Recente */}
      {recentMovimentacoes.length > 0 && (() => {
        const items: MovimentacaoItem[] = recentMovimentacoes.map(mov => ({
          id: mov.id,
          created_at: mov.created_at,
          tipo: mov.tipo,
          valor: mov.valor,
          betNome: mov.profile_bet?.bet?.nome ?? null,
          descricao: mov.descricao ?? null,
          profileNome: mov.profile
            ? (mov.profile.apelido || `${mov.profile.nome} ${mov.profile.sobrenome}`)
            : null,
        }))
        return (
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">Financeiro Recente</h2>
            <Card>
              <CardContent className="p-0 divide-y divide-[var(--border)]">
                {items.map(item => (
                  <MovimentacaoRow key={item.id} item={item} />
                ))}
              </CardContent>
            </Card>
            <div className="mt-3 flex justify-end">
              <Link href="/financeiro" className="text-xs text-[var(--accent-text)] hover:underline flex items-center gap-1">
                Saiba Mais <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )
      })()}

      {/* Perfis */}
      {profiles.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Perfis</h2>
            <Link href="/perfis" className="text-xs text-[var(--accent-text)] hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map(p => (
              <Link
                key={p.profile_id}
                href={`/perfis/${p.profile_id}`}
                className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--border-subtle)] hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="bg-[#1e3a8a]/20 text-[var(--accent-text)] text-sm font-bold">
                      {p.nome.charAt(0)}{p.sobrenome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.apelido ?? `${p.nome} ${p.sobrenome}`}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{p.total_apostas} aposta{p.total_apostas !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Saldo</p>
                    <p className="text-xs font-bold text-[#3b82f6] truncate">{formatCurrency(p.saldo_total)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Lucro</p>
                    <p className={`text-xs font-bold truncate ${p.lucro_realizado >= 0 ? "text-green-500" : "text-red-500"}`}>{formatCurrency(p.lucro_realizado)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">ROI</p>
                    <p className={`text-xs font-bold truncate ${p.roi_percentual >= 0 ? "text-[#a855f7]" : "text-red-500"}`}>{parseFloat(String(p.roi_percentual)).toFixed(1)}%</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Apostas Recentes */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide mb-4">Apostas Recentes</h2>

        {recentApostas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-[var(--text-secondary)]">Nenhuma aposta registrada</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop cards */}
            <div className="hidden md:block space-y-3">
              {recentApostas.map(aposta => (
                <ApostaDesktopCard
                  key={aposta.id}
                  aposta={aposta}
                  statusBadge={statusBadge}
                  detectGreen={detectGreenLegId as any}
                />
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {recentApostas.map(aposta => (
                <ApostaMobileCard
                  key={aposta.id}
                  aposta={aposta as any}
                  statusBadge={statusBadge}
                  detectGreen={detectGreenLegId as any}
                  showProfile
                />
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <Link href="/apostas" className="text-xs text-[var(--accent-text)] hover:underline flex items-center gap-1">
                Ver Apostas <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
