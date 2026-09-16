-- Licensomkostninger i Q4 pr. kreditor
-- Spørgsmål: Hvad brugte vi på licenser i Q4 pr. kreditor?
-- Gemt: 2026-09-16
-- Kør mod finanskube-2025.sqlite efter data/rettelser.sql.

SELECT k.kreditornavn AS kreditor, ROUND(SUM(t.beloeb)) AS beloeb
FROM transaktioner_renset t
JOIN kreditorer k ON k.kreditornr = t.kreditornr
WHERE t.kontonr = '6010' AND t.kvartal = 'Q4'
GROUP BY k.kreditornavn
ORDER BY beloeb DESC
LIMIT 12;
