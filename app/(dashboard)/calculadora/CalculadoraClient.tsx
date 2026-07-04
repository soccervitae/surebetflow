"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Calculator, Plus, Minus, TrendingUp, DollarSign, Percent, RotateCcw } from "lucide-react"

interface Leg {
  odds: string
  stake: string // computed
  bookmaker: string
  selection: string
}

interface Result {
  stakes: number[]
  totalInvestido: number
  lucroGarantido: number
  roiPct: number
  retornos: number[]
  isValid: boolean
}

function calcSurebet(oddsArr: number[], investimento: number): Result {
  const invalid: Result = { stakes: [], totalInvestido: 0, lucroGarantido: 0, roiPct: 0, retornos: [], isValid: false }
  if (oddsArr.some(o => isNaN(o) || o <= 1)) return invalid
  if (isNaN(investimento) || investimento <= 0) return invalid

  // implied probs
  const probs = oddsArr.map(o => 1 / o)
  const sumProbs = probs.reduce((a, b) => a + b, 0)
  if (sumProbs >= 1) return invalid // not a surebet

  const stakes = oddsArr.map(o => investimento / (o * sumProbs))
  const retornos = oddsArr.map((o, i) => stakes[i] * o)
  const totalInvestido = stakes.reduce((a, b) => a + b, 0)
  const lucroGarantido = retornos[0] - totalInvestido
  const roiPct = (lucroGarantido / totalInvestido) * 100

  return { stakes, totalInvestido, lucroGarantido, roiPct, retornos, isValid: true }
}

interface Props {
  initialOddsA: string
  initialOddsB: string
  initialOddsC: string
  initialInvestimento: string
  initialSelA: string
  initialSelB: string
  initialSelC: string
  initialBookA: string
  initialBookB: string
  initialBookC: string
}

