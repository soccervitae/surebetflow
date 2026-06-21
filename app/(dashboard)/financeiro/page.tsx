"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Profile, ProfileBet, Bet } from "@/lib/types"
import { Plus, Wallet } from "lucide-react"

export default function FinanceiroPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileBets, setProfileBets] = useState<(ProfileBet & { bet: Bet })[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Array<{
    id: string; profile_id: string; profile_bet_id?: string | null; tipo: "deposito" | "saque"; valor: number; descricao?: string | null; created_at: string;
    profile?: { nome: string; sobrenome: string }; profile_bet?: { bet?: { nome: string } }
  }>>([])
  const [filterProfile, setFilterProfile] = useState("")
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formProfile, setFormProfile] = useState("")
  const [formBet, setFormBet] = useState("")
  const [formTipo, setFormTipo] = useState<"deposito" | "saque">("deposito")
  const [formValor, setFormValor] = useState("")
  const [formDescricao, setFormDescricao] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  async function load() {
    const supabase = createClient()
    const [{ data: profs }, { data: movs }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("movimentacoes_financeiras")
        .select("*, profile:profiles(nome, sobrenome), profile_bet:profile_bets(*, bet:bets(nome))")
        .order("created_at", { ascending: false })
        .limit(100),
    ])
    setProfiles(profs ?? [])
    setMovimentacoes(movs ?? [])
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!formProfile) { setProfileBets([]); setFormBet(""); return }
    const supabase = createClient()
    supabase.from("profile_bets").select("*, bet:bets(*)").eq("profile_id", formProfile).then(({ data }) => {
      setProfileBets(data ?? [])
    })
  }, [formProfile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    const val = parseFloat(formValor.replace(",", "."))
    if (isNaN(val) || val <= 0) { setFormError("Informe um valor válido."); return }
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase.from("movimentacoes_financeiras").insert({
      profile_id: formProfile,
      profile_bet_id: formBet || null,
      tipo: formTipo,
      valor: val,
      descricao: formDescricao.trim() || null,
    })

    if (error) { setFormError("Erro ao registrar movimentação."); setSaving(false); return }

    // Update saldo if bet selected
    if (formBet) {
      const { data: pb } = await supabase.from("profile_bets").select("saldo").eq("id", formBet).single()
      if (pb) {
        const newSaldo = formTipo === "deposito" ? Number(pb.saldo) + val : Number(pb.saldo) - val
        await supabase.from("profile_bets").update({ saldo: newSaldo }).eq("id", formBet)
      }
    }

    setShowForm(false)
    setFormProfile(""); setFormBet(""); setFormValor(""); setFormDescricao("")
    load()
    setSaving(false)
  }

  const filtered = movimentacoes.filter(m => {
    if (filterProfile && m.profile_id !== filterProfile) return false
    return true
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2563EB]/10 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-sm text-gray-500">Depósitos e saques por perfil</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#16A34A] hover:bg-[#15803D] text-white gap-2">
          <Plus className="w-4 h-4" /> Nova Movimentação
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Registrar Movimentação</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perfil *</Label>
                  <select className="w-full h-10 px-3 rounded-xl border border-[#E5E1D8] text-sm" value={formProfile} onChange={e => setFormProfile(e.target.value)} required>
                    <option value="">Selecione</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.nome} {p.sobrenome}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Casa de Apostas (opcional)</Label>
                  <select className="w-full h-10 px-3 rounded-xl border border-[#E5E1D8] text-sm" value={formBet} onChange={e => setFormBet(e.target.value)}>
                    <option value="">Nenhuma</option>
                    {profileBets.map(pb => <option key={pb.id} value={pb.id}>{pb.bet?.nome}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <div className="flex gap-2">
                    {(["deposito", "saque"] as const).map(t => (
                      <button key={t} type="button" onClick={() => setFormTipo(t)}
                        className={`flex-1 h-10 rounded-xl border text-sm font-medium transition-colors capitalize ${formTipo === t ? "border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]" : "border-[#E5E1D8] text-gray-600"}`}>
                        {t === "deposito" ? "Depósito" : "Saque"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" min="0.01" step="0.01" value={formValor} onChange={e => setFormValor(e.target.value)} placeholder="0.00" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input value={formDescricao} onChange={e => setFormDescricao(e.target.value)} placeholder="Ex: Depósito inicial via PIX" />
              </div>
              {formError && <p className="text-sm text-[#DC2626] bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg px-3 py-2">{formError}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="bg-[#16A34A] hover:bg-[#15803D] text-white" disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select className="h-9 px-3 rounded-xl border border-[#E5E1D8] text-sm" value={filterProfile} onChange={e => setFilterProfile(e.target.value)}>
          <option value="">Todos os perfis</option>
          {profiles.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="pt-4">
          {filtered.length === 0
            ? <p className="text-center text-gray-400 py-8 text-sm">Nenhuma movimentação encontrada.</p>
            : (
              <div className="space-y-2">
                {filtered.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E5E1D8]">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {m.profile?.nome} {m.profile?.sobrenome}
                        {m.profile_bet?.bet?.nome && <span className="text-gray-500"> · {m.profile_bet.bet.nome}</span>}
                      </p>
                      {m.descricao && <p className="text-xs text-gray-400">{m.descricao}</p>}
                      <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-bold ${m.tipo === "deposito" ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                        {m.tipo === "deposito" ? "+" : "-"}{formatCurrency(Number(m.valor))}
                      </span>
                      <Badge className={m.tipo === "deposito" ? "bg-[#16A34A]/10 text-[#16A34A] border-0" : "bg-[#DC2626]/10 text-[#DC2626] border-0"}>
                        {m.tipo === "deposito" ? "Depósito" : "Saque"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  )
}
