# PKA A/S — Omkostningsbase 2025

Webapp, der viser PKA A/S' omkostningsbase for 2025 som dashboard. Senere skal appen kunne
besvare spørgsmål til tallene på dansk (spørgefunktionen er endnu ikke bygget).

## Tekniske valg (fastlagt — afvig ikke uden at spørge)

| Område | Valg | Må ikke |
|---|---|---|
| Runtime + bundler | Bun, `Bun.serve` med HTML-import af `index.html` | Vite, Next.js, Webpack |
| UI | React 19 + TypeScript | — |
| Styling | Tailwind v4 via `bun-plugin-tailwind`, komponenter i shadcn-stil (egne filer under `src/components/ui/`) | shadcn CLI, komponentbiblioteker udefra |
| Database | `bun:sqlite`, åbnet `{ readonly: true }` | Skrivninger, migrationer, ORM |
| Grafer | Recharts | Chart.js, D3 direkte |
| Spørg-panel | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`), model `claude-sonnet-5` | Anthropic SDK direkte, andre modeller |
| Sprog | Alt UI-tekst på dansk, dansk talformat via `Intl.NumberFormat("da-DK")` | Engelsk UI, `toLocaleString()` uden locale |
| Ikoner | `lucide-react`, konkrete domæneikoner | Emojis. Sparkle/magic-ikoner (`Sparkles`, `Sparkle`, `WandSparkles`) |

## Farver

Defineret som Tailwind-tokens i `src/styles/globals.css` under `@theme`.

| Rolle | Hex | Token |
|---|---|---|
| Primær (PKA-rød) | `#92004D` | `pka-roed` |
| Overskrifter (bordeaux) | `#660036` | `pka-bordeaux` |
| Aktive elementer (rubinrød) | `#CE0060` | `pka-rubin` |
| Graf 1 | `#6E9BAA` | `graf-1` |
| Graf 2 | `#9EDFCE` | `graf-2` |
| Graf 3 | `#C5AED5` | `graf-3` |
| Graf 4 | `#EFC47C` | `graf-4` |
| Graf 5 | `#E88F80` | `graf-5` |
| Graf 6 | `#85B499` | `graf-6` |

Grafarkitekturen bruger kun graf-farverne — aldrig PKA-rød/bordeaux/rubin som dataserie.
De seks grafarver mapper 1:1 til de seks kontogrupper, se `src/lib/theme.ts`.

## Data

`data/finanskube-2025.sqlite` — syntetisk udtræk fra Finanskuben, kalenderåret 2025.
Alle tal, kreditorer og navne er opdigtede. Datamodellen er beskrevet i `data/DATAMODEL.md`;
læs den før nye forespørgsler. Filen læses **altid read-only**.

Tabeller: `transaktioner` (~3.300 rækker), `kontoplan` (27), `kreditorer` (32),
`omkostningssteder` (8), `fordelingsnoegle`, `kontroltotaler` (12).

Beløbskonvention: `beloeb` er ekskl. moms og er det, dashboardet regner omkostningsbase på.
`moms` vises separat og lægges ikke til omkostningsbasen.

## Spørg-panel

Brugeren skriver et spørgsmål på dansk og får fire ting: den SQL der blev kørt, en forklaring
på almindeligt dansk af hvad forespørgslen gør **og hvad den ikke tager højde for**, resultatet
som tabel, og en graf når resultatet egner sig til det.

To tilstande, vist som mærkat øverst i panelet og logget ved opstart:

| Tilstand | Hvornår | Hvad sker der |
|---|---|---|
| Claude | `ANTHROPIC_API_KEY` er sat i `.env` | Spørgsmålet oversættes til SQL af `claude-sonnet-5` via `generateObject` |
| Eksempelsvar | Ingen nøgle | Spørgsmålet matches mod `src/eksempelsvar.ts` på nøgleord |

