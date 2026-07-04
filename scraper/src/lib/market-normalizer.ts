/**
 * ============================================================
 * NORMALIZAÇÃO DE MERCADOS — SurebetFlow
 * ============================================================
 *
 * Este é o "cérebro" que traduz o texto livre de mercado de CADA
 * casa de apostas para uma chave canônica comum, para que o motor
 * de surebet consiga comparar lados opostos.
 *
 * Foi construído a partir dos padrões REAIS observados nos dados
 * (arbitragem.bet usa o mesmo vocabulário do fornecedor de dados
 * padrão do mercado, então serve de base sólida).
 *
 * O objetivo da função `parseMarket` é transformar algo como:
 *   "Total acima 8 (Total Europeu) - escanteios"
 * em um objeto estruturado:
 *   {
 *     canonical_market: "total_escanteios",
 *     selection: "over",
 *     line: 8,
 *     period: "match",
 *     team_scope: "both",
 *   }
 *
 * Duas apostas formam surebet quando têm o MESMO
 * (canonical_market + period + team_scope) e selections opostas.
 * A `line` entra na lógica de "middle" (linhas diferentes = surebet
 * especial, não igualdade exata).
 */

export type Selection =
  | "over"
  | "under"
  | "home"
  | "away"
  | "draw"
  | "home_or_draw" // 1X
  | "draw_or_away" // X2
  | "yes"
  | "no"
  | "lay"; // aposta contra (exchange)

export type Period =
  | "match" // jogo inteiro
  | "1st_half"
  | "2nd_half"
  | "1st_period"
  | "2nd_period"
  | "overtime" // inclui tempo extra
  | "1st_inning" // beisebol
  | "1st_set"; // tênis

export type TeamScope = "both" | "home_team" | "away_team";

export interface ParsedMarket {
  canonical_market: string; // ex: "total_escanteios", "1x2", "handicap_asiatico_gols"
  selection: Selection;
  line: number | null; // ex: 8.5, +2.5, -0.5 (handicap); null se não aplicável
  period: Period;
  team_scope: TeamScope;
  raw: string; // o texto original, pra debug e pra alimentar a fila de "não reconhecidos"
  recognized: boolean; // false se caímos no fallback — vai pra fila de revisão no admin
}

// ------------------------------------------------------------
// Dicionário de "categoria de estatística" → chave canônica base
// A ordem importa: padrões mais específicos primeiro.
// ------------------------------------------------------------
const STAT_CATEGORIES: { pattern: RegExp; key: string }[] = [
  { pattern: /escanteios/i, key: "escanteios" },
  { pattern: /cart[õo]es/i, key: "cartoes" },
  { pattern: /arremessos laterais/i, key: "arremessos_laterais" },
  { pattern: /tiros de meta/i, key: "tiros_meta" },
  { pattern: /impedimentos/i, key: "impedimentos" },
  { pattern: /chutes/i, key: "chutes" },
  { pattern: /\baces\b/i, key: "aces" },
  { pattern: /\bhits\b/i, key: "hits" },
  { pattern: /\btries\b/i, key: "tries" },
  { pattern: /corridas/i, key: "corridas" }, // beisebol "runs"
  { pattern: /\bsets\b/i, key: "sets" },
  { pattern: /\bpontos\b/i, key: "pontos" },
  { pattern: /\bgols?\b/i, key: "gols" },
];

// ------------------------------------------------------------
// Período do evento
// ------------------------------------------------------------
function detectPeriod(text: string): Period {
  const t = text.toLowerCase();
  if (/tempo extra|overtime/.test(t)) return "overtime";
  if (/1ª metade|1a metade|primeira metade/.test(t)) return "1st_half";
  if (/2ª metade|2a metade|segunda metade/.test(t)) return "2nd_half";
  if (/1º período|1o período|1º periodo|primeiro período/.test(t))
    return "1st_period";
  if (/2º período|2o período|2º periodo|segundo período/.test(t))
    return "2nd_period";
  if (/1ª entrada|1a entrada|primeira entrada/.test(t)) return "1st_inning";
  if (/1º set|1o set|primeiro set/.test(t)) return "1st_set";
  return "match";
}