export default function CalculadoraClient({
  initialOddsA, initialOddsB, initialOddsC,
  initialInvestimento,
  initialSelA, initialSelB, initialSelC,
  initialBookA, initialBookB, initialBookC,
}: Props) {
  const [legs, setLegs] = useState<Leg[]>([
    { odds: initialOddsA, stake: "", bookmaker: initialBookA, selection: initialSelA },
    { odds: initialOddsB, stake: "", bookmaker: initialBookB, selection: initialSelB },
    ...(initialOddsC ? [{ odds: initialOddsC, stake: "", bookmaker: initialBookC, selection: initialSelC }] : []),
  ])
  const [investimento, setInvestimento] = useState(initialInvestimento || "1000")
  const [thirdLeg, setThirdLeg] = useState(!!initialOddsC)

  const visibleLegs = thirdLeg ? legs.slice(0, 3) : legs.slice(0, 2)

  function updateLeg(i: number, field: keyof Leg, val: string) {
    setLegs(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
  }

  function reset() {
    setLegs([
      { odds: "", stake: "", bookmaker: "", selection: "" },
      { odds: "", stake: "", bookmaker: "", selection: "" },
      { odds: "", stake: "", bookmaker: "", selection: "" },
    ])
    setInvestimento("1000")
    setThirdLeg(false)
  }

  const result = useMemo<Result>(() => {
    const oddsArr = visibleLegs.map(l => parseFloat(l.odds.replace(",", ".")))
    const inv = parseFloat(investimento.replace(",", "."))
    return calcSurebet(oddsArr, inv)
  }, [visibleLegs, investimento])

  const profitColor = result.isValid
    ? result.roiPct >= 2 ? "text-green-400" : result.roiPct >= 1 ? "text-green-500" : "text-yellow-400"
    : "text-[var(--text-muted)]"

  const legLabels = ["A", "B", "C"]
  const legColors = [
    "border-[#1e3a8a]/40 bg-[#1e3a8a]/5",
    "border-[#7c3aed]/40 bg-[#7c3aed]/5",
    "border-[#f97316]/40 bg-[#f97316]/5",
  ]
  const legAccents = ["text-[var(--accent-text)]", "text-[#7c3aed]", "text-[#f97316]"]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Calculadora de Surebet</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Calcule stakes e lucro garantido para 2 ou 3 legs</p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-xs mt-1">
          <RotateCcw className="w-3.5 h-3.5" /> Limpar
        </Button>
      </div>

      {/* Investimento */}
      <Card>
        <CardContent className="p-4">
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
            Investimento Total (R$)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input
              className="pl-9 font-mono text-base"
              placeholder="1000,00"
              value={investimento}
              onChange={e => setInvestimento(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legs */}
      <div className="space-y-3">
        {visibleLegs.map((leg, i) => (
          <Card key={i} className={`border ${legColors[i]}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${legAccents[i]}`}>
                  Leg {legLabels[i]}
                </span>
                {result.isValid && (
                  <span className="text-xs font-mono font-semibold text-[var(--text-secondary)]">
                    Stake: <span className={`${legAccents[i]} font-bold`}>{formatCurrency(result.stakes[i])}</span>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Casa de Apostas</label>
                  <Input
                    placeholder="Ex: Betano"
                    className="text-sm h-9"
                    value={leg.bookmaker}
                    onChange={e => updateLeg(i, "bookmaker", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Odd</label>
                  <Input
                    placeholder="Ex: 2.10"
                    className="text-sm h-9 font-mono"
                    value={leg.odds}
                    onChange={e => updateLeg(i, "odds", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">Seleção</label>
                <Input
                  placeholder="Ex: Manchester City vence"
                  className="text-sm h-9"
                  value={leg.selection}
                  onChange={e => updateLeg(i, "selection", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Toggle 3rd leg */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-xs border border-dashed border-[var(--border)] hover:border-[var(--accent-text)] h-9"
          onClick={() => {
            if (!thirdLeg && legs.length < 3) {
              setLegs(prev => [...prev, { odds: "", stake: "", bookmaker: "", selection: "" }])
            }
            setThirdLeg(v => !v)
          }}
        >
          {thirdLeg ? <><Minus className="w-3.5 h-3.5" /> Remover 3ª leg</> : <><Plus className="w-3.5 h-3.5" /> Adicionar 3ª leg</>}
        </Button>
      </div>

      {/* Result */}
      <Card className={`border-2 transition-colors ${result.isValid ? "border-green-500/40 bg-green-500/5" : "border-[var(--border)]"}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Resultado</span>
          </div>

          {!result.isValid ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              {visibleLegs.every(l => !l.odds)
                ? "Preencha as odds para ver o resultado"
                : "Odds inválidas ou sem arbitragem nesta combinação"}
            </p>
          ) : (
            <div className="space-y-4">
              {/* ROI destaque */}
              <div className="text-center py-2">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Lucro Garantido (ROI)</p>
                <p className={`text-4xl font-bold font-mono tabular-nums ${profitColor}`}>
                  +{result.roiPct.toFixed(2)}%
                </p>
                <p className={`text-lg font-semibold font-mono mt-1 ${profitColor}`}>
                  {formatCurrency(result.lucroGarantido)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border)]">
                <div className="text-center">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Total Investido</p>
                  <p className="text-sm font-bold font-mono text-[var(--text-primary)]">{formatCurrency(result.totalInvestido)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Retorno Garantido</p>
                  <p className="text-sm font-bold font-mono text-[var(--text-primary)]">{formatCurrency(result.retornos[0])}</p>
                </div>
              </div>

              {/* Stakes por leg */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Stakes por Leg</p>
                {visibleLegs.map((leg, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[var(--bg-elevated)]">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${legAccents[i]}`}>Leg {legLabels[i]}</span>
                      {leg.bookmaker && <span className="text-xs text-[var(--text-muted)]">· {leg.bookmaker}</span>}
                      {leg.selection && <span className="text-xs text-[var(--text-secondary)] truncate max-w-[120px]">· {leg.selection}</span>}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs flex-shrink-0">
                      <span className="text-[var(--text-muted)]">@{parseFloat(leg.odds.replace(",", ".")).toFixed(2)}</span>
                      <span className="font-bold text-[var(--text-primary)]">{formatCurrency(result.stakes[i])}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
