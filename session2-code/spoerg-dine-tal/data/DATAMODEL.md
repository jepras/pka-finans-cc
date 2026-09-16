# Datamodel: finanskube-2025.sqlite

Et syntetisk udtræk fra Finanskuben for PKA A/S, kalenderåret 2025. Alle tal, kreditorer og navne er opdigtede. Filen er SQLite og læses altid read-only.

## Tabeller

### transaktioner (ca. 3.300 rækker)

Én række pr. postering.

| Kolonne | Type | Eksempel | Bemærkning |
|---|---|---|---|
| bilagsnr | TEXT | B250412 | Unikt bilagsnummer |
| bogfoeringsdato | TEXT | 2025-03-14 | ISO-dato |
| periode | TEXT | 2025-03 | År og måned |
| kvartal | TEXT | Q1 | Q1 til Q4 |
| kontonr | TEXT | 6010 | Slår op i kontoplan |
| kreditornr | TEXT | K1010 | Slår op i kreditorer |
| omkostningssted | TEXT | 500 | Slår op i omkostningssteder |
| beloeb | REAL | 84500 | Beløb i kr. ekskl. moms |
| moms | REAL | 21125 | Moms i kr., 0 ved løn |
| posteringstekst | TEXT | Licenser 2025-03 | Fritekst fra bogføringen |

### kontoplan (27 rækker)

| Kolonne | Eksempel |
|---|---|
| kontonr | 6010 |
| kontonavn | Softwarelicenser |
| kontogruppe | IT og licenser |

Kontogrupper: Personale, IT og licenser, Lokaler, Eksterne rådgivere, Depot og forvaltning, Øvrig administration.

### kreditorer (33 rækker)

| Kolonne | Eksempel |
|---|---|
| kreditornr | K1010 |
| kreditornavn | Nordlys Software ApS |
| kreditortype | Softwareleverandør |
| land | DK |

### omkostningssteder (8 rækker)

| Kolonne | Eksempel |
|---|---|
| omkostningssted | 500 |
| navn | IT og drift |
| afdeling | Finans |

### fordelingsnoegle

Hvordan hvert omkostningssted fordeles på PKA A/S' to forretningsområder. Andelene summer til 1 pr. række.

| Kolonne | Eksempel |
|---|---|
| omkostningssted | 500 |
| andel_formueforvaltning | 0.5 |
| andel_medlemsadministration | 0.5 |

### kontroltotaler (12 rækker)

Hvad Finanskuben selv rapporterer som total pr. periode. Bruges til at kontrollere, at udtrækket er komplet og uden dubletter.

| Kolonne | Eksempel |
|---|---|
| periode | 2025-10 |
| total_ifoelge_finanskuben | 25839400 |

## Views

`data/rettelser.sql` køres ved opstart og opretter `transaktioner_renset`. Alle spørgsmål og kontroller bruger det view, ikke tabellen direkte. Sådan kan rettelser til udtrækket laves uden at ændre databasen, og de kan læses i én fil.

## Typiske spørgsmål

- Hvad brugte vi på licenser (konto 6010) i Q4, pr. kreditor?
- Hvordan udvikler personaleomkostninger sig pr. måned?
- Hvem er vores fem største eksterne rådgivere?
- Hvor stor en andel af omkostningsbasen ligger på formueforvaltning?
- Hvilke omkostningssteder bruger mest på IT og licenser?
