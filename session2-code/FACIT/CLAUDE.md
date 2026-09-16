# Spørg dine tal

En lille webapp, der viser PKA A/S' omkostningsbase 2025 som et dashboard og lader brugeren stille spørgsmål til tallene på dansk. Claude oversætter spørgsmålet til SQL, appen kører SQL'en og viser fire ting side om side: SQL'en, en forklaring på almindeligt dansk af hvad SQL'en gør, resultattabellen og en graf.

Data er syntetisk og ligger i `data/finanskube-2025.sqlite`. Læs `data/DATAMODEL.md`, før du skriver SQL.

## Stack, ingen undtagelser

- Bun som runtime og bundler. Ingen Vite, ingen Next.js, ingen Express.
- `server.ts` med `Bun.serve` og `routes`. `index.html` serveres som route, Bun bundler React og TSX selv.
- React 19, TypeScript, Tailwind 4 via `bun-plugin-tailwind` (allerede sat op i `bunfig.toml` og `styles.css`).
- shadcn-komponenterne i `components/ui/` bruges som de er. Lav ikke nye uden at spørge.
- `bun:sqlite` til databasen. Ingen andre databasepakker.
- Vercel AI SDK (`ai`, `@ai-sdk/anthropic`) med `generateObject` og et Zod-skema.
- Recharts til grafer.
- Start: `bun run dev`. Kontrol: `bun run kontrol`.

## Regler

- Databasen åbnes read-only. Kør altid `data/rettelser.sql` lige efter åbning, og brug `transaktioner_renset` i alle spørgsmål.
- Serveren afviser SQL, der ikke starter med SELECT eller WITH. Ingen skrivning til databasen nogensinde.
- Rettelser til data laves som views i `data/rettelser.sql` og beskrives i `data/RETTELSER.md`. Slet aldrig rækker.
- Uden `ANTHROPIC_API_KEY` i `.env` kører appen i mock-tilstand med kanoniske svar fra `server/mock.ts`. Med nøgle bruges `claude-sonnet-5`. Headeren viser altid hvilken tilstand der er aktiv.
- Al tekst i appen er på dansk. Dansk talformat med `kr` og `tal` fra `lib/utils.ts`.
- Farver: PKA-rød `#92004D` primær, rubinrød `#CE0060` til aktive states, bordeaux `#660036` til overskrifter. Sekundærfarver til grafer: himmelblå, mintgrøn, syrenlilla, enggul, pudderbeige, løvgrøn. De er alle defineret i `styles.css`.
- Ingen emojis, ingen tankestreger, ingen uppercase-overskrifter.

## Filer

```
server.ts               Bun.serve, routes: "/" og /api/*
server/db.ts            åbner databasen, kører rettelser.sql, eksporterer query()
server/provider.ts      vælger Anthropic eller mock
server/mock.ts          kanoniske svar
server/prompts/system.md systemprompt til Claude
index.html              <div id="root"> og <script src="./app.tsx">
app.tsx                 App-komponenten
components/Dashboard.tsx
components/SpoergPanel.tsx
components/ui/          shadcn
lib/utils.ts            cn, kr, tal
data/                   database, datamodel, rettelser
kontroller/             gyldne spørgsmål
scripts/kontrol.ts      kører kontrollerne
rapporter/              gemte svar lander her
```

## Svarformat fra modellen

```ts
z.object({
  titel: z.string(),            // kort overskrift til svaret
  sql: z.string(),              // én SELECT mod transaktioner_renset og dimensionstabellerne
  forklaring: z.string(),       // 3 til 5 sætninger på dansk til en, der ikke kan SQL
  graftype: z.enum(["soejle", "linje", "ingen"]),
})
```

Forklaringen skal sige: hvilke tabeller den slår op i, hvad den filtrerer på, hvad den summerer eller grupperer, og hvad den ikke tager højde for.
