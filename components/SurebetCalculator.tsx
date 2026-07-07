"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { Calculator, Check, X, Loader2, ClipboardPaste, Sparkles, ImageIcon, ChevronLeft, ChevronRight, Plus, AlertTriangle } from "lucide-react"
import Link from "next/link"
import type { Profile, ProfileBet } from "@/lib/types"

interface Leg {
  profileBetId: string
  resultadoApostado: string
  odd: string
}

interface Props {
  profiles: Profile[]
  defaultProfileId?: string
  profileName?: string
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

interface AiLeg {
  bookmaker: string
  mercado: string
  odd: number
}

interface AiSurebet {
  evento: string
  competicao: string | null
  esporte: string
  data: string | null
  tipo: "2-way" | "3-way"
  roi: number | null
  legs: AiLeg[]
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

export default function SurebetCalculator({ profiles, defaultProfileId, profileName, onSaved }: Props) {
  const filteredProfiles = defaultProfileId ? profiles.filter(p => p.id === defaultProfileId) : profiles
  const [numLegs, setNumLegs] = useState(2)
  const tipo = numLegs >= 3 ? "3-way" : "2-way"
  const [evento, setEvento] = useState("")
  const [esporte, setEsporte] = useState("")
  const [competicao, setCompeticao] = useState("")
  const [dataEvento, setDataEvento] = useState("") // DD/MM/AAAA display format
  const [horaEvento, setHoraEvento] = useState("")
  const [investimentoTotal, setInvestimentoTotal] = useState("")
  const [profileBets, setProfileBets] = useState<Record<string, ProfileBet[]>>({})
  const [saving, setSaving] = useState(false)
  const [legs, setLegs] = useState<Leg[]>([
    { profileBetId: "", resultadoApostado: "", odd: "" },
    { profileBetId: "", resultadoApostado: "", odd: "" },
  ])
  const [pasteText, setPasteText] = useState("")
  const [showPaste, setShowPaste] = useState(false)
  const [aiMode, setAiMode] = useState<"text" | "image">("text")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSurebets, setAiSurebets] = useState<AiSurebet[] | null>(null)
  const [aiSelectedIdx, setAiSelectedIdx] = useState(0)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [userStakes, setUserStakes] = useState<(number | null)[]>([null, null, null])
  const [roundStakes, setRoundStakes] = useState(false)
  const [roundTo, setRoundTo] = useState(1)
  const [unmatchedBookmakers, setUnmatchedBookmakers] = useState<string[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    setLegs(prev => {
      const cur = [...prev]
      while (cur.length < numLegs) cur.push({ profileBetId: "", resultadoApostado: "", odd: "" })
      return cur.slice(0, numLegs)
    })
  }, [numLegs])

  const loadProfileBets = useCallback(async () => {
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
  }, [filteredProfiles, supabase])

  useEffect(() => {
    loadProfileBets()
  }, [loadProfileBets])

