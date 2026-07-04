/**
 * PATCH DO WORKER — cole esta função no orquestrador principal do scraper
 * (arquivo: src/index.ts ou equivalente, onde o loop de scrapers é executado)
 *
 * Requisitos:
 *   npm install @supabase/supabase-js   (já deve estar instalado)
 *
 * Variáveis de ambiente necessárias (já devem existir no worker):
 *   SUPABASE_URL=https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_key>  ← use service role, não anon
 */

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ScraperRunPayload {
  bookmakerSlug: string   // ex: "betano" — usado para resolver o bookmaker_id
  startedAt: Date
  finishedAt: Date
  oddsCount: number       // equivalente a scraped_count no worker atual
  errors: string[]        // array de mensagens de erro coletados durante a execução
}

export async function logScraperRun(payload: ScraperRunPayload): Promise<void> {
  // Resolve bookmaker_id a partir do slug
  const { data: bookmaker } = await supabase
    .from("bookmakers")
    .select("id")
    .eq("slug", payload.bookmakerSlug)
    .maybeSingle()

  // Determina status
  const status =
    payload.errors.length > 0 && payload.oddsCount === 0
      ? "error"
      : payload.errors.length > 0
      ? "partial"
      : "success"

  const { error } = await supabase.from("scraper_runs").insert({
    bookmaker_id: bookmaker?.id ?? null,
    started_at: payload.startedAt.toISOString(),
    finished_at: payload.finishedAt.toISOString(),
    odds_count: payload.oddsCount,
    status,
    errors: payload.errors,
  })

  if (error) {
    console.error("[logScraperRun] Falha ao gravar run:", error.message)
  }
}

/**
 * EXEMPLO DE USO no orquestrador (src/index.ts):
 *
 * import { logScraperRun } from "./logScraperRun"
 *
 * for (const scraper of scrapers) {
 *   const startedAt = new Date()
 *   const errors: string[] = []
 *   let oddsCount = 0
 *
 *   try {
 *     const result = await scraper.run()
 *     oddsCount = result.scraped_count
 *     if (result.errors?.length) errors.push(...result.errors.map(String))
 *   } catch (err) {
 *     errors.push(String(err))
 *   }
 *
 *   await logScraperRun({
 *     bookmakerSlug: scraper.slug,   // ex: "betano", "bet365"
 *     startedAt,
 *     finishedAt: new Date(),
 *     oddsCount,
 *     errors,
 *   })
 * }
 */
