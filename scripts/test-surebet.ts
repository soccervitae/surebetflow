import { fetchOdds, fetchSports } from "../lib/odds-api/client"
import { detectSurebets, calcularStakes } from "../lib/surebet/detector"

async function main() {
  console.log("=== SurebetFlow — Odds API Test ===\n")

  // List available sports (optional — comment out to save quota)
  // console.log("Fetching sports list...")
  // const sports = await fetchSports()
  // const soccer = sports.filter(s => s.group === "Soccer")
  // console.log(`Soccer competitions available (${soccer.length}):`)
  // soccer.forEach(s => console.log(`  ${s.key} — ${s.title}`))
  // console.log()

  const sport = process.argv[2] ?? "soccer_brazil_campeonato"
  const regions = process.argv[3] ?? "eu"
  const markets = process.argv[4] ?? "h2h"

  console.log(`Fetching odds: sport=${sport}, regions=${regions}, markets=${markets}`)
  const events = await fetchOdds({ sport, regions, markets })
  console.log(`Got ${events.length} events\n`)

  const surebets = detectSurebets(events, { minProfit: 0, maxProfit: 15 })

  if (surebets.length === 0) {
    console.log("No surebets found in current odds.")
    return
  }

  console.log(`Found ${surebets.length} surebet(s):\n`)

  for (const s of surebets) {
    const flag = s.is_suspicious ? " ⚠️ SUSPICIOUS" : ""
    console.log(`${s.home_team} vs ${s.away_team} — ${s.league}`)
    console.log(`  Market: ${s.market_key}${s.line != null ? ` (line ${s.line})` : ""}`)
    console.log(`  Profit: ${s.profit_pct.toFixed(3)}%${flag}`)
    for (const leg of s.legs) {
      console.log(`  • ${leg.selection} @ ${leg.odds} (${leg.bookmaker_name})`)
    }

    const stakes = calcularStakes(s, 1000)
    console.log("  Stakes for R$1.000 investidos:")
    for (const st of stakes) {
      console.log(`    ${st.selection}: R$${st.stake} → payout R$${st.payout}`)
    }
    console.log()
  }
}

main().catch(err => {
  console.error("Error:", err)
  process.exit(1)
})
