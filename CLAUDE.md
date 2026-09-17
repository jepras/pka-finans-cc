# Kontekst

Dette repo er materiale til en AI-workshop for **PKA's finansafdeling**, afholdt af Implement og Forca over to dage. Vi har et slot på to timer, **dag 1 kl. 13:00 til 15:00**.

Alle HTML-filer skal laves med shadcn-stylede komponenter.

## Deltagerne: PKA Finans

PKA er en dansk pensionskasseadministration. Finansafdelingen ledes af direktør Nicolai Ørnstrup Pilehave og er ansvarlig for økonomi, regnskaber, risikostyring, compliance, fondsadministration og IT. Nøglepersonerne for både compliance- og risikostyringsfunktionen sidder i afdelingen. Den er opdelt i fire områder:

- **Økonomi og Skat** (økonomichef Jesper Bjerre Overgaard)
- **Risikostyring og Compliance** (underdirektør Rasmus Bakke Ahlmann)
- **Data, Valuation & Reporting** (underdirektør Susanne Hougaard Thamsborg)
- **HR** (HR-chef Anya Tolstoy)

Kilde: <https://pka.dk/om-pka/organisation/finans>

Konkret betyder det: **regulerede, reviderede tal**. Deltagerne arbejder med afstemninger, værdiansættelse, indberetninger, risikorapportering og skat. Sporbarhed og kontrol vejer tungere end hastighed. Ca. 25 deltagere fysisk, blandet niveau, 7 til 8 koder i C#, ca. halvdelen har god model- og SQL-forståelse.

## Programmet

Vores to timer ligger inde i et større todagesprogram:

- **Dag 1:** 09:00 velkommen v. Nicolai Pilehave, 09:20 inspirationsoplæg, 10:45 AI-rammeværk og roadmap v. finansledere, 11:45 intro til "AI i praksis, hands-on" v. Forca og Implement, 12:00 frokost, **13:00 til 15:00 AI i praksis, hands-on i 3 spor** (vores slot), 15:00 social aktivitet.
- **Dag 2:** 09:15 hands-on fortsat, 13:00 demo af 2 til 3 use cases, 13:30 identificering og visualisering af nye use cases v. Claus Jørgensen og Claude, 14:00 slut.

Efterfølgende samler Forca op på input og use cases, og hver afdeling laver sit eget roadmap.

Vores materiale kombineres med slidedecket "Claude i praksis". **Se `SKAL-SLETTES/SUPPLERENDE_MATERIALE.md`** (ligger uden for git, da det er interne noter) for slides, tidsplan og hvad der allerede er rammesat, før deltagerne åbner opgaverne her. Læs den fil, før du skriver eller ændrer opgaveindhold.

## Skrivestil

Gælder al tekst i repoet (HTML, Markdown, kommentarer, commit-beskeder):

- **Ingen emojis.** Heller ikke i overskrifter, lister, favicons eller knaptekster.
- **Ingen em dashes eller en dashes.** Brug punktum eller komma i stedet. Ingen parenteser som erstatning.
- **Ingen uppercase-overskrifter.** Hverken skrevet i versaler eller via `text-transform: uppercase`. Brug almindelig sætningsstil.

## Repo-struktur

Denne mappe (`pka-finans-cc/`) er selve git-repoet:

- **`pka-finans-cc/`** → `github.com/jepras/pka-finans-cc` (**public**)
  - Workshop-materiale deltagerne ser. Indeholder `index.html` (landing page), sessioner, præsentationer og opgaver.
  - Publiceres som GitHub Pages: **https://jepras.github.io/pka-finans-cc/**
  - Download-knappen på landing page peger på `https://github.com/jepras/pka-finans-cc/archive/refs/heads/main.zip` (GitHubs native zip af main-branchen, altid friske filer, ingen tredjepartsservice).
  - Push hertil = Pages opdateres automatisk inden for ~1 min.

Mappestruktur:

- `session1-chat/`: materiale til session 1 (Claude chat)
- `session2-code/`: materiale til session 2 (Claude Code). Kun data og guide, deltagerne bygger appen selv
- `andet/`: facit og hjælpemateriale, ikke noget deltagerne skal bruge undervejs. `andet/session2-facit/` er det færdige eksempel på session 2-appen.

**Claude må ikke læse noget i `andet/`.** Hverken med Read, Glob, Grep, Bash eller subagenter, og heller ikke som del af en bredere søgning i repoet. Mappen indeholder facit, og hele pointen med session 2 er at deltagerne bygger appen selv. Hvis en opgave ser ud til at kræve indholdet i `andet/`, så spørg brugeren i stedet for at åbne filerne. Undtagelsen er hvis brugeren udtrykkeligt beder om det i den aktuelle samtale.

Alt i dette repo er **offentligt**. Læg aldrig kundedata, interne noter eller credentials her.

## PKA-farver

Brug PKA-rød som primær brandfarve. Suppler med rubinrød og bordeaux efter behov.

- PKA-rød: `#92004D`
- Rubinrød: `#CE0060`
- Bordeaux: `#660036`

Sekundære farver:

- Varm grå: `#ACA39A`
- Mintgrøn: `#9EDFCE`
- Syrenlilla: `#C5AED5`
- Pudderbeige: `#E88F80`
- Himmelblå: `#6E9BAA`
- Enggul: `#EFC47C`
- Løvgrøn: `#85B499`
- Sommergrå: `#D8D4D7`
- Vintergrå: `#C7C9D4`
