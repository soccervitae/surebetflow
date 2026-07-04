# SurebetFlow — Scraper Worker (Betano + EstrelaBet)

## O que já está pronto

- Estrutura completa: tipos normalizados, salvamento no Supabase, motor de
  detecção de surebet (compara odds entre as duas casas e calcula profit%).
- Schema SQL (`schema.sql`) com as tabelas `bookmakers`, `events`,
  `event_bookmaker_odds`, `surebets`.
- Orquestrador (`src/index.ts`) que roda os dois scrapers em loop e detecta
  surebets automaticamente a cada ciclo.
- Fallback com Playwright que renderiza a página de verdade — funciona
  mesmo se você não achar uma API JSON interna.

## O que você precisa preencher (não dá pra fazer sem acesso ao site ao vivo)

### 1. Rodar o schema no Supabase
Cole o conteúdo de `schema.sql` no SQL Editor do seu projeto Supabase
(ou peça pra eu rodar via MCP, já que você tem ele conectado).

### 2. Achar o endpoint interno OU os seletores certos

Pra cada casa (`betano.ts` e `estrelabet.ts`), repita o processo que
fizemos com o arbitragem.bet:

1. Abra o site num navegador normal (não no ambiente de scraping)
2. F12 → aba Network → filtro **Fetch/XHR**
3. Navegue até uma página de jogos (ex: Futebol ao vivo)
4. Dê refresh e procure uma chamada que retorna JSON com odds/eventos
   - Se achar → copie a Request URL completa e cole em
     `fetchViaInternalApi()` no arquivo do scraper correspondente
   - Se não achar (dados só aparecem via WebSocket ou renderização
     client-side pesada) → use o plano B abaixo

5. Plano B — seletores do DOM:
   - Botão direito num card de jogo → **Inspecionar**
   - Anote a classe/atributo do card do jogo, do nome de cada time,
     e de cada odd (casa/empate/fora)
   - Substitua os seletores marcados com `TODO` em `fetchViaPageScrape()`

### 3. Ajustar `starts_at` e `league`

Os scrapers atualmente preenchem `starts_at` com a hora corrente como
placeholder — você precisa extrair a data/hora real do jogo do card
(geralmente tem um elemento tipo `<time>` ou atributo `data-start-time`).

## Como rodar

```bash
npm install
npx playwright install chromium   # baixa o browser headless
cp .env.example .env              # preencha com suas credenciais do Supabase
npm run scrape:betano             # testa só o scraper da Betano
npm run scrape:estrelabet         # testa só o scraper da EstrelaBet
npm run dev                       # roda o worker completo em loop
```

## Próximos passos depois que os dois scrapers estiverem validados

1. Adicionar mais casas (mesma estrutura, um arquivo por casa em `src/scrapers/`)
2. Trocar `1x2` fixo por detecção de múltiplos mercados (over/under, escanteios,
   cartões) — o `market_key` já está preparado pra isso, só falta os scrapers
   capturarem mais mercados além do resultado principal
3. Trocar o `setInterval` simples por um scheduler mais robusto (ex: BullMQ
   com Redis) se o volume de casas crescer — hoje com 2 casas o setInterval
   é suficiente
4. Ligar o Supabase Realtime na tabela `surebets` pro frontend do SurebetFlow
   receber os alertas instantaneamente, sem polling
5. Mover o `COMPLEMENTARY_PAIRS` do motor de matching pra cobrir mercados de
   3 resultados (1X2 com empate) usando a fórmula de 3 pernas em vez de 2
