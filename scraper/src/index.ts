import { betanoScraper } from "./scrapers/betano.js";
import { estrelabetScraper } from "./scrapers/estrelabet.js";
import { saveOdds, logScraperRun } from "./lib/supabase.js";
import { detectSurebets } from "./lib/surebet-engine.js";

const SCRAPERS = [betanoScraper, estrelabetScraper];
const CYCLE_INTERVAL_MS = 60_000; // roda a cada 60s — ajuste conforme necessidade e limites de rate

async function runCycle() {
  const cycleStart = new Date().toISOString();
  console.log(`\n[${cycleStart}] Iniciando ciclo de scraping...`);

  for (const scraper of SCRAPERS) {
    const startedAt = new Date();
    const runErrors: string[] = [];
    let oddsCount = 0;

    try {
      const result = await scraper.run();
      oddsCount = result.scraped_count;
      runErrors.push(...result.errors);

      console.log(
        `  [${scraper.slug}] capturados: ${result.scraped_count}, erros: ${result.errors.length}`
      );
      if (result.errors.length) {
        result.errors.forEach((e) => console.error(`    ! ${e}`));
      }

      if (result.odds.length > 0) {
        const { inserted, errors } = await saveOdds(result.odds);
        console.log(`  [${scraper.slug}] salvos no Supabase: ${inserted}`);
        errors.forEach((e) => {
          console.error(`    ! ${e}`);
          runErrors.push(e);
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [${scraper.slug}] falha inesperada:`, err);
      runErrors.push(msg);
    }

    await logScraperRun({
      bookmakerSlug: scraper.slug,
      startedAt,
      finishedAt: new Date(),
      oddsCount,
      errors: runErrors,
    });
  }

  const { detected } = await detectSurebets();
  console.log(`  Surebets detectados neste ciclo: ${detected}`);
}

async function main() {
  console.log("SurebetFlow scraper worker iniciado.");
  console.log(`Casas ativas: ${SCRAPERS.map((s) => s.slug).join(", ")}`);
  console.log(`Intervalo entre ciclos: ${CYCLE_INTERVAL_MS / 1000}s\n`);

  // roda imediatamente e depois no intervalo definido
  await runCycle();
  setInterval(runCycle, CYCLE_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Erro fatal no worker:", err);
  process.exit(1);
});
