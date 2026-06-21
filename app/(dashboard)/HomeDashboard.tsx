"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, Clock, Calculator, ArrowUpRight } from "lucide-react"
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

export default function HomeDashboard({ dashboard, profiles, recentApostas, apostasFinalizadas }: Props) {
  // Build cumulative profit chart data
  let cumulative = 0
  const chartData = apostasFinalizadas.map(a => {
    cumulative += a.resultado_real ?? a.lucro_garantido
    return {
      date: a.finalizada_at ? new Date(a.finalizada_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "",
      lucro: parseFloat(cumulative.toFixed(2)),
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Geral</h1>
          <p className="text-gray-500 text-sm mt-1">Visão consolidada de todos os seus perfis</p>
        </div>
        <Link href="/calculadora">
          <Button>
            <Calculator className="h-4 w-4 mr-2" />
            Calculadora
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2563EB]/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Saldo Total</p>
                <p className="text-lg font-bold text-gray-900 truncate">{formatCurrency(dashboard?.saldo_total ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#16A34A]/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-[#16A34A]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Lucro Realizado</p>
                <p className="text-lg font-bold text-[#16A34A] truncate">{formatCurrency(dashboard?.lucro_realizado ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Lucro Pendente</p>
                <p className="text-lg font-bold text-yellow-600 truncate">{formatCurrency(dashboard?.lucro_pendente ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowUpRight className="h-5 w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">ROI</p>
                <p className="text-lg font-bold text-purple-600 truncate">{(dashboard?.roi_percentual ?? 0).toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lucro Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: unknown) => [formatCurrency(v as number), "Lucro"]} />
                <Line type="monotone" dataKey="lucro" stroke="#16A34A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profiles */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Perfis</CardTitle>
              <Link href="/perfis" className="text-sm text-[#16A34A] hover:underline">Ver todos</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {profiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum perfil encontrado</p>
            ) : (
              profiles.map(p => (
                <Link key={p.profile_id} href={`/perfis/${p.profile_id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Avatar className="h-9 w-9">
                    {p.foto_url && <AvatarImage src={p.foto_url} />}
                    <AvatarFallback className="text-sm">
                      {p.nome.charAt(0)}{p.sobrenome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.nome} {p.sobrenome}</p>
                    {p.apelido && <p className="text-xs text-gray-500 truncate">{p.apelido}</p>}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(p.saldo_total)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Apostas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Apostas Recentes</CardTitle>
              <Link href="/apostas" className="text-sm text-[#16A34A] hover:underline">Ver todas</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentApostas.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma aposta encontrada</p>
            ) : (
              recentApostas.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center gap-3 p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.evento}</p>
                    <p className="text-xs text-gray-500">
                      {a.profile ? `${a.profile.nome} ${a.profile.sobrenome}` : "—"} · {new Date(a.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {statusBadge(a.status)}
                    <p className="text-xs text-[#16A34A] mt-1">{formatCurrency(a.lucro_garantido)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