  function formatBRL(raw: string) {
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function parseBRL(v: string) {
    return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0
  }

  // Reset manual stakes when odds or investment change
  useEffect(() => {
    setUserStakes([null, null, null])
  }, [legs.map(l => l.odd).join(","), investimentoTotal]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateLeg(index: number, field: keyof Leg, value: string) {
    setLegs(prev => prev.map((leg, i) => i === index ? { ...leg, [field]: value } : leg))
  }

  function applyAiSurebet(sb: AiSurebet) {
    if (sb.evento) setEvento(sb.evento)
    if (sb.esporte) setEsporte(sb.esporte)
    if (sb.competicao) setCompeticao(sb.competicao)
    if (sb.data) {
      // Normalize date: accept DD/MM or DD/MM/AAAA, fill current year if missing
      const parts = sb.data.split("/")
      if (parts.length >= 2) {
        const d = parts[0].padStart(2, "0")
        const m = parts[1].padStart(2, "0")
        const y = parts[2] ?? String(new Date().getFullYear())
        setDataEvento(`${d}/${m}/${y}`)
      }
    }
    setNumLegs(sb.legs.length >= 3 ? 3 : 2)

    const allProfileBets = Object.values(profileBets).flat() as (ProfileBet & { bet?: { nome: string } })[]
    const newLegs = sb.legs.map(leg => {
      const searchName = normalizeName(leg.bookmaker ?? "")
      const matched = allProfileBets.find(pb => {
        const betNome = normalizeName(pb.bet?.nome ?? "")
        return betNome && (betNome.includes(searchName) || searchName.includes(betNome))
      })
      return {
        profileBetId: matched?.id ?? "",
        resultadoApostado: leg.mercado ?? "",
        odd: String(leg.odd ?? ""),
      }
    })
    setLegs(newLegs)
    setShowPaste(false)
    setPasteText("")
    setAiSurebets(null)

    const unmatched = sb.legs
      .filter((_, i) => !newLegs[i].profileBetId)
      .map(l => l.bookmaker)
      .filter(Boolean) as string[]

    setUnmatchedBookmakers(unmatched)
    if (unmatched.length === 0) {
      toast({ title: "Aposta preenchida automaticamente!" })
    }
  }

  async function handleAiParse(text?: string, imageBase64?: string, imageMediaType?: string) {
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai/parse-surebet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, imageBase64, imageMediaType }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Erro da IA")
      const surebets: AiSurebet[] = data.surebets ?? []
      if (surebets.length === 0) {
        toast({ title: "Nenhuma surebet identificada", variant: "destructive" })
        return
      }
      if (surebets.length === 1) {
        applyAiSurebet(surebets[0])
      } else {
        setAiSurebets(surebets)
        setAiSelectedIdx(0)
      }
    } catch (err: unknown) {
      toast({ title: (err as Error)?.message ?? "Erro ao analisar", variant: "destructive" })
    } finally {
      setAiLoading(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(",")[1]
      const mediaType = file.type || "image/jpeg"
      await handleAiParse(undefined, base64, mediaType)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
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

    setNumLegs(parsedLegs.length >= 3 ? 3 : 2)

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
  const investment = parseBRL(investimentoTotal)

  const computedStakes = isArbitrage && investment > 0
    ? impliedProbs.map(p => parseFloat(((p / sumProbs) * investment).toFixed(2)))
    : odds.map(() => 0)

  const stakes = (() => {
    const rawStakes = computedStakes.map((computed, i) => userStakes[i] ?? computed)
    if (!roundStakes || roundTo <= 1) return rawStakes
    const total = rawStakes.reduce((a, b) => a + b, 0)
    const result: number[] = []
    let allocated = 0
    for (let i = 0; i < rawStakes.length; i++) {
      if (i < rawStakes.length - 1) {
        const rounded = Math.round(rawStakes[i] / roundTo) * roundTo
        result.push(rounded)
        allocated += rounded
      } else {
        // Last leg gets the remainder to keep total constant
        result.push(parseFloat((total - allocated).toFixed(2)))
      }
    }
    return result
  })()

  // Após arredondamento os stakes podem ser desiguais, então:
  // retorno garantido = pior payout entre todas as pernas
  // lucro/ROI calculados sobre a soma real dos stakes (não o investimento digitado)
  const totalStaked = stakes.slice(0, numLegs).reduce((a, b) => a + b, 0)
  const payouts = stakes.slice(0, numLegs).map((s, i) => s * (odds[i] || 0))
  const guaranteedReturn = isArbitrage && totalStaked > 0
    ? Math.min(...payouts.filter(p => p > 0))
    : 0
  const lucroGarantido = guaranteedReturn > 0 ? guaranteedReturn - totalStaked : 0
  const roi = totalStaked > 0 && isArbitrage ? ((lucroGarantido / totalStaked) * 100) : 0

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
          competicao: competicao.trim() || null,
          tipo,
          data_evento: (() => {
            if (!dataEvento) return null
            const [d, m, y] = dataEvento.split("/")
            if (!d || !m || !y || y.length < 4) return null
            const iso = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`
            return `${iso}${horaEvento ? `T${horaEvento}:00` : "T00:00:00"}`
          })(),
          investimento_total: totalStaked || investment,
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
      setDataEvento("")
      setHoraEvento("")
      setNumLegs(2)
      setLegs([{ profileBetId: "", resultadoApostado: "", odd: "" }, { profileBetId: "", resultadoApostado: "", odd: "" }])
      onSaved?.()
    } catch (err: unknown) {
      toast({ title: (err as Error)?.message ?? "Erro ao salvar aposta", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Profile name banner */}
      {profileName && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1e3a8a]/10 border border-[#1e3a8a]/30">
          <div className="w-2 h-2 rounded-full bg-[#4d82d6] flex-shrink-0" />
          <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Perfil</span>
          <span className="font-bold text-[var(--text-primary)] text-sm">{profileName}</span>
        </div>
      )}

      {/* AI Import block */}
      <Card className="border-dashed border-[#1e3a8a]/40 bg-[#1e3a8a]/5">
        <CardContent className="p-4">
          {/* Selection picker when multiple surebets found */}
          {aiSurebets && aiSurebets.length > 1 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--accent-text)]" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {aiSurebets.length} surebets encontradas — escolha uma
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSurebets(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {aiSurebets.map((sb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAiSelectedIdx(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      aiSelectedIdx === idx
                        ? "border-[#1e3a8a] bg-[#1e3a8a]/10"
                        : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[#1e3a8a]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{sb.evento || "Evento desconhecido"}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {sb.esporte} · {sb.legs.length} casas
                          {sb.roi ? ` · ROI ${sb.roi.toFixed(1)}%` : ""}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {sb.legs.map(l => l.bookmaker).join(" × ")}
                        </p>
                      </div>
                      {aiSelectedIdx === idx && (
                        <div className="w-5 h-5 rounded-full bg-[#1e3a8a] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAiSelectedIdx(i => Math.max(0, i - 1))}
                  disabled={aiSelectedIdx === 0}
                  className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-[var(--text-secondary)] flex-1 text-center">
                  {aiSelectedIdx + 1} de {aiSurebets.length}
                </span>
                <button
                  type="button"
                  onClick={() => setAiSelectedIdx(i => Math.min(aiSurebets.length - 1, i + 1))}
                  disabled={aiSelectedIdx === aiSurebets.length - 1}
                  className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <Button
                  type="button"
                  onClick={() => applyAiSurebet(aiSurebets[aiSelectedIdx])}
                  className="flex-1 bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
                >
                  Usar esta surebet
                </Button>
              </div>
            </div>
          ) : !showPaste ? (
            /* Collapsed — two action buttons */
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent-text)] flex-shrink-0" />
              <span className="text-sm text-[var(--accent-text)] font-medium flex-1">Preencher com IA</span>
              <button
                type="button"
                onClick={() => { setAiMode("text"); setShowPaste(true) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e3a8a]/30 text-[var(--accent-text)] text-xs font-medium hover:bg-[#1e3a8a]/10 transition-colors"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                Colar texto
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e3a8a]/30 text-[var(--accent-text)] text-xs font-medium hover:bg-[#1e3a8a]/10 transition-colors disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                {aiLoading ? "Lendo..." : "Imagem"}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          ) : (
            /* Text paste panel */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent-text)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">Cole o texto do localizador de surebets</p>
              </div>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={`Cole aqui o texto copiado do site de surebets...`}
                className="w-full h-36 p-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-[#1e3a8a] font-mono"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => handleAiParse(pasteText)}
                  disabled={!pasteText.trim() || aiLoading}
                  className="flex-1 bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {aiLoading ? "Analisando..." : "Analisar com IA"}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowPaste(false); setPasteText("") }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unmatched bookmakers warning */}
      {unmatchedBookmakers.length > 0 && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {unmatchedBookmakers.length === 1
                  ? "Casa de apostas não encontrada no perfil"
                  : "Casas de apostas não encontradas no perfil"}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                A IA identificou {unmatchedBookmakers.length === 1 ? "a bet" : "as bets"}{" "}
                <span className="font-semibold">{unmatchedBookmakers.join(", ")}</span>{" "}
                mas {unmatchedBookmakers.length === 1 ? "ela não está" : "elas não estão"} cadastrada{unmatchedBookmakers.length > 1 ? "s" : ""} neste perfil.
                Adicione-{unmatchedBookmakers.length === 1 ? "a" : "as"} ao perfil para continuar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUnmatchedBookmakers([])}
              className="text-amber-500 hover:text-amber-700 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {filteredProfiles.map(p => (
            <Link
              key={p.id}
              href={`/perfis/${p.id}?tab=bets`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar bet no perfil {(p as Profile & { apelido?: string }).apelido || p.nome}
            </Link>
          ))}
        </div>
      )}

      {/* Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[var(--accent-text)]" />
            Configuração da Aposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>Evento</Label>
              <Input value={evento} onChange={e => setEvento(e.target.value)} placeholder="Ex: Brasil x Espanha" />
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>Competição</Label>
              <Input value={competicao} onChange={e => setCompeticao(e.target.value)} placeholder="Ex: Copa do Mundo" />
            </div>
            <div className="space-y-2 col-span-1">
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
            <div className="space-y-2 col-span-1">
              <Label>Data do evento</Label>
              <Input
                inputMode="numeric"
                placeholder="DD/MM/AAAA"
                value={dataEvento}
                maxLength={10}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 8)
                  let masked = digits
                  if (digits.length > 2) masked = digits.slice(0, 2) + "/" + digits.slice(2)
                  if (digits.length > 4) masked = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4)
                  setDataEvento(masked)
                }}
              />
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>Investimento Total (R$)</Label>
              <Input
                inputMode="numeric"
                value={investimentoTotal}
                onChange={e => setInvestimentoTotal(formatBRL(e.target.value))}
                placeholder="0,00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legs */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          {numLegs === 2 ? "2 apostas (2-way)" : "3 apostas (3-way)"}
        </p>
        {numLegs === 2 ? (
          <button
            type="button"
            onClick={() => setNumLegs(3)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#1e3a8a]/50 text-[var(--accent-text)] text-xs font-medium hover:bg-[#1e3a8a]/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar 3ª aposta
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setNumLegs(2)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#DC2626]/40 text-[#DC2626] text-xs font-medium hover:bg-[#DC2626]/5 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Remover 3ª aposta
          </button>
        )}
      </div>
      <div className="space-y-3">
        {legs.slice(0, numLegs).map((leg, i) => {
          const allPBs = Object.values(profileBets).flat() as (ProfileBet & { bet?: { nome: string } })[]
          const selectedPB = allPBs.find(pb => pb.id === leg.profileBetId)
          const usedProfileBetIds = legs.slice(0, numLegs).map((l, k) => k !== i ? l.profileBetId : null).filter(Boolean)
          const saldo = selectedPB ? parseFloat(String(selectedPB.saldo)) || 0 : 0
          const stake = stakes[i] ?? 0
          const showSaldoWarning = selectedPB && saldo > 0 && stake > 0 && stake > saldo

          return (
          <Card key={i}>
            <CardContent className="p-4">
              {/* Label row */}
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Aposta {i + 1}</p>

              {/* Mobile: stacked; Desktop: horizontal 4 cols */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <Label className="text-xs">Casa de Apostas</Label>
                  <Select value={leg.profileBetId} onValueChange={v => updateLeg(i, "profileBetId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar conta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProfiles.map(profile => {
                        const bets = profileBets[profile.id] ?? []
                        if (bets.length === 0) return null
                        return bets
                          .filter(pb => !usedProfileBetIds.includes(pb.id))
                          .map(pb => (
                            <SelectItem key={pb.id} value={pb.id}>
                              {(pb as ProfileBet & { bet?: { nome: string } }).bet?.nome ?? "Casa"}
                            </SelectItem>
                          ))
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <Label className="text-xs">Resultado Apostado</Label>
                  <Input
                    value={leg.resultadoApostado}
                    onChange={e => updateLeg(i, "resultadoApostado", e.target.value)}
                    placeholder={numLegs === 2 ? (i === 0 ? "Casa" : "Visitante") : ["Casa", "Empate", "Visitante"][i]}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Odd</Label>
                  <Input
                    type="number"
                    min="1.01"
                    step="0.01"
                    value={leg.odd}
                    onChange={e => updateLeg(i, "odd", e.target.value)}
                    placeholder="2.10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Stake (R$)
                    {leg.odd && parseFloat(leg.odd) > 1 && (
                      <span className="ml-2 text-[var(--text-muted)] font-normal">
                        {((1 / parseFloat(leg.odd)) * 100).toFixed(1)}% prob.
                      </span>
                    )}
                  </Label>
                  <Input
                    inputMode="decimal"
                    value={stakes[i] > 0 ? stakes[i].toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                    placeholder="0,00"
                    onChange={e => {
                      const newStake = parseBRL(formatBRL(e.target.value))
                      if (newStake <= 0) return
                      const remaining = investment - newStake
                      setUserStakes(prev => {
                        const next = [...prev]
                        next[i] = newStake
                        const otherIndices = Array.from({ length: numLegs }, (_, k) => k).filter(k => k !== i)
                        const otherSumProbs = otherIndices.reduce((s, k) => s + (impliedProbs[k] || 0), 0)
                        if (otherIndices.length === 1) {
                          next[otherIndices[0]] = parseFloat(remaining.toFixed(2))
                        } else {
                          otherIndices.forEach(k => {
                            next[k] = otherSumProbs > 0
                              ? parseFloat(((impliedProbs[k] / otherSumProbs) * remaining).toFixed(2))
                              : parseFloat((remaining / otherIndices.length).toFixed(2))
                          })
                        }
                        return next
                      })
                    }}
                  />
                </div>
              </div>

              {showSaldoWarning && (
                <div className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Saldo insuficiente na <span className="font-semibold">{selectedPB.bet?.nome ?? "casa"}</span>.
                    A stake de R$ {stake.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} é maior que o saldo disponível de R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.
                    Adicione fundos nesta conta antes de fazer a aposta.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          )
        })}
      </div>

      {/* Round stakes */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-sm ${
        roundStakes ? "border-[#1e3a8a]/40 bg-[#1e3a8a]/5" : "border-[var(--border)]"
      }`}>
        <input
          type="checkbox"
          id="round-stakes"
          checked={roundStakes}
          onChange={e => setRoundStakes(e.target.checked)}
          className="w-4 h-4 accent-[#1e3a8a] cursor-pointer flex-shrink-0"
        />
        <label htmlFor="round-stakes" className="font-medium text-[var(--text-primary)] cursor-pointer select-none flex-1">
          Arredondar aposta até:
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!roundStakes || roundTo <= 1}
            onClick={() => setRoundTo(v => Math.max(1, v - 1))}
            className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-30 transition-colors text-base leading-none"
          >−</button>
          <span className="w-8 text-center text-sm font-mono font-semibold text-[var(--text-primary)]">{roundTo}</span>
          <button
            type="button"
            disabled={!roundStakes || roundTo >= 100}
            onClick={() => setRoundTo(v => Math.min(100, v + 1))}
            className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-30 transition-colors text-base leading-none"
          >+</button>
        </div>
      </div>

      {/* Result */}
      <Card className={isArbitrage ? "border-[#1e3a8a]/30" : "border-[#DC2626]/30"}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            {isArbitrage ? (
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#1e3a8a]/10 rounded-full">
                  <Check className="h-4 w-4 text-[var(--accent-text)]" />
                </div>
                <span className="font-semibold text-[var(--accent-text)]">Arbitragem encontrada!</span>
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
                <p className="text-lg font-bold text-[var(--accent-text)]">{formatCurrency(lucroGarantido)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-1">ROI</p>
                <p className="text-lg font-bold text-[var(--accent-text)]">{roi.toFixed(2)}%</p>
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
