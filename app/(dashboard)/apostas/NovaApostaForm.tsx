"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/useToast"
import { Plus, Trash2, Loader2 } from "lucide-react"
import type { Aposta, ApostaLeg } from "@/lib/types"

interface Profile {
  id: string
  nome: string
  sobrenome: string
  apelido?: string | null
}

interface ProfileBet {
  id: string
  profile_id: string
  bet: { id: string; nome: string } | null
}

interface LegDraft {
  profile_bet_id: string
  resultado_apostado: string
  odd: string
  stake: string
}

interface Props {
  profiles: Profile[]
  onCreated: (aposta: Aposta & { profile?: Profile; legs?: ApostaLeg[] }) => void
  onClose: () => void
}

function parseBRL(v: string) {
  return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0
}

function formatBRL(raw: string) {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const ESPORTES = ["Futebol", "Tênis", "Basquete", "Vôlei", "MMA", "E-sports", "Outro"]

export default function NovaApostaForm({ profiles, onCreated, onClose }: Props) {
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "")
  const [evento, setEvento] = useState("")
  const [esporte, setEsporte] = useState("")
  const [tipo, setTipo] = useState<"2-way" | "3-way">("2-way")
  const [legs, setLegs] = useState<LegDraft[]>([
    { profile_bet_id: "", resultado_apostado: "", odd: "", stake: "" },
    { profile_bet_id: "", resultado_apostado: "", odd: "", stake: "" },
  ])
  const [profileBets, setProfileBets] = useState<ProfileBet[]>([])
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (!profileId) return
    supabase
      .from("profile_bets")
      .select("id, profile_id, bet:bets(id, nome)")
      .eq("profile_id", profileId)
      .then(({ data }) => setProfileBets((data as unknown as ProfileBet[]) ?? []))
  }, [profileId])

  useEffect(() => {
    const count = tipo === "3-way" ? 3 : 2
    setLegs(prev => {
      if (prev.length === count) return prev
      if (prev.length < count) return [...prev, { profile_bet_id: "", resultado_apostado: "", odd: "", stake: "" }]
      return prev.slice(0, count)
    })
  }, [tipo])

  function updateLeg(i: number, field: keyof LegDraft, value: string) {
    setLegs(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: field === "stake" ? formatBRL(value) : value } : l))
  }

  function calcTotals() {
    const totalStake = legs.reduce((s, l) => s + parseBRL(l.stake), 0)
    const odds = legs.map(l => parseFloat(l.odd) || 0)
    const allOdds = odds.every(o => o > 0)
    if (!allOdds || totalStake === 0) return { investimento_total: totalStake, lucro_garantido: 0, roi_percentual: 0 }
    const minReturn = Math.min(...legs.map((l, i) => (parseFloat(l.odd) || 0) * parseBRL(l.stake)))
    const lucro_garantido = minReturn - totalStake
    const roi_percentual = totalStake > 0 ? (lucro_garantido / totalStake) * 100 : 0
    return { investimento_total: totalStake, lucro_garantido, roi_percentual }
  }

  const totals = calcTotals()

  async function handleSave() {
    if (!evento.trim()) { toast({ title: "Informe o evento", variant: "destructive" }); return }
    if (!profileId) { toast({ title: "Selecione um perfil", variant: "destructive" }); return }
    const invalidLeg = legs.find(l => !l.profile_bet_id || !l.resultado_apostado || !parseFloat(l.odd) || !parseBRL(l.stake))
    if (invalidLeg) { toast({ title: "Preencha todos os campos de cada leg", variant: "destructive" }); return }

    setSaving(true)
    const { data: aposta, error: aErr } = await supabase
      .from("apostas")
      .insert({
        profile_id: profileId,
        evento: evento.trim(),
        esporte: esporte || null,
        tipo,
        investimento_total: totals.investimento_total,
        lucro_garantido: totals.lucro_garantido,
        roi_percentual: totals.roi_percentual,
        status: "pendente",
      })
      .select("*")
      .single()

    if (aErr || !aposta) {
      toast({ title: "Erro ao criar aposta", variant: "destructive" })
      setSaving(false)
      return
    }

    const { error: lErr } = await supabase.from("aposta_legs").insert(
      legs.map(l => ({
        aposta_id: aposta.id,
        profile_bet_id: l.profile_bet_id,
        resultado_apostado: l.resultado_apostado,
        odd: parseFloat(l.odd),
        stake: parseBRL(l.stake),
      }))
    )

    if (lErr) {
      toast({ title: "Aposta criada mas houve erro nas legs", variant: "destructive" })
    } else {
      toast({ title: "Aposta criada!" })
    }

    const profile = profiles.find(p => p.id === profileId)
    onCreated({ ...aposta, profile, legs: [] })
    setSaving(false)
  }

  const profileLabel = (p: Profile) => p.apelido || `${p.nome} ${p.sobrenome}`

  return (
    <div className="space-y-5 px-1">
      {/* Perfil + Evento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Perfil</Label>
          <Select value={profileId} onValueChange={setProfileId}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {profiles.map(p => <SelectItem key={p.id} value={p.id}>{profileLabel(p)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={v => setTipo(v as "2-way" | "3-way")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2-way">2-way</SelectItem>
              <SelectItem value="3-way">3-way</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Evento</Label>
        <Input placeholder="Ex: Flamengo x Corinthians" value={evento} onChange={e => setEvento(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Esporte <span className="text-[var(--text-muted)] font-normal">(opcional)</span></Label>
        <Select value={esporte} onValueChange={setEsporte}>
          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            {ESPORTES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Legs */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Legs ({legs.length})</p>
        {legs.map((leg, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Leg {i + 1}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Casa de aposta</Label>
                <Select value={leg.profile_bet_id} onValueChange={v => updateLeg(i, "profile_bet_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {profileBets.length === 0
                      ? <SelectItem value="_" disabled>Nenhuma casa cadastrada</SelectItem>
                      : profileBets.map(pb => (
                          <SelectItem key={pb.id} value={pb.id}>{pb.bet?.nome ?? pb.id}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Resultado apostado</Label>
                <Input placeholder="Ex: Flamengo vence" value={leg.resultado_apostado} onChange={e => updateLeg(i, "resultado_apostado", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Odd</Label>
                <Input type="number" step="0.01" min="1" placeholder="2.10" value={leg.odd} onChange={e => updateLeg(i, "odd", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stake (R$)</Label>
                <Input inputMode="numeric" placeholder="0,00" value={leg.stake} onChange={e => updateLeg(i, "stake", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals preview */}
      {totals.investimento_total > 0 && (
        <div className="rounded-xl bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Investimento total</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              R$ {totals.investimento_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">Lucro garantido</p>
            <p className={`text-sm font-bold ${totals.lucro_garantido >= 0 ? "text-[var(--accent-text)]" : "text-red-500"}`}>
              R$ {totals.lucro_garantido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              <span className="ml-1 text-xs font-normal opacity-70">({totals.roi_percentual.toFixed(2)}%)</span>
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Criar aposta"}
        </Button>
      </div>
    </div>
  )
}
