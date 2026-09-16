-- Rettelser til udtrækket. Filen køres ved opstart af appen og af kontrollen.
-- Databasen ændres aldrig. Alle rettelser laves som views herunder, så de kan læses og spores.
-- Alle spørgsmål og kontroller bruger transaktioner_renset, ikke transaktioner.
-- Hver rettelse er beskrevet i RETTELSER.md med bilagsnumre, beløb og begrundelse.

-- Rettelse 1: huslejeforudbetalingen 2025-10-03 er bogført to gange, som bilag
-- B253293 og B253294. Vi beholder den først registrerede, B253293, og skjuler
-- B253294. Ingen rækker slettes, og begge bilag kan stadig slås op i transaktioner.
-- Nøglen er den samme som i gylden kontrol 3, så view og kontrol ikke kan komme ud af trit.
-- Kolonnerne skrives ud, så hjælpekolonnen forekomst ikke lækker ud i viewet.
CREATE TEMP VIEW transaktioner_renset AS
SELECT bilagsnr, bogfoeringsdato, periode, kvartal, kontonr, kreditornr,
       omkostningssted, beloeb, moms, posteringstekst
FROM (
  SELECT t.*,
         ROW_NUMBER() OVER (
           PARTITION BY kontonr, kreditornr, omkostningssted, beloeb,
                        bogfoeringsdato, posteringstekst
           ORDER BY bilagsnr
         ) AS forekomst
  FROM transaktioner t
)
WHERE forekomst = 1;
