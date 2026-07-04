import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import type { NormalizedOdd } from "./types.js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
// Use a service_role key aqui (nunca a anon key) — este código roda
// só no seu worker/VPS, nunca no browser do usuário final.
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar no .env"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Insere odds normalizadas no Supabase.
 * Assume as tabelas do schema em `schema.sql` (bookmakers, events,
 * event_bookmaker_odds). Faz upsert de evento por (home+away+starts_at)
 * e insert de odd — a tabela de odds guarda histórico (não faz upsert),
 * pra você poder ver a evolução da odd ao longo do tempo se quiser.
 */
export async function saveOdds(odds: NormalizedOdd[]) {
  if (odds.length === 0) return { inserted: 0, errors: [] as string[] };

  const errors: string[] = [];
  let inserted = 0;

  // Agrupa por evento pra minimizar round-trips
  const eventKey = (o: NormalizedOdd) =>
    `${o.home_team}::${o.away_team}::${o.starts_at}`;

  const eventsMap = new Map<string, NormalizedOdd>();
  for (const o of odds) {
    if (!eventsMap.has(eventKey(o))) eventsMap.set(eventKey(o), o);
  }

  for (const [, sample] of eventsMap) {
    const { data: bookmaker, error: bmError } = await supabase
      .from("bookmakers")
      .select("id")
      .eq("slug", sample.bookmaker_slug)
      .single();

    if (bmError || !bookmaker) {
      errors.push(
        `Bookmaker "${sample.bookmaker_slug}" não cadastrado na tabela bookmakers. Rode o seed primeiro.`
      );
      continue;
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .upsert(
        {
          sport: sample.sport,
          home_team: sample.home_team,
          away_team: sample.away_team,
          league: sample.league,
          starts_at: sample.starts_at,
        },
        { onConflict: "home_team,away_team,starts_at", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (eventError || !event) {
      errors.push(`Erro ao salvar evento: ${eventError?.message}`);
      continue;
    }

    const rowsForThisEvent = odds
      .filter((o) => eventKey(o) === eventKey(sample))
      .map((o) => ({
        event_id: event.id,
        bookmaker_id: bookmaker.id,
        market_key: o.market_key,
        selection: o.selection,
        odds: o.odds,
        line: o.line ?? null,
        scraped_at: o.scraped_at,
      }));

    const { error: oddsError, count } = await supabase
      .from("event_bookmaker_odds")
      .insert(rowsForThisEvent);

    if (oddsError) {
      errors.push(`Erro ao salvar odds: ${oddsError.message}`);
    } else {
      inserted += rowsForThisEvent.length;
    }
  }

  return { inserted, errors };
}

/**
 * Grava uma linha em `scraper_runs` ao final de cada execução de scraper.
 * Chame isso no loop principal (src/index.ts) após cada scraper.run().
 */
export async function logScraperRun(payload: {
  bookmakerSlug: string;
  startedAt: Date;
  finishedAt: Date;
  oddsCount: number;
  errors: string[];
}): Promise<void> {
  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("id")
    .eq("slug", payload.bookmakerSlug)
    .maybeSingle();

  const status =
    payload.errors.length > 0 && payload.oddsCount === 0
      ? "error"
      : payload.errors.length > 0
      ? "partial"
      : "success";

  const { error } = await supabase.from("scraper_runs").insert({
    bookmaker_id: bookmaker?.id ?? null,
    started_at: payload.startedAt.toISOString(),
    finished_at: payload.finishedAt.toISOString(),
    odds_count: payload.oddsCount,
    status,
    errors: payload.errors,
  });

  if (error) {
    console.error(`[logScraperRun] Falha ao gravar run para "${payload.bookmakerSlug}":`, error.message);
  }
}
