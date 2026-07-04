import { chromium } from "playwright";
import pRetry from "p-retry";
import type { NormalizedOdd, Scraper, ScraperResult } from "../lib/types.js";
import { saveOdds } from "../lib/supabase.js";

/**
 * ============================================================
 * SCRAPER — BETANO
 * ============================================================
 *
 * ANTES DE RODAR: você precisa fazer o mesmo processo de DevTools
 * que fizemos com o arbitragem.bet:
 *
 * 1. Abra a Betano no Chrome, F12 → Network → filtro Fetch/XHR
 * 2. Navegue até uma página de esportes (ex: Futebol > Brasileirão)
 * 3. Procure uma chamada que retorna JSON com lista de jogos e odds
 *    (geralmente tem "event", "market", "odds" no nome do endpoint
 *    ou no corpo da resposta)
 * 4. Se achar → copie a Request URL e os headers necessários pra
 *    função `fetchViaInternalApi` abaixo (é MUITO mais rápido e
 *    estável que renderizar a página)
 * 5. Se NÃO achar (site troca tudo via WebSocket, por exemplo) →
 *    use a função `fetchViaPageScrape` abaixo, que renderiza a
 *    página de verdade e lê os seletores do DOM
 *
 * Preencha as duas funções abaixo com o que você encontrar. O
 * resto do arquivo (normalização, retry, salvar no Supabase) já
 * funciona sem precisar mexer.
 */

const BOOKMAKER_SLUG = "betano";

// ------------------------------------------------------------
// OPÇÃO A — via API interna (preencha se encontrar o endpoint)
// ------------------------------------------------------------
async function fetchViaInternalApi(): Promise<NormalizedOdd[]> {
  // TODO: substitua pela Request URL real encontrada no Network tab.
  // Exemplo do formato que costuma aparecer (NÃO é real, é ilustrativo):
  // const url = "https://www.betano.bet.br/api/sport/futebol/events";

  throw new Error(
    "fetchViaInternalApi ainda não implementado — preencha com o endpoint real ou use fetchViaPageScrape"
  );

  // Esqueleto de como ficaria depois de preenchido:
  //
  // const res = await fetch(url, {
  //   headers: {
  //     "User-Agent": "Mozilla/5.0 ...",
  //     "Accept": "application/json",
  //   },
  // });
  // const json = await res.json();
  // return normalizeApiResponse(json);
}

// ------------------------------------------------------------
// OPÇÃO B — via renderização da página (fallback mais lento
// mas funciona em qualquer site, mesmo sem API JSON exposta)
// ------------------------------------------------------------
async function fetchViaPageScrape(): Promise<NormalizedOdd[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  });

  const odds: NormalizedOdd[] = [];

  try {
    // TODO: ajuste a URL pra categoria de esporte/liga que você quer
    await page.goto("https://www.betano.bet.br/sport/futebol/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // TODO: os seletores abaixo são ILUSTRATIVOS — inspecione o DOM
    // real da Betano (botão direito → Inspecionar num card de jogo)
    // e substitua pelos seletores/classes reais.
    const eventCards = await page.$$(".event-card"); // ajustar seletor

    for (const card of eventCards) {
      const homeTeam = await card
        .$eval(".team-home", (el) => el.textContent?.trim())
        .catch(() => null);
      const awayTeam = await card
        .$eval(".team-away", (el) => el.textContent?.trim())
        .catch(() => null);
      const oddHome = await card
        .$eval(".odd-1", (el) => parseFloat(el.textContent ?? "0"))
        .catch(() => null);
      const oddDraw = await card
        .$eval(".odd-x", (el) => parseFloat(el.textContent ?? "0"))
        .catch(() => null);
      const oddAway = await card
        .$eval(".odd-2", (el) => parseFloat(el.textContent ?? "0"))
        .catch(() => null);

      if (!homeTeam || !awayTeam) continue;

      const now = new Date().toISOString();
      const base = {
        bookmaker_slug: BOOKMAKER_SLUG,
        sport: "futebol",
        home_team: homeTeam,
        away_team: awayTeam,
        league: "", // TODO: extrair do card ou do breadcrumb da página
        starts_at: now, // TODO: extrair data/hora real do evento
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

export const betanoScraper: Scraper = {
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

// Permite rodar direto via `npm run scrape:betano`
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await betanoScraper.run();
  console.log(`[betano] capturados: ${result.scraped_count}`);
  if (result.errors.length) console.error(`[betano] erros:`, result.errors);
  if (result.odds.length) {
    const { inserted, errors } = await saveOdds(result.odds);
    console.log(`[betano] salvos no Supabase: ${inserted}`);
    if (errors.length) console.error(`[betano] erros ao salvar:`, errors);
  }
}
