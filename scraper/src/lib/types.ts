/**
 * Formato normalizado que TODO scraper deve produzir,
 * independente de como cada casa expõe os dados internamente.
 *
 * Isso é o contrato entre "scraper de uma casa específica" e
 * "motor de matching/cálculo de surebet" — cada scraper novo
 * só precisa saber transformar o formato da casa PARA isto aqui.
 */

export interface NormalizedOdd {
  bookmaker_slug: string; // ex: "betano", "estrelabet"
  sport: string; // ex: "futebol", "basquete"
  home_team: string;
  away_team: string;
  league: string;
  starts_at: string; // ISO 8601
  market_key: string; // ex: "1x2", "over_under_2.5_gols", "escanteios_over_9.5"
  selection: string; // ex: "home", "away", "draw", "over", "under"
  odds: number; // decimal, ex: 1.95
  line?: number; // ex: 2.5 pra over/under, handicap etc
  scraped_at: string; // ISO 8601, quando o dado foi capturado
  external_event_id?: string; // ID do evento na casa de origem, se disponível
}

export interface ScraperResult {
  bookmaker_slug: string;
  odds: NormalizedOdd[];
  scraped_count: number;
  errors: string[];
}

export interface Scraper {
  slug: string;
  /** Roda uma captura completa e retorna os dados já normalizados */
  run(): Promise<ScraperResult>;
}
