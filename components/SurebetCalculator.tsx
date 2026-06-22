"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Calculator, Check, X, Loader2, ClipboardPaste, Sparkles } from "lucide-react"
import type { Profile, ProfileBet } from "@/lib/types"

interface Leg {
  profileBetId: string
  resultadoApostado: string
  odd: string
}

interface Props {
  profiles: Profile[]
  defaultProfileId?: string
  onSaved?: () => void
}

function normalizeName(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")
}

interface ParsedLeg {
  bookmakerName: string
  market: string
  odd: string
}

function parseSurebetText(text: string): { event: string; sport: string; legs: ParsedLeg[] } {
  const lines = text.split("\n").map(l => l.trim())

  // Find odd lines: standalone decimal number > 1.01
  const oddIndices: number[] = []
  for (let i = 0; i < lines.length; i++) {
    const n = parseFloat(lines[i].replace(",", "."))
    if (!isNaN(n) && n > 1.01 && n < 100 && /^\d+[.,]\d+$/.test(lines[i])) {
      oddIndices.push(i)
    }
  }

  let event = ""
  let sport = ""
  const parsedLegs: ParsedLeg[] = []

  for (const oddIdx of oddIndices) {
    const lookback = lines.slice(Math.max(0, oddIdx - 6), oddIdx)
    let bookmaker = ""
    let market = ""
    let foundEvent = ""
    let foundSport = ""

    // Scan backwards from the odd line
    for (let k = lookback.length - 1; k >= 0; k--) {
      const line = lookback[k]
      if (!line) continue

      // Market line: has tab, last segment is the bet type
      if (!market && line.includes("\t")) {
        const parts = line.split("\t").map(p => p.trim()).filter(Boolean)
        if (parts.length >= 2 && !parts[0].match(/^\d{1,2}:\d{2}/)) {
          market = parts[parts.length - 1]
        }
      }

      // Sport+date line: "Futebol\t23/06" — first part is sport, no time pattern
      if (line.includes("\t")) {
        const parts = line.split("\t").map(p => p.trim())
        if (parts[0].match(/^\d{1,2}:\d{2}/) && parts[1]) {
          // Event line: time\tTeams
          foundEvent = parts[1].replace(/[–—]/g, "x").replace(/\s+/g, " ").trim()
        } else if (!parts[0].match(/^\d/) && parts[1]?.match(/^\d{1,2}\/\d{1,2}/)) {
          // Sport\tDate pattern
          foundSport = parts[0]
        }
      }

      // Bookmaker: no tab, not a time, not a number, not sport/date pattern
      if (
        !bookmaker &&
        !line.includes("\t") &&
        !line.match(/^\d{1,2}:\d{2}/) &&
        !/^\d+[.,]\d*%$/.test(line) &&
        !/^\d+[.,]\d+$/.test(line) &&
        !/^\d+\s+dia/i.test(line) &&
        line.length > 2
      ) {
        bookmaker = line.replace(/\s*\([A-Z]{2}\)\s*$/, "").trim()
      }
    }

    if (!event && foundEvent) event = foundEvent
    if (!sport && foundSport) sport = foundSport

    parsedLegs.push({
      bookmakerName: bookmaker,
      market,
      odd: lines[oddIdx].replace(",", "."),
    })
  }

  return { event, sport, legs: parsedLegs }
}

