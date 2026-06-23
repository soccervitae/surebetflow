"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Eye, EyeOff, Loader2, Trash2, Search, Check, PlusCircle, MoreVertical } from "lucide-react"
import type { Bet, ProfileBet } from "@/lib/types"

interface Props {
  profileId: string
  userToken?: string
}

type ProfileBetWithBet = ProfileBet & { bet?: { nome: string; logo_url?: string | null }; ativo: boolean }

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
  const [deletarDialog, setDeletarDialog] = useState<ProfileBetWithBet | null>(null)
  const [deletando, setDeletando] = useState(false)
  const [saldoNaoZeradoDialog, setSaldoNaoZeradoDialog] = useState<ProfileBetWithBet | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [ativoDialog, setAtivoDialog] = useState<ProfileBetWithBet | null>(null)
  const [togglingAtivo, setTogglingAtivo] = useState(false)
  // Movimentação
  const [movDialog, setMovDialog] = useState<ProfileBetWithBet | null>(null)
  const [movTipo, setMovTipo] = useState<"deposito" | "saque">("deposito")
  const [movValor, setMovValor] = useState("")
  const [movDescricao, setMovDescricao] = useState("")
  const [movSaving, setMovSaving] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  const loadData = useCallback(async function loadData() {
    const [betsRes, pbRes] = await Promise.all([
      supabase.from("bets").select("*").order("nome"),
      supabase.from("profile_bets").select("*, bet:bets(nome, logo_url)").eq("profile_id", profileId),
    ])
    if (betsRes.data) setBets(betsRes.data)
    if (pbRes.data) setProfileBets(pbRes.data as ProfileBetWithBet[])
  }, [profileId, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleLogoError(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.target as HTMLImageElement
    const src = img.src
    if (src.includes('logo.clearbit.com')) {
      const domain = src.replace('https://logo.clearbit.com/', '')
      img.onerror = () => { img.style.display = 'none' }
      img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    } else {
      img.style.display = 'none'
    }
  }

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
      // Busca saldo real calculado do banco
      const { data: movs } = await supabase
        .from("movimentacoes_financeiras")
        .select("tipo, valor")
        .eq("profile_bet_id", movDialog.id)
      const saldoReal = (movs ?? []).reduce((acc, m) => acc + (m.tipo === "deposito" ? m.valor : -m.valor), 0)
      await supabase.from("profile_bets").update({ saldo: saldoReal }).eq("id", movDialog.id)
      setProfileBets(prev => prev.map(pb => pb.id === movDialog.id ? { ...pb, saldo: saldoReal } : pb))
      toast({ title: "Movimentação registrada!" })
      setMovDialog(null)
      setMovTipo("deposito")
      setMovValor("")
      setMovDescricao("")
      router.refresh()
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
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setSelectedBet(""); setEmail(""); setSenha(""); setBetSearch("") } }}>
        <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-[var(--border)] flex-shrink-0">
            <DialogTitle>Adicionar Casa de Apostas</DialogTitle>
          </DialogHeader>

          {/* Busca */}
          <div className="px-5 pt-3 pb-2 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                className="pl-9"
                placeholder="Buscar casa de apostas..."
                value={betSearch}
                onChange={e => setBetSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Grid de bets — scrollável */}
          <div className="overflow-y-auto flex-1 px-5 pb-2">
            {(() => {
              const alreadyAdded = new Set(profileBets.map(pb => pb.bet_id))
              const filtered = bets.filter(b => b.nome.toLowerCase().includes(betSearch.toLowerCase()))
              if (filtered.length === 0) return (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">Nenhuma casa encontrada</p>
              )
              return (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-1">
                  {filtered.map(b => {
                    const added = alreadyAdded.has(b.id)
                    const selected = selectedBet === b.id
                    return (
                      <button
                        key={b.id}
                        type="button"
                        disabled={added}
                        onClick={() => setSelectedBet(selected ? "" : b.id)}
                        className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-center
                          ${added ? "opacity-40 cursor-not-allowed border-[var(--border)] bg-[var(--bg-muted)]" : selected
                            ? "border-[#1e3a8a] bg-[#1e3a8a]/5 shadow-sm"
                            : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[#1e3a8a]/40 hover:bg-[#1e3a8a]/5"
                          }`}
                      >
                        {selected && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#1e3a8a] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                        <div className="w-9 h-9 rounded-lg border border-[var(--border)] bg-white flex items-center justify-center overflow-hidden p-0.5 flex-shrink-0">
                          {b.logo_url ? (
                            <img src={b.logo_url} alt={b.nome} className="w-full h-full object-contain" onError={handleLogoError} />
                          ) : (
                            <span className="text-xs font-bold text-[var(--text-secondary)]">{b.nome.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-[10px] leading-tight text-[var(--text-primary)] font-medium line-clamp-2">{b.nome}</span>
                        {added && <span className="text-[9px] text-[var(--text-muted)]">Adicionada</span>}
                      </button>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Footer fixo — email + senha + botões */}
          <form onSubmit={handleSubmit} className="border-t border-[var(--border)] px-5 py-4 flex-shrink-0 space-y-3 bg-[var(--bg-surface)]">
            {selectedBet && (
              <p className="text-xs text-[var(--text-secondary)]">
                Casa selecionada: <strong className="text-[var(--text-primary)]">{bets.find(b => b.id === selectedBet)?.nome}</strong>
              </p>
            )}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">E-mail *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@casa.com" autoComplete="off" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Senha *</Label>
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
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading || !selectedBet}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar"}
              </Button>
            </div>
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
              className={ativoDialog?.ativo ? "bg-[#DC2626] hover:bg-[#B91C1C] text-white" : "bg-[#1e3a8a] hover:bg-[#1e40af] text-white"}
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
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Logo — hidden on mobile */}
                  {pb.bet?.logo_url ? (
                    <div className="hidden sm:flex w-9 h-9 rounded-lg border border-[var(--border)] bg-white items-center justify-center flex-shrink-0 overflow-hidden p-0.5">
                      <img src={pb.bet.logo_url} alt={pb.bet.nome} className="w-full h-full object-contain" onError={handleLogoError} />
                    </div>
                  ) : (
                    <div className="hidden sm:flex w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] items-center justify-center flex-shrink-0 text-xs font-bold text-[var(--text-secondary)]">
                      {(pb.bet?.nome ?? "?").charAt(0)}
                    </div>
                  )}

                  {/* Info — left column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[var(--text-primary)]">{pb.bet?.nome ?? "Casa"}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pb.ativo ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pb.ativo ? "bg-green-500" : "bg-red-500"}`} />
                        {pb.ativo ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                    <p className={`text-sm font-bold mt-0.5 ${pb.saldo > 0 ? "text-[var(--accent-text)]" : pb.saldo < 0 ? "text-[#DC2626]" : "text-[var(--text-secondary)]"}`}>
                      {formatCurrency(pb.saldo)}
                    </p>
                    {revealedPasswords[pb.id] && (
                      <p className="text-sm font-mono bg-[var(--bg-elevated)] rounded px-2 py-1 mt-2 text-[var(--text-primary)] break-all">
                        {pb.senha_encrypted}
                      </p>
                    )}
                  </div>

                  {/* Right: + circle button */}
                  <button
                    className="w-9 h-9 rounded-full border-2 border-[#1e3a8a]/40 flex items-center justify-center text-[var(--accent-text)] hover:bg-[#1e3a8a]/10 transition-colors flex-shrink-0"
                    onClick={() => { setMovDialog(pb); setMovTipo("deposito"); setMovValor(""); setMovDescricao("") }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  {/* Menu 3 pontos */}
                  <div className="relative flex-shrink-0">
                    <button
                      className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                      onClick={() => setMenuOpenId(menuOpenId === pb.id ? null : pb.id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpenId === pb.id && (
                      <>
                        {/* Overlay para fechar */}
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg overflow-hidden">
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                            onClick={() => {
                              setRevealedPasswords(prev =>
                                prev[pb.id] ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== pb.id)) : { ...prev, [pb.id]: true }
                              )
                              setMenuOpenId(null)
                            }}
                          >
                            {revealedPasswords[pb.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {revealedPasswords[pb.id] ? "Ocultar senha" : "Ver senha"}
                          </button>
                          <button
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--bg-elevated)] transition-colors ${pb.ativo ? "text-orange-500" : "text-green-600"}`}
                            onClick={() => { setAtivoDialog(pb); setMenuOpenId(null) }}
                          >
                            <span className={`w-2 h-2 rounded-full ${pb.ativo ? "bg-orange-400" : "bg-green-500"}`} />
                            {pb.ativo ? "Desativar" : "Ativar"}
                          </button>
                          <div className="border-t border-[var(--border)]" />
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            onClick={() => { setDeletarDialog(pb); setMenuOpenId(null) }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </button>
                        </div>
                      </>
                    )}
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
