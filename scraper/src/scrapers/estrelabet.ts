import { chromium } from "playwright";
import pRetry from "p-retry";
import type { NormalizedOdd, Scraper, ScraperResult } from "../lib/types.js";
import { saveOdds } from "../lib/supabase.js";

/**
 * ============================================================
 * SCRAPER — ESTRELABET
 * ============================================================
 * Mesmo processo do betano.ts: inspecione o Network tab do
 * estrelabet.bet.br primeiro, procure endpoint JSON interno.
 * Se não achar, use o fallback de renderização de página.
 */

const BOOKMAKER_SLUG = "estrelabet";

async function fetchViaInternalApi(): Promise<NormalizedOdd[]> {
  // TODO: preencher com endpoint real encontrado no DevTools
  throw new Error(
    "fetchViaInternalApi ainda não implementado — preencha com o endpoint real ou use fetchViaPageScrape"
  );
}

async function fetchViaPageScrape(): Promise<NormalizedOdd[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  });

  const odds: NormalizedOdd[] = [];

  try {
    // TODO: ajustar URL de categoria
    await page.goto("https://estrelabet.bet.br/pt-br/sport/futebol", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // TODO: seletores ilustrativos — inspecionar DOM real
    const eventCards = await page.$$(".event-row");

    for (const card of eventCards) {
      const homeTeam = await card
        .$eval("[data-team='home']", (el) => el.textContent?.trim())
        .catch(() => null);
      const awayTeam = await card
        .$eval("[data-team='away']", (el) => el.textContent?.trim())
        .catch(() => null);
      const oddHome = await card
        .$eval("[data-odd='1']", (el) => parseFloat(el.textContent ?? "0"))
        .catch(() => null);
      const oddDraw = await card
        .$eval("[data-odd='x']", (el) => parseFloat(el.textContent ?? "0"))
        .catch(() => null);
      const oddAway = await card
        .$eval("[data-odd='2']", (el) => parseFloat(el.textContent ?? "0"))
        .catch(() => null);

      if (!homeTeam || !awayTeam) continue;

      const now = new Date().toISOString();
      const base = {
        bookmaker_slug: BOOKMAKER_SLUG,
        sport: "futebol",
        home_team: homeTeam,
        away_team: awayTeam,
        league: "",
        starts_at: now, // TODO: extrair data/hora real
        market_key: "1x2",
        scraped_at: now,
      };

      if (oddHome) odds.push({ ...base, selection: "home", odds: oddHome });
      if (oddDraw) odds.push({ ...base, selection: "draw", odds: oddDraw });
      if (oddAway) odds.push({ ...base, selection: "away", odds: oddAway });
    }
  } finally {
    await browser.close();
  }

  return odds;
}

export const estrelabetScraper: Scraper = {
  slug: BOOKMAKER_SLUG,
  async run(): Promise<ScraperResult> {
    const errors: string[] = [];
    let odds: NormalizedOdd[] = [];

    try {
      odds = await pRetry(fetchViaInternalApi, { retries: 1 });
    } catch (apiErr) {
      try {
        odds = await pRetry(fetchViaPageScrape, { retries: 2 });
      } catch (scrapeErr) {
        errors.push(
          `Ambos os métodos falharam. API: ${(apiErr as Error).message} | Scrape: ${(scrapeErr as Error).message}`
        );
      }
    }

    return {
      bookmaker_slug: BOOKMAKER_SLUG,
      odds,
      scraped_count: odds.length,
      errors,
    };
  },
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await estrelabetScraper.run();
  console.log(`[estrelabet] capturados: ${result.scraped_count}`);
  if (result.errors.length)
    console.error(`[estrelabet] erros:`, result.errors);
  if (result.odds.length) {
    const { inserted, errors } = await saveOdds(result.odds);
    console.log(`[estrelabet] salvos no Supabase: ${inserted}`);
    if (errors.length)
      console.error(`[estrelabet] erros ao salvar:`, errors);
  }
}