I begge tilstande køres SQL'en rigtigt mod databasen — eksempelsvarene har håndskrevet SQL,
ikke hardcodede tal. Ved Claude-fejl gives ét ekstra forsøg med afvisningen som rettelse.

### Rapporter

Knappen "Gem som rapport" ved svaret skriver en Markdown-fil i `rapporter/` med spørgsmålet,
forklaringen, forbeholdene, resultattabellen og SQL'en, og viser filnavnet når den er gemt.
Filnavnet dannes altid på serveren som `ÅÅÅÅ-MM-DD-<slug af spørgsmålet>.md` — klienten
bestemmer aldrig stien. Findes navnet i forvejen, tilføjes `-2`, `-3` osv. frem for at
overskrive. Rapporter fra eksempelsvar får en linje om, at SQL'en kommer fra det faste sæt.

### Sikkerhed

`src/sql-vagt.ts` er eneste vej ind i databasen for SQL udefra, og `koerLaesning()` kalder den
altid. Vagten kræver én enkelt SELECT/WITH, afviser en liste af skrivende nøgleord, og kræver at
alle kilder efter FROM/JOIN står i tabel-allowlisten (CTE-navne tælles med). Strenge og
kommentarer fjernes før nøgleordstjekket, så en posteringstekst med ordet "opdatering" ikke
udløser en afvisning. Prompten er en instruktion, ikke en sikkerhedsgrænse — stram vagten,
ikke prompten.

## Struktur

```
index.html              indgang, importeres af serveren
bunfig.toml             registrerer bun-plugin-tailwind for serve.static (påkrævet, se nedenfor)
.env                    ANTHROPIC_API_KEY (Bun indlæser selv filen)
rapporter/              gemte svar som Markdown, dannes ved første gemning
src/server.ts           Bun.serve: HTML-route + /api/dashboard, /api/status, /api/eksempler,
                        /api/spoerg, /api/rapport
src/rapport.ts          bygger og gemmer Markdown-rapporten
src/db.ts               read-only forbindelse, dashboard-SQL og koerLaesning() til frie forespørgsler
src/sql-vagt.ts         godkender SQL udefra — kun læsning
src/ai.ts               Claude via Vercel AI SDK, skema for svaret
src/eksempelsvar.ts     fast sæt svar uden API-nøgle
src/spoerg.ts           spørgsmål → SQL → kørsel → svar
src/types.ts            delte typer mellem server og klient
src/App.tsx             dashboard-layout + spørg-panel
src/components/         domænekomponenter + ui/ i shadcn-stil
src/lib/format.ts       dansk tal-, kr.- og procentformatering
src/lib/theme.ts        graffarver og kontogruppe-mapping
```

## Kommandoer

`bunfig.toml` skal indeholde præcis dette, ellers bliver Tailwind ikke oversat, når
`Bun.serve` bundler `index.html`:

```toml
[serve.static]
plugins = ["bun-plugin-tailwind"]
```

```bash
bun install
bun dev     # --hot, http://localhost:3000
bun start   # uden hot reload
```

`.env` i projektroden (Bun indlæser den selv, ingen dotenv-pakke):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Tilstanden læses ved opstart. Efter en ændring i `.env` skal serveren genstartes.

## Konventioner

- Al SQL bor i `src/db.ts`. Komponenter kalder aldrig databasen direkte.
- Serveren returnerer færdigt aggregerede tal; klienten laver ikke forretningslogik.
- Danske feltnavne i datamodellen beholdes uændret i typer og API-svar (`beloeb`,
  `kontogruppe`, `kreditornavn`) — oversæt ikke til engelsk.
- Tal formateres kun i visningslaget, aldrig i API-svaret.
- SQL udefra går altid gennem `godkendLaesning()` — kald aldrig `db.prepare` direkte på den.
- Frie forespørgsler skal give kolonnerne danske snake_case-aliasser (`beloeb`, `pct_andel`).
  `formatVaerdi()` vælger enhed ud fra kolonnenavnet, så et dårligt alias giver et forkert format.
