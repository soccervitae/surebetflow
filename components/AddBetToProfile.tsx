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
import { Plus, Eye, EyeOff, Loader2, Trash2 } from "lucide-react"
import type { Bet, ProfileBet } from "@/lib/types"

interface Props {
  profileId: string
  userToken?: string
}

export default function AddBetToProfile({ profileId }: Props) {
  const [bets, setBets] = useState<Bet[]>([])
  const [profileBets, setProfileBets] = useState<(ProfileBet & { bet?: { nome: string } })[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedBet, setSelectedBet] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [showSenha, setShowSenha] = useState(false)
  const [saldo, setSaldo] = useState("")
  const [loading, setLoading] = useState(false)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const supabase = createClient()

  function formatBRL(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function parseBRL(formatted: string) {
    return parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0
  }

  useEffect(() => {
    loadData()
  }, [profileId])

  async function loadData() {
    const [betsRes, pbRes] = await Promise.all([
      supabase.from("bets").select("*").order("nome"),
      supabase.from("profile_bets").select("*, bet:bets(nome)").eq("profile_id", profileId),
    ])
    if (betsRes.data) setBets(betsRes.data)
    if (pbRes.data) setProfileBets(pbRes.data as (ProfileBet & { bet?: { nome: string } })[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBet || !email || !senha) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase
        .from("profile_bets")
        .insert({
          profile_id: profileId,
          bet_id: selectedBet,
          email,
          senha_encrypted: senha,
          senha_nonce: "",
          saldo: parseBRL(saldo),
        })

      if (error) throw new Error(error.message)

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

  async function handleDelete(id: string) {
    const { error } = await supabase.from("profile_bets").delete().eq("id", id)
    if (error) {
      toast({ title: "Erro ao remover", variant: "destructive" })
    } else {
      setProfileBets(prev => prev.filter(pb => pb.id !== id))
      toast({ title: "Casa de apostas removida" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[var(--text-primary)]">Casas de Apostas</h3>
        <Button size="sm" onClick={() => { setShowForm(v => !v); setSelectedBet(""); setEmail(""); setSenha(""); setSaldo("") }}>
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
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@casa.com" autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <div className="relative">
                  <Input
                    type={showSenha ? "text" : "password"}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="Senha da conta"
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    tabIndex={-1}
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Saldo inicial (R$)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={saldo}
                  onChange={e => setSaldo(formatBRL(e.target.value))}
                  placeholder="0,00"
                />
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
        <p className="text-sm text-[var(--text-secondary)] text-center py-6">Nenhuma casa de apostas adicionada</p>
      ) : (
        <div className="space-y-3">
          {profileBets.map(pb => (
            <Card key={pb.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[var(--text-primary)]">{pb.bet?.nome ?? "Casa"}</p>
                      <Badge variant="blue">{formatCurrency(pb.saldo)}</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] truncate mt-0.5">{pb.email}</p>
                    {revealedPasswords[pb.id] && (
                      <p className="text-sm font-mono bg-[var(--bg-elevated)] rounded px-2 py-1 mt-2 text-[var(--text-primary)] break-all">
                        {pb.senha_encrypted}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevealedPasswords(prev =>
                        prev[pb.id] ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== pb.id)) : { ...prev, [pb.id]: true }
                      )}
                    >
                      {revealedPasswords[pb.id]
                        ? <><EyeOff className="h-4 w-4 mr-1" />Ocultar</>
                        : <><Eye className="h-4 w-4 mr-1" />Ver senha</>
                      }
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(pb.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