export default function SurebetCalculator({ profiles, defaultProfileId, onSaved }: Props) {
  const filteredProfiles = defaultProfileId ? profiles.filter(p => p.id === defaultProfileId) : profiles
  const [tipo, setTipo] = useState<"2-way" | "3-way">("2-way")
  const [evento, setEvento] = useState("")
  const [esporte, setEsporte] = useState("")
  const [investimentoTotal, setInvestimentoTotal] = useState("100")
  const [profileBets, setProfileBets] = useState<Record<string, ProfileBet[]>>({})
  const [saving, setSaving] = useState(false)
  const [legs, setLegs] = useState<Leg[]>([
    { profileBetId: "", resultadoApostado: "", odd: "" },
    { profileBetId: "", resultadoApostado: "", odd: "" },
  ])
  const [pasteText, setPasteText] = useState("")
  const [showPaste, setShowPaste] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const numLegs = tipo === "2-way" ? 2 : 3

  useEffect(() => {
    if (tipo === "2-way") {
      setLegs(prev => prev.slice(0, 2).concat(
        prev.length < 2 ? [{ profileBetId: "", resultadoApostado: "", odd: "" }] : []
      ))
    } else {
      setLegs(prev => {
        const newLegs = [...prev]
        while (newLegs.length < 3) newLegs.push({ profileBetId: "", resultadoApostado: "", odd: "" })
        return newLegs.slice(0, 3)
      })
    }
  }, [tipo])

  useEffect(() => {
    loadProfileBets()
  }, [filteredProfiles])

  async function loadProfileBets() {
    const { data } = await supabase
      .from("profile_bets")
      .select("*, bet:bets(*)")
      .in("profile_id", filteredProfiles.map(p => p.id))
    if (data) {
      const grouped: Record<string, ProfileBet[]> = {}
      data.forEach((pb: ProfileBet) => {
        if (!grouped[pb.profile_id]) grouped[pb.profile_id] = []
        grouped[pb.profile_id].push(pb)
      })
      setProfileBets(grouped)
    }
  }

  function updateLeg(index: number, field: keyof Leg, value: string) {
    setLegs(prev => prev.map((leg, i) => i === index ? { ...leg, [field]: value } : leg))
  }

  function handleParsePaste() {
    if (!pasteText.trim()) return

    const { event, sport, legs: parsedLegs } = parseSurebetText(pasteText)

    if (parsedLegs.length < 2) {
      toast({ title: "Não foi possível identificar as apostas no texto colado", variant: "destructive" })
      return
    }

    if (event) setEvento(event)
    if (sport) setEsporte(sport)

    // Set tipo based on number of legs
    const newTipo: "2-way" | "3-way" = parsedLegs.length >= 3 ? "3-way" : "2-way"
    setTipo(newTipo)

    // Match each leg's bookmaker name to a profile_bet
    const allProfileBets = Object.values(profileBets).flat() as (ProfileBet & { bet?: { nome: string } })[]

    const newLegs = parsedLegs.map(pl => {
      const searchName = normalizeName(pl.bookmakerName)
      const matched = allProfileBets.find(pb => {
        const betNome = normalizeName(pb.bet?.nome ?? "")
        return betNome && (betNome.includes(searchName) || searchName.includes(betNome))
      })
      return {
        profileBetId: matched?.id ?? "",
        resultadoApostado: pl.market,
        odd: pl.odd,
      }
    })

    setLegs(newLegs)
    setShowPaste(false)
    setPasteText("")

    const unmatched = parsedLegs
      .filter((_, i) => !newLegs[i].profileBetId)
      .map(pl => pl.bookmakerName)
      .filter(Boolean)

    if (unmatched.length > 0) {
      toast({
        title: `Dados preenchidos! Selecione manualmente: ${unmatched.join(", ")}`,
        variant: "destructive",
      })
    } else {
      toast({ title: "Apostas preenchidas automaticamente!" })
    }
  }

  // Calculate surebet
  const odds = legs.slice(0, numLegs).map(l => parseFloat(l.odd) || 0)
  const impliedProbs = odds.map(o => o > 0 ? 1 / o : 0)
  const sumProbs = impliedProbs.reduce((a, b) => a + b, 0)
  const isArbitrage = sumProbs > 0 && sumProbs < 1
  const investment = parseFloat(investimentoTotal) || 0

  const stakes = isArbitrage && investment > 0
    ? impliedProbs.map(p => parseFloat(((p / sumProbs) * investment).toFixed(2)))
    : odds.map(() => 0)

  const guaranteedReturn = isArbitrage && stakes.length > 0 && odds[0] > 0
    ? stakes[0] * odds[0]
    : 0
  const lucroGarantido = guaranteedReturn - investment
  const roi = investment > 0 && isArbitrage ? ((lucroGarantido / investment) * 100) : 0

  async function handleSave() {
    if (!evento.trim()) {
      toast({ title: "Informe o nome do evento", variant: "destructive" })
      return
    }
    if (!isArbitrage) {
      toast({ title: "Não há arbitragem nesta aposta", variant: "destructive" })
      return
    }
    const legsToSave = legs.slice(0, numLegs)
    for (const leg of legsToSave) {
      if (!leg.profileBetId || !leg.resultadoApostado || !leg.odd) {
        toast({ title: "Preencha todos os campos das apostas", variant: "destructive" })
        return
      }
    }

    const firstLeg = legsToSave[0]
    let profileId = ""
    for (const [pid, bets] of Object.entries(profileBets)) {
      if (bets.find(b => b.id === firstLeg.profileBetId)) {
        profileId = pid
        break
      }
    }
    if (!profileId && profiles.length > 0) profileId = profiles[0].id

    setSaving(true)
    try {
      const { data: apostaData, error: apostaError } = await supabase
        .from("apostas")
        .insert({
          profile_id: profileId,
          evento: evento.trim(),
          esporte: esporte.trim() || null,
          tipo,
          investimento_total: investment,
          lucro_garantido: parseFloat(lucroGarantido.toFixed(2)),
          roi_percentual: parseFloat(roi.toFixed(4)),
          status: "pendente",
        })
        .select()
        .single()

      if (apostaError) throw apostaError

      const legsData = legsToSave.map((leg, i) => ({
        aposta_id: apostaData.id,
        profile_bet_id: leg.profileBetId,
        resultado_apostado: leg.resultadoApostado,
        odd: parseFloat(leg.odd),
        stake: stakes[i],
      }))

      const { error: legsError } = await supabase.from("aposta_legs").insert(legsData)
      if (legsError) throw legsError

      toast({ title: "Aposta salva com sucesso!" })
      setEvento("")
      setEsporte("")
      setLegs(Array(numLegs).fill({ profileBetId: "", resultadoApostado: "", odd: "" }))
      onSaved?.()
    } catch (err: unknown) {
      toast({ title: (err as Error)?.message ?? "Erro ao salvar aposta", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Paste block */}
      <Card className="border-dashed border-[#16A34A]/40 bg-[#16A34A]/5">
        <CardContent className="p-4">
          {!showPaste ? (
            <button
              type="button"
              onClick={() => setShowPaste(true)}
              className="w-full flex items-center justify-center gap-3 py-2 text-sm text-[#16A34A] font-medium hover:opacity-80 transition-opacity"
            >
              <ClipboardPaste className="h-4 w-4" />
              Colar dados da surebet para preenchimento automático
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#16A34A]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">Cole o texto do localizador de surebets</p>
              </div>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={`Cole aqui. Exemplo:\n6,07%\n1 dia\n\nBetano (BR)\nFutebol\t23/06\n14:00\tPortugal – Uzbequistão\n...\t Acima 33.5 - tackles\n5.40`}
                className="w-full h-44 p-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-[#16A34A] font-mono"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleParsePaste}
                  disabled={!pasteText.trim()}
                  className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analisar e preencher automaticamente
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowPaste(false); setPasteText("") }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#16A34A]" />
            Configuração da Aposta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Esporte</Label>
              <select
                value={esporte}
                onChange={e => setEsporte(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
              >
                <option value="">Selecionar...</option>
                {[
                  "Futebol", "Tênis", "Basquete", "Vôlei", "Futebol Americano",
                  "Hockey no Gelo", "Beisebol", "Handebol", "Rugby", "MMA/UFC",
                  "Boxe", "Ciclismo", "Fórmula 1", "Outros",
                ].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Evento</Label>
              <Input value={evento} onChange={e => setEvento(e.target.value)} placeholder="Ex: Flamengo x Corinthians" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v: "2-way" | "3-way") => setTipo(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-way">2-way (2 resultados)</SelectItem>
                  <SelectItem value="3-way">3-way (3 resultados)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Investimento Total (R$)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={investimentoTotal}
                onChange={e => setInvestimentoTotal(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legs */}
      {legs.slice(0, numLegs).map((leg, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aposta {i + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Casa de Apostas</Label>
              <Select value={leg.profileBetId} onValueChange={v => updateLeg(i, "profileBetId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredProfiles.map(profile => {
                    const bets = profileBets[profile.id] ?? []
                    if (bets.length === 0) return null
                    return bets.map(pb => (
                      <SelectItem key={pb.id} value={pb.id}>
                        {profile.apelido || `${profile.nome} ${profile.sobrenome}`} — {(pb as ProfileBet & { bet?: { nome: string } }).bet?.nome ?? "Casa"}
                      </SelectItem>
                    ))
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Resultado Apostado</Label>
                <Input
                  value={leg.resultadoApostado}
                  onChange={e => updateLeg(i, "resultadoApostado", e.target.value)}
                  placeholder={tipo === "2-way" ? (i === 0 ? "Casa" : "Visitante") : ["Casa", "Empate", "Visitante"][i]}
                />
              </div>
              <div className="space-y-2">
                <Label>Odd</Label>
                <Input
                  type="number"
                  min="1.01"
                  step="0.01"
                  value={leg.odd}
                  onChange={e => updateLeg(i, "odd", e.target.value)}
                  placeholder="2.10"
                />
              </div>
            </div>
            {leg.odd && parseFloat(leg.odd) > 1 && (
              <div className="flex items-center justify-between text-sm bg-[var(--bg-elevated)] rounded-lg p-3">
                <span className="text-[var(--text-secondary)]">Probabilidade implícita:</span>
                <span className="font-medium text-[var(--text-primary)]">{((1 / parseFloat(leg.odd)) * 100).toFixed(1)}%</span>
              </div>
            )}
            {stakes[i] > 0 && (
              <div className="flex items-center justify-between text-sm bg-[#16A34A]/5 rounded-lg p-3">
                <span className="text-[var(--text-secondary)]">Stake recomendada:</span>
                <span className="font-bold text-[#16A34A]">{formatCurrency(stakes[i])}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Result */}
      <Card className={isArbitrage ? "border-[#16A34A]/30" : "border-[#DC2626]/30"}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            {isArbitrage ? (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#16A34A]/10 rounded-full">
                  <Check className="h-4 w-4 text-[#16A34A]" />
                </div>
                <span className="font-semibold text-[#16A34A]">Arbitragem encontrada!</span>
              </div>
            ) : sumProbs > 0 ? (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#DC2626]/10 rounded-full">
                  <X className="h-4 w-4 text-[#DC2626]" />
                </div>
                <span className="font-semibold text-[#DC2626]">Sem arbitragem ({(sumProbs * 100).toFixed(1)}%)</span>
              </div>
            ) : (
              <span className="text-[var(--text-muted)]">Preencha as odds para calcular</span>
            )}
          </div>

          {isArbitrage && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">Retorno Garantido</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(guaranteedReturn)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">Lucro Garantido</p>
                <p className="text-lg font-bold text-[#16A34A]">{formatCurrency(lucroGarantido)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">ROI</p>
                <p className="text-lg font-bold text-[#16A34A]">{roi.toFixed(2)}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={handleSave}
        disabled={!isArbitrage || saving}
      >
        {saving ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando aposta...</>
        ) : (
          "Salvar Aposta"
        )}
      </Button>
    </div>
  )
}
