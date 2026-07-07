import type { OddsApiEvent } from "@/lib/odds-api/client"

export interface DetectedLeg {
  bookmaker_key: string
  bookmaker_name: string
  selection: string
  odds: number
  line?: number
}

export interface DetectedSurebet {
  sport: string
  league: string
  home_team: string
  away_team: string
  commence_time: string
  market_key: string
  line?: number
  legs: DetectedLeg[]
  profit_pct: number
  is_suspicious: boolean
}

interface DetectOptions {
  minProfit?: number
  maxProfit?: number
}

export function detectSurebets(
  events: OddsApiEvent[],
  options: DetectOptions = {}
): DetectedSurebet[] {
  const { minProfit = 0, maxProfit = 15 } = options
  const results: DetectedSurebet[] = []

  for (const event of events) {
    const marketKeys = new Set(
      event.bookmakers.flatMap(b => b.markets.map(m => m.key))
    )

    for (const marketKey of marketKeys) {
      if (marketKey === "h2h") {
        const surebet = detectH2H(event, marketKey)
        if (surebet) results.push(classify(surebet, minProfit, maxProfit))
      } else if (marketKey === "totals" || marketKey === "spreads") {
        const surebets = detectLined(event, marketKey)
        for (const s of surebets) results.push(classify(s, minProfit, maxProfit))
      }
    }
  }

  return results.filter(s => s !== null) as DetectedSurebet[]
}

function classify(
  s: DetectedSurebet,
  minProfit: number,
  maxProfit: number
): DetectedSurebet {
  if (s.profit_pct < minProfit) return null as unknown as DetectedSurebet
  s.is_suspicious = s.profit_pct > maxProfit
  return s
}

function detectH2H(event: OddsApiEvent, marketKey: string): DetectedSurebet | null {
  // For h2h, outcomes are home/away/draw — group by outcome name
  const bestOdds = new Map<string, DetectedLeg>()

  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find(m => m.key === marketKey)
    if (!market) continue

    for (const outcome of market.outcomes) {
      const current = bestOdds.get(outcome.name)
      if (!current || outcome.price > current.odds) {
        bestOdds.set(outcome.name, {
          bookmaker_key: bookmaker.key,
          bookmaker_name: bookmaker.title,
          selection: outcome.name,
          odds: outcome.price,
        })
      }
    }
  }

  if (bestOdds.size < 2) return null

  const legs = Array.from(bestOdds.values())
  const suma = legs.reduce((acc, leg) => acc + 1 / leg.odds, 0)
  if (suma >= 1) return null

  const profit_pct = (1 / suma - 1) * 100

  return {
    sport: event.sport_key,
    league: event.sport_title,
    home_team: event.home_team,
    away_team: event.away_team,
    commence_time: event.commence_time,
    market_key: marketKey,
    legs,
    profit_pct,
    is_suspicious: false,
  }
}

function detectLined(event: OddsApiEvent, marketKey: string): DetectedSurebet[] {
  // Group by line point, then find best odds per side at the same line
  type LineMap = Map<number, Map<string, DetectedLeg>>
  const lineGroups: LineMap = new Map()

  for (const bookmaker of event.bookmakers) {
    const market = bookmaker.markets.find(m => m.key === marketKey)
    if (!market) continue

    for (const outcome of market.outcomes) {
      const point = outcome.point ?? 0
      if (!lineGroups.has(point)) lineGroups.set(point, new Map())
      const group = lineGroups.get(point)!

      const current = group.get(outcome.name)
      if (!current || outcome.price > current.odds) {
        group.set(outcome.name, {
          bookmaker_key: bookmaker.key,
          bookmaker_name: bookmaker.title,
          selection: outcome.name,
          odds: outcome.price,
          line: point,
        })
      }
    }
  }

  const results: DetectedSurebet[] = []

  for (const [point, group] of lineGroups) {
    if (group.size < 2) continue
    const legs = Array.from(group.values())
    const suma = legs.reduce((acc, leg) => acc + 1 / leg.odds, 0)
    if (suma >= 1) continue

    const profit_pct = (1 / suma - 1) * 100
    results.push({
      sport: event.sport_key,
      league: event.sport_title,
      home_team: event.home_team,
      away_team: event.away_team,
      commence_time: event.commence_time,
      market_key: marketKey,
      line: point,
      legs,
      profit_pct,
      is_suspicious: false,
    })
  }

  return results
}

export interface StakeResult {
  selection: string
  bookmaker_name: string
  odds: number
  stake: number
  payout: number
}

export function calcularStakes(
  surebet: DetectedSurebet,
  bancaTotal: number
): StakeResult[] {
  const suma = surebet.legs.reduce((acc, leg) => acc + 1 / leg.odds, 0)

  return surebet.legs.map(leg => {
    const stake = bancaTotal * (1 / leg.odds) / suma
    return {
      selection: leg.selection,
      bookmaker_name: leg.bookmaker_name,
      odds: leg.odds,
      stake: Math.round(stake * 100) / 100,
      payout: Math.round(stake * leg.odds * 100) / 100,
    }
  })
}
