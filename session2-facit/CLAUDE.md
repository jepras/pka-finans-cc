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

## Se data

Knappen "Se data" i headeren åbner et panel med databasens seks tabeller som kort: kolonner
med type, én sætning om hvad en række er, og antal rækker. Linjer mellem kortene viser, hvilken
kolonne der binder to tabeller sammen, med den mest forbundne tabel (transaktioner) i midten.
Klik på et kort henter de første 20 rækker af tabellen og viser dem med dansk talformat.
Er der et svar i spørg-panelet, fremhæves de tabeller, svarets SQL læste fra.

Skemaet læses af databasen selv (`sqlite_master`, `PRAGMA table_info`), ikke af en fast liste,
så panelet også virker med et andet udtræk. Sammenhængene tages fra erklærede fremmednøgler,
hvis filen har dem, og udledes ellers af skemaet: samme kolonnenavn i to tabeller, hvor
værdierne er entydige i mindst den ene. Beskrivelserne af de kendte tabeller står i
`src/skema.ts`; en ukendt tabel får en sætning dannet ud fra sin nøgle.

## Spørg-panel

Brugeren skriver et spørgsmål på dansk og får fire ting: den SQL der blev kørt, en forklaring
på almindeligt dansk af hvad forespørgslen gør **og hvad den ikke tager højde for**, resultatet
som tabel, og en graf når resultatet egner sig til det.

To tilstande, vist som mærkat øverst i panelet og logget ved opstart:

| Tilstand | Hvornår | Hvad sker der |
|---|---|---|
| Claude | Der er sat en API-nøgle, fra `.env` ved opstart eller fra feltet i appen | Spørgsmålet oversættes til SQL af `claude-sonnet-5` via `generateObject` |
| Eksempelsvar | Ingen nøgle | Spørgsmålet matches mod `src/eksempelsvar.ts` på nøgleord |

I begge tilstande køres SQL'en rigtigt mod databasen — eksempelsvarene har håndskrevet SQL,
ikke hardcodede tal. Ved Claude-fejl gives ét ekstra forsøg med afvisningen som rettelse.

### API-nøgle fra appen

Feltet øverst i spørg-panelet tager en nøgle, og mærkatet ved siden af viser, om appen kører
med Claude eller med eksempelsvar. `POST /api/noegle` tjekker formen, lægger nøglen i
hukommelsen som den, `src/ai.ts` bygger sin klient af ved hvert kald, og skriver den til
`.env`, så den også gælder næste opstart. Skiftet sker uden genstart og uden genindlæsning:
serveren svarer med den nye tilstand, som feltet sætter direkte.

`src/noegle.ts` er eneste sted, nøglen bor. Hele nøglen sendes aldrig tilbage til browseren,
kun de sidste fire tegn (`noegleMaske`), der vises som placeholder i feltet. Kan `.env` ikke
skrives, gælder nøglen stadig i den kørende proces, og svaret får en advarsel om det.
Feltet hører til en lokal app på egen maskine: den, der kan nå `/api/noegle`, kan skrive i
`.env`, så serveren skal ikke eksponeres på et netværk.

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
src/server.ts           Bun.serve: HTML-route + /api/dashboard, /api/skema, /api/tabel/:navn,
                        /api/status, /api/noegle, /api/eksempler, /api/spoerg, /api/rapport
src/rapport.ts          bygger og gemmer Markdown-rapporten
src/noegle.ts           API-nøglen: tjek, hukommelse og skrivning til .env
src/db.ts               read-only forbindelse, dashboard-SQL, skemaopslag og koerLaesning()
                        til frie forespørgsler
src/skema.ts            tolkning af skemaet: beskrivelser, relationer, søjleplacering
src/sql-vagt.ts         godkender SQL udefra — kun læsning
src/ai.ts               Claude via Vercel AI SDK, skema for svaret
src/eksempelsvar.ts     fast sæt svar uden API-nøgle
src/spoerg.ts           spørgsmål → SQL → kørsel → svar
src/types.ts            delte typer mellem server og klient
src/App.tsx             dashboard-layout + spørg-panel + "Se data"
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

Filen læses ved opstart. Redigerer man den i hånden bagefter, skal serveren genstartes;
indsætter man i stedet nøglen i feltet i appen, slår den igennem med det samme.

## Konventioner

- Al SQL bor i `src/db.ts`. Komponenter kalder aldrig databasen direkte.
- Serveren returnerer færdigt aggregerede tal; klienten laver ikke forretningslogik.
- Danske feltnavne i datamodellen beholdes uændret i typer og API-svar (`beloeb`,
  `kontogruppe`, `kreditornavn`) — oversæt ikke til engelsk.
- Tal formateres kun i visningslaget, aldrig i API-svaret.
- SQL udefra går altid gennem `godkendLaesning()` — kald aldrig `db.prepare` direkte på den.
- Frie forespørgsler skal give kolonnerne danske snake_case-aliasser (`beloeb`, `pct_andel`).
  `formatVaerdi()` vælger enhed ud fra kolonnenavnet, så et dårligt alias giver et forkert format.