// ------------------------------------------------------------
// Escopo de time (o mercado é do jogo todo, do mandante ou visitante?)
// "1º o time" = mandante, "2º o time" = visitante, sem menção = ambos
// ------------------------------------------------------------
function detectTeamScope(text: string): TeamScope {
  const t = text.toLowerCase();
  if (/1º o time|1o o time|1º time|primeiro time|1º o participante|1º set - aces/.test(t))
    return "home_team";
  if (/2º o time|2o o time|2º time|segundo time|2º o participante/.test(t))
    return "away_team";
  return "both";
}

// ------------------------------------------------------------
// Extrai a linha numérica (over/under, handicap, margem)
// Ex: "acima 8.5" -> 8.5 ; "H1(+2.5)" -> 2.5 ; "≥3" -> 3
// ------------------------------------------------------------
function extractLine(text: string): number | null {
  // handicap tipo H1(+2.5), H2(−2.5), (+0.5), (−0.5)
  const handicapMatch = text.match(/[(]?([+−-]\d+(?:\.\d+)?)[)]?/);
  if (handicapMatch) {
    const val = handicapMatch[1].replace("−", "-");
    return parseFloat(val);
  }
  // "acima 8.5", "abaixo 9", "over 2.5"
  const overUnderMatch = text.match(/(?:acima|abaixo|over|under)\s+(\d+(?:\.\d+)?)/i);
  if (overUnderMatch) return parseFloat(overUnderMatch[1]);
  // "≥3", "≥21", "≥11"
  const geMatch = text.match(/≥\s*(\d+(?:\.\d+)?)/);
  if (geMatch) return parseFloat(geMatch[1]);
  // handicap europeu tipo (0:1), (4:0)
  const euroHandicap = text.match(/[(](\d+):(\d+)[)]/);
  if (euroHandicap) {
    return parseInt(euroHandicap[2]) - parseInt(euroHandicap[1]);
  }
  return null;
}

