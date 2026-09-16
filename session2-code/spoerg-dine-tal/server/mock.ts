// Kanoniske svar, når der ikke er nogen API-nøgle. Matcher på nøgleord i spørgsmålet.
import type { Svar } from "./provider";

type Kanon = { noegleord: string[]; svar: Svar };

export const kanoniske: Kanon[] = [
  {
    noegleord: ["licens", "q4"],
    svar: {
      titel: "Licensomkostninger i Q4 pr. kreditor",
      sql: `SELECT k.kreditornavn AS kreditor, ROUND(SUM(t.beloeb)) AS beloeb
FROM transaktioner_renset t
JOIN kreditorer k ON k.kreditornr = t.kreditornr
WHERE t.kontonr = '6010' AND t.kvartal = 'Q4'
GROUP BY k.kreditornavn
ORDER BY beloeb DESC
LIMIT 12`,
      forklaring: "Den finder alle posteringer på konto 6010, Softwarelicenser, og beholder kun dem fra fjerde kvartal. Den slår kreditornavnet op i kreditorer og lægger beløbene sammen pr. kreditor, sorteret fra størst til mindst. Den tager ikke højde for moms, og den slår ikke kreditorer sammen, hvis samme leverandør er oprettet med to forskellige navne.",
      graftype: "soejle",
    },
  },
  {
    noegleord: ["licens"],
    svar: {
      titel: "Licensomkostninger pr. kreditor, hele 2025",
      sql: `SELECT k.kreditornavn AS kreditor, ROUND(SUM(t.beloeb)) AS beloeb
FROM transaktioner_renset t
JOIN kreditorer k ON k.kreditornr = t.kreditornr
WHERE t.kontonr = '6010'
GROUP BY k.kreditornavn
ORDER BY beloeb DESC
LIMIT 12`,
      forklaring: "Den finder alle posteringer på konto 6010, Softwarelicenser, for hele 2025. Den slår kreditornavnet op og lægger beløbene sammen pr. kreditor. Den filtrerer ikke på periode, så tallet er årets samlede licensomkostning pr. leverandør. Moms er ikke med.",
      graftype: "soejle",
    },
  },
  {
    noegleord: ["personale", "måned"],
    svar: {
      titel: "Personaleomkostninger pr. måned",
      sql: `SELECT t.periode, ROUND(SUM(t.beloeb)) AS beloeb
FROM transaktioner_renset t
JOIN kontoplan kp ON kp.kontonr = t.kontonr
WHERE kp.kontogruppe = 'Personale'
GROUP BY t.periode
ORDER BY t.periode`,
      forklaring: "Den slår kontogruppen op i kontoplanen og beholder kun posteringer i gruppen Personale, altså løn, pension, kurser, rejser og kantine. Den lægger beløbene sammen pr. periode og sorterer efter måned. Den skelner ikke mellem løn og øvrige personaleomkostninger, så en dyr kursusmåned og en lønstigning ser ens ud.",
      graftype: "linje",
    },
  },
  {
    noegleord: ["rådgiver"],
    svar: {
      titel: "Fem største eksterne rådgivere",
      sql: `SELECT k.kreditornavn AS kreditor, k.kreditortype, ROUND(SUM(t.beloeb)) AS beloeb, COUNT(*) AS antal_bilag
FROM transaktioner_renset t
JOIN kontoplan kp ON kp.kontonr = t.kontonr
JOIN kreditorer k ON k.kreditornr = t.kreditornr
WHERE kp.kontogruppe = 'Eksterne rådgivere'
GROUP BY k.kreditornavn, k.kreditortype
ORDER BY beloeb DESC
LIMIT 5`,
      forklaring: "Den finder alle posteringer på konti i gruppen Eksterne rådgivere, altså revision, jura, konsulenter og aktuar. Den lægger beløbene sammen pr. kreditor og tæller samtidig antal bilag, så du kan se om beløbet kommer fra få store eller mange små fakturaer. Den viser de fem største. Den tager ikke højde for, hvilket omkostningssted der har bestilt arbejdet.",
      graftype: "soejle",
    },
  },
  {
    noegleord: ["kvartal", "kontogruppe"],
    svar: {
      titel: "Omkostninger pr. kontogruppe pr. kvartal",
      sql: `SELECT t.kvartal, kp.kontogruppe, ROUND(SUM(t.beloeb)) AS beloeb
FROM transaktioner_renset t
JOIN kontoplan kp ON kp.kontonr = t.kontonr
GROUP BY t.kvartal, kp.kontogruppe
ORDER BY t.kvartal, beloeb DESC`,
      forklaring: "Den slår kontogruppen op for hver postering og lægger beløbene sammen pr. kvartal og kontogruppe. Resultatet er en række pr. kombination, sorteret efter kvartal. Den viser ikke, om en stigning skyldes flere bilag eller større bilag.",
      graftype: "soejle",
    },
  },
  {
    noegleord: ["formueforvaltning"],
    svar: {
      titel: "Fordeling på formueforvaltning og medlemsadministration",
      sql: `SELECT
  ROUND(SUM(t.beloeb * f.andel_formueforvaltning)) AS formueforvaltning,
  ROUND(SUM(t.beloeb * f.andel_medlemsadministration)) AS medlemsadministration,
  ROUND(SUM(t.beloeb)) AS fordelt_i_alt
FROM transaktioner_renset t
JOIN fordelingsnoegle f ON f.omkostningssted = t.omkostningssted`,
      forklaring: "Den kobler hver postering til fordelingsnøglen for dens omkostningssted og ganger beløbet med andelen til henholdsvis formueforvaltning og medlemsadministration. Til sidst lægger den det hele sammen. Den bruger et almindeligt join, så posteringer på omkostningssteder uden fordelingsnøgle falder ud af summen uden at blive vist. Sammenlign fordelt_i_alt med den samlede omkostningsbase, før du stoler på tallet.",
      graftype: "soejle",
    },
  },
  {
    noegleord: ["omkostningssted", "it"],
    svar: {
      titel: "IT og licenser pr. omkostningssted",
      sql: `SELECT o.navn AS omkostningssted, ROUND(SUM(t.beloeb)) AS beloeb
FROM transaktioner_renset t
JOIN kontoplan kp ON kp.kontonr = t.kontonr
JOIN omkostningssteder o ON o.omkostningssted = t.omkostningssted
WHERE kp.kontogruppe = 'IT og licenser'
GROUP BY o.navn
ORDER BY beloeb DESC`,
      forklaring: "Den finder posteringer i kontogruppen IT og licenser, slår omkostningsstedets navn op og lægger beløbene sammen pr. omkostningssted. Den tager ikke højde for, at fælles IT-omkostninger ofte bogføres ét sted og bruges af alle.",
      graftype: "soejle",
    },
  },
  {
    noegleord: ["kreditor", "største"],
    svar: {
      titel: "Ti største kreditorer",
      sql: `SELECT k.kreditornavn AS kreditor, k.kreditortype, ROUND(SUM(t.beloeb)) AS beloeb
FROM transaktioner_renset t
JOIN kreditorer k ON k.kreditornr = t.kreditornr
GROUP BY k.kreditornavn, k.kreditortype
ORDER BY beloeb DESC
LIMIT 10`,
      forklaring: "Den lægger alle posteringer sammen pr. kreditor for hele 2025 og viser de ti største. Lønbureauet står øverst, fordi løn bogføres gennem det. Den slår ikke kreditorer sammen, hvis samme leverandør findes med to stavemåder.",
      graftype: "soejle",
    },
  },
  {
    noegleord: ["oktober"],
    svar: {
      titel: "Posteringer i oktober mod kontroltotal",
      sql: `SELECT t.periode, ROUND(SUM(t.beloeb)) AS bogfoert, ROUND(kt.total_ifoelge_finanskuben) AS kontroltotal, ROUND(SUM(t.beloeb) - kt.total_ifoelge_finanskuben) AS afvigelse
FROM transaktioner_renset t
JOIN kontroltotaler kt ON kt.periode = t.periode
WHERE t.periode = '2025-10'
GROUP BY t.periode`,
      forklaring: "Den lægger alle posteringer i oktober sammen og stiller summen op mod det tal, Finanskuben selv rapporterer for måneden. Forskellen står i kolonnen afvigelse. Den siger ikke, hvilke posteringer der udgør forskellen.",
      graftype: "ingen",
    },
  },
  {
    noegleord: ["samlede", "2025"],
    svar: {
      titel: "Samlede omkostninger 2025",
      sql: `SELECT ROUND(SUM(beloeb)) AS beloeb, COUNT(*) AS antal_bilag FROM transaktioner_renset`,
      forklaring: "Den lægger alle posteringer i det rensede udtræk sammen og tæller bilag. Der er ingen filtre. Den kontrollerer ikke selv, om summen stemmer med Finanskubens kontroltotal.",
      graftype: "ingen",
    },
  },
];

export function findKanonisk(spoergsmaal: string): Svar {
  const q = spoergsmaal.toLowerCase();
  const match = kanoniske.find((k) => k.noegleord.every((n) => q.includes(n)));
  if (match) return match.svar;
  return {
    titel: "Mock-tilstand: spørgsmålet er ikke dækket",
    sql: `SELECT kp.kontogruppe, ROUND(SUM(t.beloeb)) AS beloeb
FROM transaktioner_renset t
JOIN kontoplan kp ON kp.kontonr = t.kontonr
GROUP BY kp.kontogruppe
ORDER BY beloeb DESC`,
    forklaring: "Appen kører uden API-nøgle og har kun et fast sæt svar. Dit spørgsmål matchede ikke et af dem, så her er omkostningerne pr. kontogruppe i stedet. Læg en nøgle i .env for at få svar på frie spørgsmål.",
    graftype: "soejle",
  };
}
