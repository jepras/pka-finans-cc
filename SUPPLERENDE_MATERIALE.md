# Supplerende materiale

Kontekst til den agent, der arbejder i dette repo. Beskriver hvad der bliver sagt og vist i vores slot, så opgaverne i `session1-chat/` og `session2-code/` passer til det.

## Slidedecket "Claude i praksis"

Hoveddecket ligger på <https://im-claude-workshop.netlify.app/>. Det er ikke en del af dette repo. Deltagerne ser det på storskærm, mens de arbejder i vores HTML-opgaver.

Slides i rækkefølge (25 stk.):

| # | Slide-id | Titel |
|---|---|---|
| 1 | `forside` | Claude i praksis |
| 2 | `os-to` | Hvem står her |
| 3 | `program` | Program |
| 4 | `udbytte` | Noget, I kan bygge videre på |
| 5 | `to-udfald` | Svaret bliver i vinduet. Filen bliver i mappen |
| 6 | `tre-vaerktoejer` | Chat svarer. Cowork arbejder. Code bygger |
| 7 | `mappen` | Mappen er Claudes verden |
| 8 | `context-window` | Hver besked og læst fil fylder |
| 9 | `vaerktoej` | Hvornår bruger du hvad |
| 10 | `trifecta` | Tre ting, der ikke må mødes |
| 11 | `opgave-chat` | Øvelse 1: Få jord under neglene |
| 12 | `oevelse-chat` | Øvelse 1: Chat og Projects (timer) |
| 13 | `tilladelser` | Hvor meget må Claude gøre selv |
| 14 | `plan-mode` | Plan først. Godkend bagefter |
| 15 | `model-effort` | Vælg model og tænketid |
| 16 | `token-economics` | Små opgaver. Mindre spild |
| 17 | `vaegt` | Ikke alle valg vejer lige meget |
| 18 | `foerste-prompt` | Din første prompt |
| 19 | `opgave-code` | Øvelse 2: Byg noget, I kan gentage |
| 20 | `oevelse-code` | Øvelse 2: Claude Code (timer) |
| 21 | `opsamling` | Hvad så rigtigt ud, indtil I tjekkede det? |
| 22 | `skills` | Skriv opskriften én gang |
| 23 | `opskrift-og-kontrol` | Hooks tjekker. Hver gang. |
| 24 | `isbjerg` | Prototype vs. drift |
| 25 | `afslutning` | Prøv det igen inden næste fredag |

## Tidsplan i vores slot

Decket har en indbygget timer med start kl. 13:00 og fire blokke:

| Tid | Blok | Varighed |
|---|---|---|
| 13:00 til 13:30 | Introduktion til Claude (Chat, Cowork og Code) | 30 min |
| 13:30 til 13:55 | Øvelse 1: Chat og Projects | 25 min |
| 13:55 til 14:20 | Claude Code i dybden (tilladelser, plan mode, model og tænketid) | 25 min |
| 14:20 til 15:00 | Øvelse 2: Claude Code | 40 min |

Materialet i `session1-chat/` hører til øvelse 1. Materialet i `session2-code/` hører til øvelse 2. **Øvelse 2 har 40 minutter i alt**, inklusiv opstart, fejlfinding og en fælles opsamling til sidst. Regn med 30 minutters reel arbejdstid.

## Rammesætning fra decket

Det her er sagt, før deltagerne åbner vores opgaver. Opgaverne skal bygge videre på det og ikke genforklare det.

**Udbyttet.** "Ikke en færdig løsning, men en arbejdsform, I har prøvet på en rigtig opgave: først i Claude Chat, bagefter i Claude Code." Ikke i dag: hvordan en sprogmodel virker, en promptbog, eller noget i produktion.

**De to udfald.** Svaret bliver i vinduet (Chat) mod filen bliver i mappen (Code). Det er hele pointen med at skifte værktøj.

