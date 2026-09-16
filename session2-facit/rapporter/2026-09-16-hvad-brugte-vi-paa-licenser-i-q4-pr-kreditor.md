# Hvad brugte vi på licenser i Q4, pr. kreditor?

Rapport fra PKA A/S — omkostningsbase 2025. Dannet 2026-09-16.

## Sådan skal den læses

Forespørgslen henter alle posteringer på konto 6010 (Softwarelicenser) i fjerde kvartal, kobler hver postering til kreditorens navn og lægger beløbene sammen pr. kreditor. Kreditoren med det største samlede beløb står øverst.

### Det tager forespørgslen ikke højde for

- Kun konto 6010 tælles med. Licenser bogført på en anden konto — for eksempel en IT-drift- eller konsulentkonto — er ikke med.
- Kvartalet aflæses af kolonnen kvartal, ikke af bogføringsdatoen. En efterpostering i januar for december indgår derfor ikke i Q4.
- Kreditorer uden posteringer i Q4 optræder slet ikke i tabellen i stedet for at stå med 0 kr.
- Beløbene er ekskl. moms — momsen ligger i sin egen kolonne og er ikke lagt til.
- Datasættet er syntetisk. Tal, kreditorer og navne er opdigtede.

## Resultat

| Kreditor | Beloeb | Posteringer |
| :--- | ---: | ---: |
| Vindrose Licensgruppen A/S | 1.138.600 kr. | 25 |
| Nordlys Software ApS | 1.015.000 kr. | 18 |
| Havbris Data Platform | 518.100 kr. | 10 |
| Stellaris Analytics Ltd | 411.900 kr. | 9 |

## SQL der blev kørt

```sql
SELECT
  kr.kreditornavn   AS kreditor,
  SUM(t.beloeb)     AS beloeb,
  COUNT(*)          AS posteringer
FROM transaktioner t
JOIN kreditorer kr ON kr.kreditornr = t.kreditornr
WHERE t.kontonr = '6010'
  AND t.kvartal = 'Q4'
GROUP BY kr.kreditornavn
ORDER BY beloeb DESC
```

---

Appen kørte uden API-nøgle. SQL'en kommer fra appens faste sæt eksempelsvar og svarer måske ikke præcist på spørgsmålet.
Kilde: `data/finanskube-2025.sqlite`, et syntetisk udtræk fra Finanskuben.
Tal, kreditorer og navne er opdigtede. Beløb er ekskl. moms.
