# Licensomkostninger i Q4 pr. kreditor

**Spørgsmål:** Hvad brugte vi på licenser i Q4 pr. kreditor?

**Dato:** 2026-09-16

## Hvad gør den

Den finder alle posteringer på konto 6010, Softwarelicenser, og beholder kun dem fra fjerde kvartal. Den slår kreditornavnet op i kreditorer og lægger beløbene sammen pr. kreditor, sorteret fra størst til mindst. Den tager ikke højde for moms, og den slår ikke kreditorer sammen, hvis samme leverandør er oprettet med to forskellige navne.

## Forespørgsel

```sql
SELECT k.kreditornavn AS kreditor, ROUND(SUM(t.beloeb)) AS beloeb
FROM transaktioner_renset t
JOIN kreditorer k ON k.kreditornr = t.kreditornr
WHERE t.kontonr = '6010' AND t.kvartal = 'Q4'
GROUP BY k.kreditornavn
ORDER BY beloeb DESC
LIMIT 12
```

## Resultat

| kreditor | beloeb |
| --- | --- |
| Nordlys Software ApS | 1.371.450 kr. |
| Nordlys Software | 1.109.750 kr. |
| Vindrose Licensgruppen A/S | 686.300 kr. |
| Stellaris Analytics Ltd | 657.150 kr. |
| Havbris Data Platform | 428.650 kr. |