**Værktøjsvalg.** Fire kolonner sammenlignes: Intern GPT, Claude Chat, Claude Cowork, Claude Code. Claude Code er til "arbejde, der skal kunne køres igen: scripts, analyser, demoer". Ikke til hurtige spørgsmål uden filer.

**Mappen er Claudes verden.** Eksemplet gennem hele decket er en mappe `kvartal-q3/` med `q3-nord.xlsx`, `q3-syd.xlsx` og `q3-vest.xlsx`, der skal blive til én samlet oversigt med én række pr. selskab.

**Context window.** Hver besked og læst fil fylder. Store opgaver deles i mindre med kun relevant kontekst. Samme opgave betyder fortsæt chatten, nyt scope betyder ny chat.

**Trifecta (sikkerhed).** Tre ting må ikke mødes: private data, indhold udefra, og en vej ud (netværkskald, mail, git push). Vises med et eksempel på en fejllog, der indeholder en skjult instruktion til agenten.

**Tilladelser.** Fem modes fra mindst til mest handlefrihed: Plan (ændrer ikke filer), Manual (godkend hvert trin), Accept Edits (retter filer uden stop), Auto (arbejder i den valgte ramme), Bypass permissions (undtagelse, kun isoleret og disponibelt).

**Plan mode.** Fire trin: åbn projektmappen, skift til Plan mode, iterér planen til den passer, godkend og løs én opgave. Planen vises som en `plan.md` med sektionerne Opgave, Fremgangsmåde og Kontrol (afkrydsningsfelter som "Stemmer totalen med rapporten?" og "Stikprøve på fem rækker").

**Din første prompt.** Fire ting gør prompten brugbar, illustreret med denne prompt:

> Kig i **mappen kvartal-q3**. Lav **én samlet oversigt over nøgletallene for hvert selskab**. Den skal kunne sendes videre til **en kollega**, så hold den på én side. **Skriv et script**, der bygger oversigten, og **gem resultatet som kvartal-oversigt.xlsx**.

De fire dele er kilde, resultat, modtager og levering.

**Øvelse 2 som den er formuleret i decket.** Titel: "Byg noget, I kan gentage". Lead: "Samme opgave eller en ny, nu i en mappe. Det færdige resultat er ikke målet, arbejdsformen er." Rytme: mappe, plan, resultat. Fire trin:

1. **Åbn mappen.** Start Claude Code i en mappe med ufølsomme filer, og lad den kigge rundt.
2. **Bed om en plan.** Plan mode. Iterér planen, til den passer, før noget bliver ændret.
3. **Kør én opgave.** Godkend et trin ad gangen, og hold opgaven lille nok til at kunne tjekkes.
4. **Tjek resultatet.** Kør kontrollen, og læs ændringen igennem, før I går videre.

**Opsamling efter øvelse 2.** Tre spørgsmål: Vis ét konkret eksempel. Fortæl, hvad I tjekkede. Sig, hvad I vil gøre anderledes. Plus: "Holdt resultatet? Vis den kontrol, der gav jer tillid."

**Efter øvelserne.** Skills (en `SKILL.md` med frontmatter plus `scripts/tjek-tal.sh` og `referencer/faelder.md`) og hooks (et PostToolUse-hook, der kører kontrollen efter hver filændring). Til sidst isbjerget: prototype mod drift, og hvem der vedligeholder og supporterer.

## Konsekvenser for materialet i dette repo

- Opgaverne skal kunne læses uden at forklare Projects, plan mode, tilladelser eller context window forfra. Det er allerede sagt.
- Brug samme sprog som decket: mappe, plan, kontrol, opskrift.
- Data i vores opgaver skal være ufølsomt og kunne forlade huset. Det er en eksplicit regel på trifecta-sliden.
- Øvelse 2 skal ende i **filer i en mappe**, ikke et svar i et chatvindue. Det er hele skellet decket bygger op.
- Der skal være noget konkret at vise frem i opsamlingen efter 40 minutter.
