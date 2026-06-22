"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Eye, EyeOff, Loader2, Trash2, Search, X, PlusCircle } from "lucide-react"
import type { Bet, ProfileBet } from "@/lib/types"

interface Props {
  profileId: string
  userToken?: string
}

type ProfileBetWithBet = ProfileBet & { bet?: { nome: string }; ativo: boolean }

export default function AddBetToProfile({ profileId }: Props) {
  const [bets, setBets] = useState<Bet[]>([])
  const [profileBets, setProfileBets] = useState<ProfileBetWithBet[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedBet, setSelectedBet] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({})
  const [betSearch, setBetSearch] = useState("")
  const [betDropdownOpen, setBetDropdownOpen] = useState(false)
  const [deletarDialog, setDeletarDialog] = useState<ProfileBetWithBet | null>(null)
  const [deletando, setDeletando] = useState(false)
  const [saldoNaoZeradoDialog, setSaldoNaoZeradoDialog] = useState<ProfileBetWithBet | null>(null)
  const [ativoDialog, setAtivoDialog] = useState<ProfileBetWithBet | null>(null)
  const [togglingAtivo, setTogglingAtivo] = useState(false)
  // Movimentação
  const [movDialog, setMovDialog] = useState<ProfileBetWithBet | null>(null)
  const [movTipo, setMovTipo] = useState<"deposito" | "saque">("deposito")
  const [movValor, setMovValor] = useState("")
  const [movDescricao, setMovDescricao] = useState("")
  const [movSaving, setMovSaving] = useState(false)

  const betSearchRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const loadData = useCallback(async function loadData() {
    const [betsRes, pbRes] = await Promise.all([
      supabase.from("bets").select("*").order("nome"),
      supabase.from("profile_bets").select("*, bet:bets(nome)").eq("profile_id", profileId),
    ])
    if (betsRes.data) setBets(betsRes.data)
    if (pbRes.data) setProfileBets(pbRes.data as ProfileBetWithBet[])
  }, [profileId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  function formatBRL(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function parseBRL(v: string) {
    return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBet || !email || !senha) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" })
      return
    }
    if (profileBets.some(pb => pb.bet_id === selectedBet)) {
      toast({ title: "Esta casa já foi adicionada a este perfil", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from("profile_bets").insert({
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

  async function handleDelete() {
    if (!deletarDialog) return
    if (deletarDialog.saldo !== 0) {
      setDeletarDialog(null)
      setSaldoNaoZeradoDialog(deletarDialog)
      return
    }
    setDeletando(true)
    const { error } = await supabase.from("profile_bets").delete().eq("id", deletarDialog.id)
    if (error) {
      toast({ title: "Erro ao remover", variant: "destructive" })
    } else {
      setProfileBets(prev => prev.filter(pb => pb.id !== deletarDialog.id))
      toast({ title: "Casa de apostas removida" })
      setDeletarDialog(null)
    }
    setDeletando(false)
  }

  async function handleToggleAtivo() {
    if (!ativoDialog) return
    setTogglingAtivo(true)
    const novoAtivo = !ativoDialog.ativo
    const { error } = await supabase.from("profile_bets").update({ ativo: novoAtivo }).eq("id", ativoDialog.id)
    if (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" })
    } else {
      setProfileBets(prev => prev.map(pb => pb.id === ativoDialog.id ? { ...pb, ativo: novoAtivo } : pb))
      toast({ title: novoAtivo ? "Casa ativada" : "Casa desativada" })
      setAtivoDialog(null)
    }
    setTogglingAtivo(false)
  }

  async function handleMovSave() {
    if (!movDialog) return
    const valor = parseBRL(movValor)
    if (!valor || valor <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" })
      return
    }
    setMovSaving(true)
    const { error } = await supabase.from("movimentacoes_financeiras").insert({
      profile_id: profileId,
      profile_bet_id: movDialog.id,
      tipo: movTipo,
      valor,
      descricao: movDescricao.trim() || null,
    })
    if (error) {
      toast({ title: "Erro ao registrar movimentação", variant: "destructive" })
    } else {
      // Atualiza saldo local: deposito soma, saque subtrai
      const delta = movTipo === "deposito" ? valor : -valor
      setProfileBets(prev => prev.map(pb =>
        pb.id === movDialog.id ? { ...pb, saldo: pb.saldo + delta } : pb
      ))
      // Persiste saldo no DB
      await supabase
        .from("profile_bets")
        .update({ saldo: movDialog.saldo + delta })
        .eq("id", movDialog.id)
      toast({ title: "Movimentação registrada!" })
      setMovDialog(null)
      setMovTipo("deposito")
      setMovValor("")
      setMovDescricao("")
    }
    setMovSaving(false)
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

      {/* Dialog Adicionar */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setSelectedBet(""); setEmail(""); setSenha(""); setBetSearch(""); setBetDropdownOpen(false) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Casa de Apostas</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Casa de Apostas *</Label>
              <div className="relative">
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
                {betDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg">
                    {bets.filter(b => b.nome.toLowerCase().includes(betSearch.toLowerCase())).length === 0 ? (
                      <p className="text-sm text-[var(--text-muted)] text-center py-4">Nenhuma casa encontrada</p>
                    ) : (
                      bets.filter(b => b.nome.toLowerCase().includes(betSearch.toLowerCase())).map(b => (
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

      {/* Dialog Nova Movimentação */}
      <Dialog open={!!movDialog} onOpenChange={open => { if (!open) { setMovDialog(null); setMovTipo("deposito"); setMovValor(""); setMovDescricao("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Movimentação — {movDialog?.bet?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={movTipo} onValueChange={v => setMovTipo(v as "deposito" | "saque")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposito">Depósito</SelectItem>
                    <SelectItem value="saque">Saque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input placeholder="0,00" value={movValor} onChange={e => setMovValor(formatBRL(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Input placeholder="Ex: Depósito inicial" value={movDescricao} onChange={e => setMovDescricao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovDialog(null)}>Cancelar</Button>
            <Button onClick={handleMovSave} disabled={movSaving}>
              {movSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Deletar */}
      <Dialog open={!!deletarDialog} onOpenChange={open => !open && setDeletarDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Casa de Apostas</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Tem certeza que deseja remover <strong className="text-[var(--text-primary)]">{deletarDialog?.bet?.nome}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletarDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletando}>
              {deletando ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Saldo não zerado */}
      <Dialog open={!!saldoNaoZeradoDialog} onOpenChange={open => !open && setSaldoNaoZeradoDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Não é possível remover</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            A casa <strong className="text-[var(--text-primary)]">{saldoNaoZeradoDialog?.bet?.nome}</strong> ainda possui saldo de{" "}
            <strong className="text-[var(--text-primary)]">{formatCurrency(saldoNaoZeradoDialog?.saldo ?? 0)}</strong>.
            Realize um saque para zerar o saldo antes de remover a casa de apostas.
          </p>
          <DialogFooter>
            <Button onClick={() => setSaldoNaoZeradoDialog(null)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ativo/Inativo */}
      <Dialog open={!!ativoDialog} onOpenChange={open => !open && setAtivoDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ativoDialog?.ativo ? "Desativar" : "Ativar"} Casa de Apostas</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--text-secondary)]">
            Tem certeza que deseja {ativoDialog?.ativo ? "desativar" : "ativar"} a casa{" "}
            <strong className="text-[var(--text-primary)]">{ativoDialog?.bet?.nome}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAtivoDialog(null)}>Cancelar</Button>
            <Button
              onClick={handleToggleAtivo}
              disabled={togglingAtivo}
              className={ativoDialog?.ativo ? "bg-[#DC2626] hover:bg-[#B91C1C] text-white" : "bg-[#16A34A] hover:bg-[#15803D] text-white"}
            >
              {togglingAtivo ? "Salvando..." : ativoDialog?.ativo ? "Desativar" : "Ativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {profileBets.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] text-center py-6">Nenhuma casa de apostas adicionada</p>
      ) : (
        <div className="space-y-3">
          {profileBets.map(pb => (
            <Card key={pb.id} className={!pb.ativo ? "opacity-60" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-[var(--text-primary)]">{pb.bet?.nome ?? "Casa"}</p>
                      <Badge variant="blue">{formatCurrency(pb.saldo)}</Badge>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pb.ativo ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pb.ativo ? "bg-green-500" : "bg-red-500"}`} />
                        {pb.ativo ? "Ativa" : "Inativa"}
                      </span>
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
                      onClick={() => setAtivoDialog(pb)}
                      className={pb.ativo ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                    >
                      {pb.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletarDialog(pb)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Nova movimentação */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-[#16A34A] border-[#16A34A]/30 hover:bg-[#16A34A]/5"
                  onClick={() => { setMovDialog(pb); setMovTipo("deposito"); setMovValor(""); setMovDescricao("") }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nova movimentação
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
