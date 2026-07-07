export interface OddsApiOutcome {
  name: string
  price: number
  point?: number
}

export interface OddsApiMarket {
  key: string
  last_update: string
  outcomes: OddsApiOutcome[]
}

export interface OddsApiBookmaker {
  key: string
  title: string
  last_update: string
  markets: OddsApiMarket[]
}

export interface OddsApiEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsApiBookmaker[]
}

export interface OddsApiSport {
  key: string
  group: string
  title: string
  description: string
  active: boolean
  has_outrights: boolean
}

interface FetchOddsParams {
  sport: string
  regions?: string
  markets?: string
}

const BASE_URL = "https://api.the-odds-api.com/v4"

function getApiKey(): string {
  const key = process.env.ODDS_API_KEY
  if (!key) throw new Error("ODDS_API_KEY environment variable is not set")
  return key
}

export async function fetchOdds({
  sport,
  regions = "eu",
  markets = "h2h",
}: FetchOddsParams): Promise<OddsApiEvent[]> {
  const apiKey = getApiKey()
  const url = `${BASE_URL}/sports/${sport}/odds/?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=decimal`

  const res = await fetch(url)

  const remaining = res.headers.get("x-requests-remaining")
  const used = res.headers.get("x-requests-used")
  console.log(`[OddsAPI] requests used: ${used}, remaining: ${remaining}`)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OddsAPI error ${res.status}: ${text}`)
  }

  const data: OddsApiEvent[] = await res.json()
  return data
}

export async function fetchSports(): Promise<OddsApiSport[]> {
  const apiKey = getApiKey()
  const url = `${BASE_URL}/sports/?apiKey=${apiKey}`

  const res = await fetch(url)

  const remaining = res.headers.get("x-requests-remaining")
  console.log(`[OddsAPI] fetchSports — requests remaining: ${remaining}`)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OddsAPI error ${res.status}: ${text}`)
  }

  const data: OddsApiSport[] = await res.json()
  return data
}
