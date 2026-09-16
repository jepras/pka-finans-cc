# Rettelser til udtrækket

Alle rettelser laves som views i `data/rettelser.sql`. Databasen ændres aldrig, og rækker slettes aldrig. Filen køres ved opstart af appen og af `bun run kontrol`, så appen og kontrollen altid ser de samme tal.

Hver rettelse beskrives her med: hvad der er galt, hvordan det er rettet, og hvad rettelsen betyder for tallene.

## Status

Én rettelse er lavet. Efter den består gylden kontrol 1, 2, 3 og 5. Kontrol 4 fejler stadig, og det er den opgave, der er tilbage.

| Kontrol | Status |
|---|---|
| 1. Total mod kontroltotal | Bestået |
| 2. Største licensleverandør i Q4 | Bestået |
| 3. Dubletter | Bestået |
| 4. Fordelingen dækker hele omkostningsbasen | Fejler, 89,7 procent |
| 5. Alle transaktioner i 2025 | Bestået |

## Rettelse 1: huslejeforudbetaling bogført to gange i oktober

**Fundet:** Gylden kontrol 1 viste, at de bogførte omkostninger for 2025 var 48.000 kr. højere end summen af Finanskubens kontroltotaler. Afvigelsen lå udelukkende i perioden `2025-10`. Kontrol 3 pegede samtidig på én gruppe af ens posteringer. Bilag `B253293` og `B253294` er identiske på bogføringsdato, konto, kreditor, omkostningssted, beløb, moms og posteringstekst, og adskiller sig kun ved bilagsnummeret. Et opslag på `bilagsnr` alene finder derfor ikke fejlen.

**Posteringen:**

| Felt | Værdi |
|---|---|
| bilagsnr | B253293 og B253294 |
| bogfoeringsdato | 2025-10-03 |
| periode, kvartal | 2025-10, Q4 |
| kontonr | 7010, Husleje |
| kreditornr | K2001 |
| omkostningssted | 800 |
| beloeb | 48.000 kr. |
| moms | 0 kr. |
| posteringstekst | Forudbetaling, huslejeregulering Q4 |

**Rettet:** `transaktioner_renset` nummererer forekomster inden for hver kombination af konto, kreditor, omkostningssted, beløb, bogføringsdato og posteringstekst, og beholder kun den første, målt på bilagsnummer. B253293 indgår i viewet, B253294 gør ikke. Begge står stadig i tabellen `transaktioner` og kan slås op, hvis nogen spørger til bilaget.

Nøglen er bevidst den samme som i gylden kontrol 3. Hvis viewet og kontrollen brugte hver sin nøgle, kunne viewet rense noget andet end det kontrollen måler, og kontrollen ville holde op med at betyde noget.

Bilagsnummeret er ikke skrevet ind i SQL'en. Rettelsen virker på indholdet, så den også holder, hvis udtrækket hentes igen og bilagene får nye numre.

**Betyder:**

| Tal | Før | Efter |
|---|---|---|
| Omkostningsbase 2025 | 302.287.300 kr. | 302.239.300 kr. |
| Oktober | 24.698.450 kr. | 24.650.450 kr. |
| Antal bilag | 3.294 | 3.293 |
| Afvigelse mod Finanskuben | 48.000 kr. | 0 kr. |

Alle tolv perioder stemmer nu krone for krone med `kontroltotaler`. Kontogruppen Lokaler er den eneste der påvirkes, og Q4 er det eneste kvartal. Fordelingen på formueforvaltning og medlemsadministration ændrer sig ikke målbart, da omkostningssted 800 har en fordelingsnøgle.

**Bemærk:** Nøglen ville også slå to reelt identiske posteringer sammen, altså samme beløb, samme dag, samme kreditor, samme konto og samme tekst. Der findes præcis én sådan gruppe i udtrækket, og det er denne dublet. Hvis et senere udtræk indeholder ægte gentagelser, skal nøglen udvides med bilagsnummer eller en linjereference fra kildesystemet, ellers forsvinder rigtige omkostninger ud af basen uden at nogen ser det.

## Kendte fejl, som endnu ikke er rettet

| Fejl | Konsekvens | Kontrol |
|---|---|---|
| Omkostningssted 700, Fondsadministration, mangler i `fordelingsnoegle` | Fordelingen dækker kun 89,7 procent af omkostningsbasen. KPI'en for formueforvaltning er et underkantsskøn | 4 |
| Samme leverandør optræder som `K1010 Nordlys Software ApS` og `K1011 Nordlys Software` | Leverandøren splittes i to i alle opgørelser pr. kreditor | Ingen. Kontrol 2 består ved et tilfælde, fordi K1010 alene er størst |

## Skabelon til en rettelse

### Rettelse N: kort titel

**Fundet:** hvordan fejlen blev opdaget, og hvor mange rækker den rammer.

**Rettet:** hvad viewet gør, og hvorfor netop den nøgle blev valgt.

**Betyder:** hvordan tallene flytter sig, i kroner.
