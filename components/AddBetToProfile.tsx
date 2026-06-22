"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Eye, EyeOff, Loader2, Trash2, Search, X } from "lucide-react"
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
  const [loading, setLoading] = useState(false)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({})
  const [betSearch, setBetSearch] = useState("")
  const [betDropdownOpen, setBetDropdownOpen] = useState(false)
  const betSearchRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const loadData = useCallback(async function loadData() {
    const [betsRes, pbRes] = await Promise.all([
      supabase.from("bets").select("*").order("nome"),
      supabase.from("profile_bets").select("*, bet:bets(nome)").eq("profile_id", profileId),
    ])
    if (betsRes.data) setBets(betsRes.data)
    if (pbRes.data) setProfileBets(pbRes.data as (ProfileBet & { bet?: { nome: string } })[])
  }, [profileId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

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
          saldo: 0,
        })

      if (error) throw new Error(error.message)

      toast({ title: "Casa de apostas adicionada com sucesso!" })
      setShowForm(false)
      setSelectedBet("")
      setEmail("")
      setSenha("")
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
        <Button size="sm" onClick={() => { setShowForm(true); setSelectedBet(""); setEmail(""); setSenha("") }}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setSelectedBet(""); setEmail(""); setSenha(""); setBetSearch(""); setBetDropdownOpen(false) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Casa de Apostas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Casa de Apostas *</Label>
              <div className="relative">
                {/* Selected display / search input */}
                {selectedBet && !betDropdownOpen ? (
                  <div className="flex items-center justify-between h-10 px-3 rounded-md border border-[var(--border)] bg-[var(--bg-surface)]">
                    <span className="text-sm text-[var(--text-primary)]">
                      {bets.find(b => b.id === selectedBet)?.nome}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setSelectedBet(""); setBetSearch(""); setBetDropdownOpen(true); setTimeout(() => betSearchRef.current?.focus(), 50) }}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <Input
                      ref={betSearchRef}
                      className="pl-9"
                      placeholder="Buscar casa de apostas..."
                      value={betSearch}
                      onChange={e => { setBetSearch(e.target.value); setBetDropdownOpen(true) }}
                      onFocus={() => setBetDropdownOpen(true)}
                      autoComplete="off"
                    />
                  </div>
                )}

                {/* Dropdown list */}
                {betDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg">
                    {bets.filter(b => b.nome.toLowerCase().includes(betSearch.toLowerCase())).length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] text-center py-4">Nenhuma casa encontrada</p>
                    ) : (
                      bets
                        .filter(b => b.nome.toLowerCase().includes(betSearch.toLowerCase()))
                        .map(b => (
                          <button
                            key={b.id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                            onClick={() => { setSelectedBet(b.id); setBetSearch(""); setBetDropdownOpen(false) }}
                          >
                            {b.nome}
                          </button>
                        ))
                    )}
                  </div>
                )}
              </div>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