// ------------------------------------------------------------
// Detecta a seleção (qual lado da aposta)
// ------------------------------------------------------------
function detectSelection(text: string): Selection | null {
  const t = text.toLowerCase();

  // lay / chance contra (exchange) — checar primeiro de tudo
  if (/lay|chance contra|\(contra\)/.test(t)) return "lay";

  // dupla chance — antes de home/away pra não confundir "vence ou empate"
  if (/\b1x\b|vence ou empate|time 1 vence ou empate/.test(t))
    return "home_or_draw";
  if (/\bx2\b|empate ou.*vence/.test(t)) return "draw_or_away";

  // over/under / totais / corridas sim-não / margem
  if (/\bacima\b|\bover\b|≥|corridas:\s*sim|margem/.test(t)) return "over";
  if (/\babaixo\b|\bunder\b|corridas:\s*n[ãa]o/.test(t)) return "under";

  // empate puro (moneyline draw) — mas não se for x2/1x já tratado
  if (/\bempate\b/.test(t) && !/vence/.test(t)) return "draw";
  // "vence (sem empate)" em tênis/basquete é moneyline; o lado é dado
  // pelo prefixo 1 ou 2 no texto curto — tratado abaixo.

  // HOME: prefixo "1", "H1(", "1 / DNB", ou "<time A> vence [com handicap ...]"
  // O parser recebe TANTO o título longo ("Fulano vence...") quanto o
  // código curto ("H1(+2.5)", "1", "2(0:1)"). Cobrimos ambos.
  if (/^h1\b|\bh1\(|^1\b|^1\s|\b1 \/ dnb\b|^1\(|1<sup|\(0\.5\).*1/.test(t))
    return "home";
  if (/^h2\b|\bh2\(|^2\b|^2\s|\b2 \/ dnb\b|^2\(|2<sup/.test(t)) return "away";

  // Título longo: "<qualquer time> vence ..." sem marcador 1/2.
  // Nesse caso o LADO não dá pra saber só pelo texto do mercado — ele
  // vem do campo separado (prong/0 = home, prong/1 = away na URL).
  // Retornamos "home" como placeholder e deixamos o scraper sobrescrever
  // com o lado correto vindo do prong. Marcamos via flag no chamador.
  if (/\bvence\b/.test(t)) return "home"; // lado real vem do prong index

  // sim/não genérico (ambos marcam etc)
  if (/\bsim\b/.test(t)) return "yes";
  if (/\bn[ãa]o\b/.test(t)) return "no";

  return null;
}

// ------------------------------------------------------------
// Monta a chave canônica do mercado combinando estatística + tipo
// ------------------------------------------------------------
function buildCanonicalMarket(text: string, stat: string): string {
  const t = text.toLowerCase();

  // Handicap asiático
  if (/handicap asi[áa]tico/.test(t)) return `handicap_asiatico_${stat}`;
  // Handicap europeu (3-way)
  if (/handicap europeu|\(\d+:\d+\)/.test(t)) return `handicap_europeu_${stat}`;
  // Draw No Bet
  if (/draw no bet|\/ dnb/.test(t)) return `dnb_${stat}`;
  // Dupla chance
  if (/1x|x2/.test(t) && !/handicap/.test(t)) return `dupla_chance_${stat}`;
  // Total over/under (o mais comum)
  if (/acima|abaixo|over|under|≥/.test(t)) return `total_${stat}`;
  // Resultado simples 1x2 / moneyline
  if (/vence|empate/.test(t)) {
    return stat === "sets" || stat === "pontos" ? `moneyline_${stat}` : `1x2_${stat}`;
  }
  // Corridas (beisebol): "Corridas: Sim/Não 1ª entrada" é um mercado
  // yes/no sobre marcar corrida — canônico próprio
  if (/corridas:/.test(t)) return `corridas_sim_nao`;
  // Ambos marcam / sim-não
  if (/ambos/.test(t)) return `ambos_${stat}`;

  return `desconhecido_${stat}`;
}

// ------------------------------------------------------------
// Função principal
// ------------------------------------------------------------
export function parseMarket(rawText: string): ParsedMarket {
  // Limpa tags HTML que às vezes vêm no data_market
  const text = rawText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // 1. Categoria de estatística
  const statCat = STAT_CATEGORIES.find((s) => s.pattern.test(text));
  const stat = statCat?.key ?? "desconhecido";

  // 2. Componentes
  const selection = detectSelection(text);
  const line = extractLine(text);
  const period = detectPeriod(text);
  const team_scope = detectTeamScope(text);
  const canonical_market = buildCanonicalMarket(text, stat);

  const recognized =
    selection !== null &&
    stat !== "desconhecido" &&
    !canonical_market.startsWith("desconhecido");

  return {
    canonical_market,
    selection: selection ?? "over", // fallback só pra não quebrar tipo; recognized=false marca pra revisão
    line,
    period,
    team_scope,
    raw: rawText,
    recognized,
  };
}

/**
 * Determina se duas apostas parseadas são LADOS OPOSTOS do mesmo
 * mercado (condição necessária pra ser surebet).
 */
const OPPOSITE_SELECTIONS: Record<Selection, Selection[]> = {
  over: ["under"],
  under: ["over"],
  home: ["away", "draw_or_away"],
  away: ["home", "home_or_draw"],
  draw: [],
  home_or_draw: ["away"],
  draw_or_away: ["home"],
  yes: ["no"],
  no: ["yes"],
  lay: [], // lay casa com a mesma seleção "a favor" em outra casa — lógica à parte
};

export function areOpposite(a: ParsedMarket, b: ParsedMarket): boolean {
  if (a.canonical_market !== b.canonical_market) return false;
  if (a.period !== b.period) return false;
  if (a.team_scope !== b.team_scope) return false;
  return OPPOSITE_SELECTIONS[a.selection]?.includes(b.selection) ?? false;
}
