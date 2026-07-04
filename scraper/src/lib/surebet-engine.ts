import { supabase } from "./supabase.js";

/**
 * Motor de detecção de surebet.
 *
 * Lógica: para cada evento + mercado, pega a odd mais recente de
 * cada casa/seleção. Testa todo par de seleções complementares
 * (ex: home de uma casa vs away de outra) e calcula se
 * 1/odd_a + 1/odd_b < 1 → existe arbitragem.
 *
 * Rode isso periodicamente (cron a cada 30-60s) depois que os
 * scrapers já tiverem gravado odds recentes no banco.
 */

const FRESHNESS_WINDOW_SECONDS = 90; // ignora odds mais velhas que isso

interface OddRow {
  event_id: string;
  bookmaker_slug: string;
  market_key: string;
  selection: string;
  odds: number;
  line: number | null;
}

// Pares de seleção que são "opostos" e podem formar surebet
// (mercado de 2 resultados, tipo over/under, sim/não)
const COMPLEMENTARY_PAIRS: Record<string, [string, string]> = {
  over_under: ["over", "under"],
  home_away: ["home", "away"], // só válido em esportes sem empate (basquete, tênis)
};

export async function detectSurebets() {
  const cutoff = new Date(
    Date.now() - FRESHNESS_WINDOW_SECONDS * 1000
  ).toISOString();

  const { data: rows, error } = await supabase
    .from("event_bookmaker_odds")
    .select(
      "event_id, market_key, selection, odds, line, bookmakers(slug)"
    )
    .gte("scraped_at", cutoff);

  if (error || !rows) {
    console.error("Erro ao buscar odds recentes:", error?.message);
    return { detected: 0 };
  }

  const normalizedRows: OddRow[] = rows.map((r: any) => ({
    event_id: r.event_id,
    bookmaker_slug: r.bookmakers.slug,
    market_key: r.market_key,
    selection: r.selection,
    odds: r.odds,
    line: r.line,
  }));

  // Agrupa por evento + mercado + line (pra não comparar over 2.5 com over 3.5)
  const groups = new Map<string, OddRow[]>();
  for (const row of normalizedRows) {
    const key = `${row.event_id}::${row.market_key}::${row.line ?? "na"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  let detected = 0;
  const surebetsToInsert: any[] = [];

  for (const [, group] of groups) {
    // Pega a MELHOR odd disponível por seleção (a mais alta), independente
    // de qual casa oferece — surebet quer o melhor preço de cada lado.
    const bestBySelection = new Map<string, OddRow>();
    for (const row of group) {
      const current = bestBySelection.get(row.selection);
      if (!current || row.odds > current.odds) {
        bestBySelection.set(row.selection, row);
      }
    }

    for (const [, [selA, selB]] of Object.entries(COMPLEMENTARY_PAIRS)) {
      const legA = bestBySelection.get(selA);
      const legB = bestBySelection.get(selB);

      if (!legA || !legB) continue;
      if (legA.bookmaker_slug === legB.bookmaker_slug) continue; // não é surebet real se for a mesma casa

      const impliedSum = 1 / legA.odds + 1 / legB.odds;

      if (impliedSum < 1) {
        const profitPct = (1 / impliedSum - 1) * 100;

        surebetsToInsert.push({
          event_id: legA.event_id,
          market_key: legA.market_key,
          leg_a: {
            bookmaker_slug: legA.bookmaker_slug,
            selection: legA.selection,
            odds: legA.odds,
            line: legA.line,
          },
          leg_b: {
            bookmaker_slug: legB.bookmaker_slug,
            selection: legB.selection,
            odds: legB.odds,
            line: legB.line,
          },
          profit_pct: Number(profitPct.toFixed(3)),
        });
        detected++;
      }
    }
  }

  if (surebetsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("surebets")
      .insert(surebetsToInsert);
    if (insertError) {
      console.error("Erro ao salvar surebets:", insertError.message);
    }
  }

  return { detected };
}
