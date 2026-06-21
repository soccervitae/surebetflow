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
import { ArrowLeft, DollarSign, TrendingUp, Clock, ArrowUpRight, Pencil } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
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
  const [finalizarDialog, setFinalizarDialog] = useState<Aposta | null>(null)
  const [resultadoReal, setResultadoReal] = useState("")
  const [finalizando, setFinalizando] = useState(false)
  const { toast } = useToast()
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

  async function handleFinalizar() {
    if (!finalizarDialog) return
    setFinalizando(true)
    const valor = parseFloat(resultadoReal)
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
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {currentProfile.nome} {currentProfile.sobrenome}
            </h1>
            {currentProfile.apelido && (
              <p className="text-sm text-gray-500">{currentProfile.apelido}</p>
            )}
          </div>
        </div>
        <Link href={`/perfis/${profile.id}/editar`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </Link>
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
                    <p className="text-xs text-gray-500">Saldo Total</p>
                    <p className="text-base font-bold text-gray-900 truncate">{formatCurrency(dashboard?.saldo_total ?? 0)}</p>
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
                    <p className="text-xs text-gray-500">Lucro Pendente</p>
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
                    <p className="text-xs text-gray-500">ROI</p>
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
              <CardContent className="py-12 text-center text-gray-500">
                Nenhuma aposta registrada para este perfil
              </CardContent>
            </Card>
          ) : (
            currentApostas.map(aposta => (
              <Card key={aposta.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 truncate">{aposta.evento}</p>
                        {statusBadge(aposta.status)}
                        <Badge variant="secondary">{aposta.tipo}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
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
                          onClick={() => { setFinalizarDialog(aposta); setResultadoReal(aposta.lucro_garantido.toString()) }}
                        >
                          Finalizar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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

      {/* Finalizar Dialog */}
      <Dialog open={!!finalizarDialog} onOpenChange={open => !open && setFinalizarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Aposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Informe o resultado real obtido para a aposta <strong>{finalizarDialog?.evento}</strong>.
            </p>
            <div className="space-y-2">
              <Label>Resultado real (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={resultadoReal}
                onChange={e => setResultadoReal(e.target.value)}
                placeholder="Ex: 25.50"
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
