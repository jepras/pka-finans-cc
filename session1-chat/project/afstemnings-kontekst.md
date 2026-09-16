# Datamodel: afstemning af investeringsomkostninger

Denne fil beskriver, hvordan de to datakilder ser ud. Selve filerne uploades direkte i værktøjet, ikke her.

## De to kilder

**Forvalterfakturaen (PDF).** Én faktura pr. kvartal. Øverst står fakturanr., fakturadato, forfaldsdato og hvilken periode fakturaen dækker. Selve honorarerne står i én tabel med en række pr. mandat og kolonnerne mandat, aktivklasse, region, AUM i DKK mio., honorarsats og beløb i DKK. Nederst er en totalrække, som ikke er et mandat. Alt uden for tabellen (afsender, adresser, CVR, betalingsoplysninger og noter) er ikke afstemningsdata og skal aldrig blive til en linje i afstemningen.

**PKA's bogføring (CSV).** Semikolon-separeret, én række pr. bogført honorar, med kolonnerne bogføringsdato, periode, mandat, aktivklasse, region, modpart, beløb i DKK, bilagsnr. og kontonr. Beløb står i hele kroner uden tusindtalsseparator. Bilagsnr. er referencen tilbage til bilaget og er det, der gør en linje sporbar.

## Mandaterne

Der er 7 mandater, men 8 fakturalinjer, fordi PKA Infrastructure faktureres både med et basishonorar og et performancehonorar:

- PKA Global Equity
- PKA Emerging Markets
- PKA Fixed Income
- PKA Nordic High Yield
- PKA Infrastructure, basishonorar
- PKA Infrastructure Performance, performancehonorar
- PKA Renewable Infrastructure II
- PKA Private Equity Co-Invest

Mandatnavnene er skrevet ens i de to kilder. Bemærk dog, at "PKA Infrastructure" er indeholdt i "PKA Infrastructure Performance". Match derfor det længste navn først, så performancelinjen ikke bliver forvekslet med basishonoraret.

## Afstemningen

En afstemningslinje er ét mandat i én periode. Der matches på mandatet, ikke på fri tekst. Fire mulige udfald:

- **Match.** Begge kilder har linjen, og beløbene er ens.
- **Afvigelse.** Begge kilder har linjen, men beløbene er forskellige.
- **Mangler bogføring.** Faktureret, men ikke bogført.
- **Mangler faktura.** Bogført, men ikke faktureret.

Materialet dækker perioden Q1 2026.
