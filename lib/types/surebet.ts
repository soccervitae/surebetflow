export interface SurebetLeg {
  bookmaker_slug: string
  bookmaker_name: string
  selection: string
  odds: number
  line: number | null
}

export interface SurebetRow {
  id: string
  market_key: string
  profit_pct: number
  detected_at: string
  expires_at: string | null
  sport: string
  home_team: string
  away_team: string
  league: string
  starts_at: string
  leg_a: SurebetLeg
  leg_b: SurebetLeg
}
