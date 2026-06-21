"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Plus, Eye, EyeOff, Loader2 } from "lucide-react"
import type { Bet, ProfileBet } from "@/lib/types"

interface Props {
  profileId: string
  userToken: string
}

export default function AddBetToProfile({ profileId, userToken }: Props) {
  const [bets, setBets] = useState<Bet[]>([])
  const [profileBets, setProfileBets] = useState<ProfileBet[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedBet, setSelectedBet] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [saldo, setSaldo] = useState("")
  const [loading, setLoading] = useState(false)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({})
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [profileId])

  async function loadData() {
    const [betsRes, pbRes] = await Promise.all([
      supabase.from("bets").select("*").order("nome"),
      supabase.from("profile_bets").select("*, bet:bets(*)").eq("profile_id", profileId),
    ])
    if (betsRes.data) setBets(betsRes.data)
    if (pbRes.data) setProfileBets(pbRes.data as ProfileBet[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBet || !email || !senha) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const response = await fetch("https://gkkuttabavwxjuibmrnr.supabase.co/functions/v1/add-profile-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          profile_id: profileId,
          bet_id: selectedBet,
          email,
          senha,
          saldo: parseFloat(saldo) || 0,
        }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Erro ao adicionar casa de apostas")
      }
      toast({ title: "Casa de apostas adicionada com sucesso!" })
      setShowForm(false)
      setSelectedBet("")
      setEmail("")
      setSenha("")
      setSaldo("")
      await loadData()
    } catch (err: unknown) {
      toast({ title: (err as Error)?.message ?? "Erro ao adicionar", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleReveal(profileBetId: string) {
    if (revealedPasswords[profileBetId]) {
      setRevealedPasswords(prev => {
        const copy = { ...prev }
        delete copy[profileBetId]
        return copy
      })
      return
    }
    setRevealingId(profileBetId)
    try {
      const response = await fetch("https://gkkuttabavwxjuibmrnr.supabase.co/functions/v1/reveal-profile-bet-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ profile_bet_id: profileBetId }),
      })
      if (!response.ok) throw new Error("Erro ao revelar senha")
      const data = await response.json()
      setRevealedPasswords(prev => ({ ...prev, [profileBetId]: data.senha }))
    } catch {
      toast({ title: "Erro ao revelar senha", variant: "destructive" })
    } finally {
      setRevealingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Casas de Apostas</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Casa de Apostas *</Label>
                <Select value={selectedBet} onValueChange={setSelectedBet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar casa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bets.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>E-mail da conta *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@casa.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <Input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha da conta" />
              </div>
              <div className="space-y-2">
                <Label>Saldo inicial</Label>
                <Input type="number" step="0.01" min="0" value={saldo} onChange={e => setSaldo(e.target.value)} placeholder="0,00" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {profileBets.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">Nenhuma casa de apostas adicionada</p>
      ) : (
        <div className="space-y-3">
          {profileBets.map(pb => (
            <Card key={pb.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{(pb as ProfileBet & { bet?: { nome: string } }).bet?.nome ?? "Casa"}</p>
                      <Badge variant="blue">{formatCurrency(pb.saldo)}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{pb.email}</p>
                    {revealedPasswords[pb.id] && (
                      <p className="text-sm font-mono bg-gray-100 rounded px-2 py-1 mt-2 text-gray-700">
                        {revealedPasswords[pb.id]}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReveal(pb.id)}
                    disabled={revealingId === pb.id}
                  >
                    {revealingId === pb.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : revealedPasswords[pb.id] ? (
                      <><EyeOff className="h-4 w-4 mr-1" />Ocultar</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-1" />Ver senha</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
