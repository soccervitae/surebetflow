"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ProfileForm } from "@/components/ProfileForm"
import AddBetToProfile from "@/components/AddBetToProfile"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { ArrowLeft, DollarSign, TrendingUp, Clock, ArrowUpRight, Pencil, Calculator } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import SurebetCalculator from "@/components/SurebetCalculator"
import type { Profile, ProfileDashboard, Aposta } from "@/lib/types"

interface Props {
  profile: Profile
  dashboard: ProfileDashboard | null
  apostas: Aposta[]
  userToken: string
}

function statusBadge(status: string) {
  switch (status) {
    case "finalizada": return <Badge variant="default">Finalizada</Badge>
    case "cancelada": return <Badge variant="destructive">Cancelada</Badge>
    default: return <Badge variant="yellow">Pendente</Badge>
  }
}

export default function PerfilDetailClient({ profile, dashboard, apostas, userToken }: Props) {
  const [currentProfile, setCurrentProfile] = useState(profile)
  const [currentApostas, setCurrentApostas] = useState(apostas)
  const [showCalculadora, setShowCalculadora] = useState(false)
  const [finalizarDialog, setFinalizarDialog] = useState<Aposta | null>(null)
  const [periodoFiltro, setPeriodoFiltro] = useState<"semana" | "mes" | "ano">("semana")
  const [casaFiltro, setCasaFiltro] = useState<string>("todas")
  const [resultadoReal, setResultadoReal] = useState("")
  const [finalizando, setFinalizando] = useState(false)
  const { toast } = useToast()

  function formatBRL(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function parseBRL(formatted: string) {
    return parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0
  }
  const supabase = createClient()

  // Chart data
  const apostasFinalizadas = currentApostas
    .filter(a => a.status === "finalizada")
    .sort((a, b) => new Date(a.finalizada_at!).getTime() - new Date(b.finalizada_at!).getTime())

  let cumulative = 0
  const chartData = apostasFinalizadas.map(a => {
    cumulative += a.resultado_real ?? a.lucro_garantido
    return {
      date: new Date(a.finalizada_at!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      lucro: parseFloat(cumulative.toFixed(2)),
    }
  })

  // Casas únicas extraídas das legs de todas as apostas
  const casasUnicas = Array.from(
    new Map(
      currentApostas.flatMap(a =>
        (a as Aposta & { legs?: { profile_bet?: { id: string; bet?: { id: string; nome: string } } }[] }).legs ?? []
      )
        .filter(l => l.profile_bet?.bet)
        .map(l => [l.profile_bet!.bet!.id, { id: l.profile_bet!.bet!.id, nome: l.profile_bet!.bet!.nome }])
    ).values()
  )

  // Filtro de período + casa
  const now = new Date()
  const apostasFiltradasPeriodo = currentApostas.filter(a => {
    const date = new Date(a.created_at)
    const passaPeriodo = (() => {
      if (periodoFiltro === "semana") {
        const semanaAtras = new Date(now)
        semanaAtras.setDate(now.getDate() - 7)
        return date >= semanaAtras
      }
      if (periodoFiltro === "mes") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }
      return date.getFullYear() === now.getFullYear()
    })()
    if (!passaPeriodo) return false
    if (casaFiltro === "todas") return true
    const legs = (a as Aposta & { legs?: { profile_bet?: { bet?: { id: string } } }[] }).legs ?? []
    return legs.some(l => l.profile_bet?.bet?.id === casaFiltro)
  })

  async function handleFinalizar() {
    if (!finalizarDialog) return
    setFinalizando(true)
    const valor = parseBRL(resultadoReal)
    if (isNaN(valor)) {
      toast({ title: "Valor inválido", variant: "destructive" })
      setFinalizando(false)
      return
    }
    const { error } = await supabase
      .from("apostas")
      .update({
        status: "finalizada",
        resultado_real: valor,
        finalizada_at: new Date().toISOString(),
      })
      .eq("id", finalizarDialog.id)

    if (error) {
      toast({ title: "Erro ao finalizar aposta", variant: "destructive" })
    } else {
      setCurrentApostas(prev =>
        prev.map(a => a.id === finalizarDialog.id
          ? { ...a, status: "finalizada" as const, resultado_real: valor, finalizada_at: new Date().toISOString() }
          : a
        )
      )
      toast({ title: "Aposta finalizada com sucesso!" })
      setFinalizarDialog(null)
      setResultadoReal("")
    }
    setFinalizando(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/perfis">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-12 w-12">
            {currentProfile.foto_url && <AvatarImage src={currentProfile.foto_url} />}
            <AvatarFallback>
              {currentProfile.nome.charAt(0)}{currentProfile.sobrenome.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">
              {currentProfile.nome} {currentProfile.sobrenome}
            </h1>
            {currentProfile.apelido && (
              <p className="text-sm text-[var(--text-secondary)]">{currentProfile.apelido}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCalculadora(true)} size="sm">
            <Calculator className="h-4 w-4 mr-2" />
            Nova Aposta
          </Button>
          <Link href={`/perfis/${profile.id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="casas">Casas de Apostas</TabsTrigger>
          <TabsTrigger value="apostas">Apostas</TabsTrigger>
          <TabsTrigger value="editar">Editar</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#2563EB]/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)]">Saldo Total</p>
                    <p className="text-base font-bold text-[var(--text-primary)] truncate">{formatCurrency(dashboard?.saldo_total ?? 0)}</p>
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
                    <p className="text-xs text-[var(--text-secondary)]">Lucro Realizado</p>
                    <p className="text-base font-bold text-[#16A34A] truncate">{formatCurrency(dashboard?.lucro_realizado ?? 0)}</p>
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
                    <p className="text-xs text-[var(--text-secondary)]">Lucro Pendente</p>
                    <p className="text-base font-bold text-yellow-600 truncate">{formatCurrency(dashboard?.lucro_pendente ?? 0)}</p>
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
                    <p className="text-xs text-[var(--text-secondary)]">ROI</p>
                    <p className="text-base font-bold text-purple-600 truncate">{(dashboard?.roi_percentual ?? 0).toFixed(2)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lucro Acumulado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)" }}
                      formatter={(v: unknown) => [formatCurrency(v as number), "Lucro"]}
                    />
                    <Line type="monotone" dataKey="lucro" stroke="#16A34A" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Apostas do período */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Apostas</h2>
              <div className="flex flex-wrap items-center gap-2">
                {casasUnicas.length > 0 && (
                  <select
                    value={casaFiltro}
                    onChange={e => setCasaFiltro(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs"
                  >
                    <option value="todas">Todas as casas</option>
                    {casasUnicas.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                )}
                <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1">
                  {(["semana", "mes", "ano"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriodoFiltro(p)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        periodoFiltro === p
                          ? "bg-[var(--bg-surface)] text-[#16A34A] shadow-sm border border-[var(--border)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Ano"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {apostasFiltradasPeriodo.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-[var(--text-secondary)] text-sm">
                  Nenhuma aposta registrada neste período
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {apostasFiltradasPeriodo.map(aposta => (
                  <Link key={aposta.id} href={`/apostas/${aposta.id}`}>
                    <Card className="hover:border-[#16A34A]/40 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-[var(--text-primary)] text-sm truncate">{aposta.evento}</p>
                              {statusBadge(aposta.status)}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                              {new Date(aposta.created_at).toLocaleDateString("pt-BR")} · {aposta.tipo} · ROI {aposta.roi_percentual.toFixed(2)}%
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-bold ${aposta.status === "finalizada" ? "text-[#16A34A]" : "text-yellow-500"}`}>
                              {formatCurrency(aposta.status === "finalizada" ? (aposta.resultado_real ?? aposta.lucro_garantido) : aposta.lucro_garantido)}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">{formatCurrency(aposta.investimento_total)} investido</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Casas Tab */}
        <TabsContent value="casas">
          <Card>
            <CardContent className="p-6">
              <AddBetToProfile profileId={profile.id} userToken={userToken} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apostas Tab */}
        <TabsContent value="apostas" className="space-y-3">
          {currentApostas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-[var(--text-secondary)]">
                Nenhuma aposta registrada para este perfil
              </CardContent>
            </Card>
          ) : (
            currentApostas.map(aposta => (
              <Link key={aposta.id} href={`/apostas/${aposta.id}`}>
              <Card className="hover:border-[#16A34A]/40 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-[var(--text-primary)] truncate">{aposta.evento}</p>
                        {statusBadge(aposta.status)}
                        <Badge variant="secondary">{aposta.tipo}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {new Date(aposta.created_at).toLocaleDateString("pt-BR")} ·
                        Investimento: {formatCurrency(aposta.investimento_total)} ·
                        ROI: {aposta.roi_percentual.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {aposta.status === "finalizada" ? (
                        <p className="text-sm font-bold text-[#16A34A]">{formatCurrency(aposta.resultado_real ?? aposta.lucro_garantido)}</p>
                      ) : (
                        <p className="text-sm font-bold text-yellow-600">{formatCurrency(aposta.lucro_garantido)}</p>
                      )}
                      {aposta.status === "pendente" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={e => { e.preventDefault(); setFinalizarDialog(aposta); setResultadoReal(formatBRL((aposta.lucro_garantido * 100).toFixed(0))) }}
                        >
                          Finalizar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            ))
          )}
        </TabsContent>

        {/* Editar Tab */}
        <TabsContent value="editar">
          <Card>
            <CardContent className="p-6">
              <ProfileForm
                profile={currentProfile}
                userId={currentProfile.user_id}
                onSuccess={(updated) => {
                  setCurrentProfile(updated)
                  toast({ title: "Perfil atualizado com sucesso!" })
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calculadora Dialog */}
      <Dialog open={showCalculadora} onOpenChange={setShowCalculadora}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#16A34A]" />
              Nova Aposta — {currentProfile.apelido ?? `${currentProfile.nome} ${currentProfile.sobrenome}`}
            </DialogTitle>
          </DialogHeader>
          <SurebetCalculator
            profiles={[currentProfile]}
            defaultProfileId={currentProfile.id}
            onSaved={async () => {
              setShowCalculadora(false)
              const supabase = createClient()
              const { data } = await supabase
                .from("apostas")
                .select("*, legs:aposta_legs(*, profile_bet:profile_bets(*, bet:bets(*)))")
                .eq("profile_id", currentProfile.id)
                .order("created_at", { ascending: false })
              if (data) setCurrentApostas(data)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Finalizar Dialog */}
      <Dialog open={!!finalizarDialog} onOpenChange={open => !open && setFinalizarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Informe o resultado real obtido para a aposta <strong>{finalizarDialog?.evento}</strong>.
            </p>
            <div className="space-y-2">
              <Label>Resultado real (R$)</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={resultadoReal}
                onChange={e => setResultadoReal(formatBRL(e.target.value))}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizarDialog(null)}>Cancelar</Button>
            <Button onClick={handleFinalizar} disabled={finalizando}>
              {finalizando ? "Finalizando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
