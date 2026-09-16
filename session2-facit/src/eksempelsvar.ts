/**
 * Fast sæt eksempelsvar, der bruges når der ikke ligger en ANTHROPIC_API_KEY.
 *
 * SQL'en her er håndskrevet, men den bliver kørt mod databasen som alle andre
 * forespørgsler — tabellen og grafen viser altså rigtige tal, kun formuleringen
 * af spørgsmålet er på skinner.
 */

import type { GrafSpec } from "./types.ts";

export type Eksempelsvar = {
  id: string;
  /** Vises som klikbart forslag i panelet. */
  spoergsmaal: string;
  noegleord: string[];
  sql: string;
  forklaring: string;
  forbehold: string[];
  graf: GrafSpec | null;
};

const FAELLES_FORBEHOLD = [
  "Beløbene er ekskl. moms — momsen ligger i sin egen kolonne og er ikke lagt til.",
  "Datasættet er syntetisk. Tal, kreditorer og navne er opdigtede.",
];

export const EKSEMPELSVAR: Eksempelsvar[] = [
  {
    id: "licenser-q4",
    spoergsmaal: "Hvad brugte vi på licenser i Q4, pr. kreditor?",
    noegleord: ["licens", "licenser", "6010", "software"],
    sql: `SELECT
  kr.kreditornavn   AS kreditor,
  SUM(t.beloeb)     AS beloeb,
  COUNT(*)          AS posteringer
FROM transaktioner t
JOIN kreditorer kr ON kr.kreditornr = t.kreditornr
WHERE t.kontonr = '6010'
  AND t.kvartal = 'Q4'
GROUP BY kr.kreditornavn
ORDER BY beloeb DESC`,
    forklaring:
      "Forespørgslen henter alle posteringer på konto 6010 (Softwarelicenser) i fjerde kvartal, " +
      "kobler hver postering til kreditorens navn og lægger beløbene sammen pr. kreditor. " +
      "Kreditoren med det største samlede beløb står øverst.",
    forbehold: [
      "Kun konto 6010 tælles med. Licenser bogført på en anden konto — for eksempel en IT-drift- eller konsulentkonto — er ikke med.",
      "Kvartalet aflæses af kolonnen kvartal, ikke af bogføringsdatoen. En efterpostering i januar for december indgår derfor ikke i Q4.",
      "Kreditorer uden posteringer i Q4 optræder slet ikke i tabellen i stedet for at stå med 0 kr.",
      ...FAELLES_FORBEHOLD,
    ],
    graf: {
      type: "soejle",
      xNoegle: "kreditor",
      serier: [{ noegle: "beloeb", navn: "Beløb i Q4" }],
    },
  },

  {
    id: "personale-pr-maaned",
    spoergsmaal: "Hvordan udvikler personaleomkostningerne sig pr. måned?",
    noegleord: ["personale", "løn", "loen", "måned", "maaned", "udvikling", "udvikler"],
    sql: `SELECT
  t.periode      AS periode,
  SUM(t.beloeb)  AS beloeb,
  COUNT(*)       AS posteringer
FROM transaktioner t
JOIN kontoplan k ON k.kontonr = t.kontonr
WHERE k.kontogruppe = 'Personale'
GROUP BY t.periode
ORDER BY t.periode`,
    forklaring:
      "Forespørgslen kobler hver postering til kontoplanen, beholder kun de konti, der hører til " +
      "kontogruppen Personale, og summerer beløbet pr. periode (år og måned). Rækkerne er sorteret " +
      "kronologisk, så udviklingen hen over året kan aflæses.",
    forbehold: [
      "Afgrænsningen følger kontogruppen Personale i kontoplanen. Personaleomkostninger konteret i en anden gruppe — for eksempel vikarer under Eksterne rådgivere — tælles ikke med.",
      "En måned uden personaleposteringer mangler som række frem for at stå med 0 kr.",
      "Perioden er bogføringsperioden. Feriepenge og bonus lander i den måned, de blev bogført, ikke i den måned de blev optjent.",
      ...FAELLES_FORBEHOLD,
    ],
    graf: {
      type: "linje",
      xNoegle: "periode",
      serier: [{ noegle: "beloeb", navn: "Personaleomkostninger" }],
    },
  },

  {
    id: "top-raadgivere",
    spoergsmaal: "Hvem er vores fem største eksterne rådgivere?",
    noegleord: ["rådgiver", "raadgiver", "rådgivere", "konsulent", "største", "stoerste", "top"],
    sql: `SELECT
  kr.kreditornavn  AS kreditor,
  kr.kreditortype  AS type,
  kr.land          AS land,
  SUM(t.beloeb)    AS beloeb,
  COUNT(*)         AS posteringer
FROM transaktioner t
JOIN kreditorer kr ON kr.kreditornr = t.kreditornr
JOIN kontoplan  k  ON k.kontonr     = t.kontonr
WHERE k.kontogruppe = 'Eksterne rådgivere'
GROUP BY kr.kreditornavn, kr.kreditortype, kr.land
ORDER BY beloeb DESC
LIMIT 5`,
    forklaring:
      "Forespørgslen samler alle posteringer i kontogruppen Eksterne rådgivere, lægger dem sammen " +
      "pr. kreditor og viser de fem største. Kreditortype og land kommer fra kreditorstamdata.",
    forbehold: [
      "Kun kontogruppen Eksterne rådgivere indgår. Rådgivning bogført under for eksempel Depot og forvaltning tælles ikke med.",
      "Der grupperes på kreditornavn. Hvis samme leverandør findes med to kreditornumre, bliver den delt i to rækker.",
      "Rangeringen er for hele 2025 under ét — en rådgiver, der først kom til i Q4, sammenlignes med en, der har kørt hele året.",
      ...FAELLES_FORBEHOLD,
    ],
    graf: {
      type: "soejle",
      xNoegle: "kreditor",
      serier: [{ noegle: "beloeb", navn: "Beløb 2025" }],
    },
  },

  {
    id: "fordeling-forretningsomraader",
    spoergsmaal: "Hvor stor en andel af omkostningsbasen ligger på formueforvaltning?",
    noegleord: [
      "formueforvaltning",
      "medlemsadministration",
      "fordeling",
      "forretningsområde",
      "forretningsomraade",
      "andel",
    ],
    sql: `SELECT
  ROUND(SUM(t.beloeb * f.andel_formueforvaltning))                      AS formueforvaltning,
  ROUND(SUM(t.beloeb * f.andel_medlemsadministration))                  AS medlemsadministration,
  ROUND(100.0 * SUM(t.beloeb * f.andel_formueforvaltning)
        / SUM(t.beloeb), 1)                                            AS pct_formueforvaltning,
  ROUND(SUM(t.beloeb))                                                 AS omkostningsbase_i_alt
FROM transaktioner t
JOIN fordelingsnoegle f ON f.omkostningssted = t.omkostningssted`,
    forklaring:
      "Hver postering ganges med fordelingsnøglens andel for sit omkostningssted og lægges sammen " +
      "i to puljer: formueforvaltning og medlemsadministration. Sidste kolonne viser formueforvaltningens " +
      "andel i procent af hele omkostningsbasen.",
    forbehold: [
      "Fordelingen er en nøgle pr. omkostningssted, ikke en måling. Den siger hvordan omkostningen fordeles på papiret, ikke hvor arbejdet faktisk blev udført.",
      "JOIN er et almindeligt join: posteringer på et omkostningssted uden fordelingsnøgle falder helt ud af både tælleren og nævneren.",
      "Nøglen bruges som den ser ud nu og anvendes på hele året, også selv om den måtte være ændret undervejs.",
      ...FAELLES_FORBEHOLD,
    ],
    graf: null,
  },

  {
    id: "it-pr-omkostningssted",
    spoergsmaal: "Hvilke omkostningssteder bruger mest på IT og licenser?",
    noegleord: ["omkostningssted", "omkostningssteder", "it", "afdeling", "afdelinger"],
    sql: `SELECT
  o.navn          AS omkostningssted,
  o.afdeling      AS afdeling,
  SUM(t.beloeb)   AS beloeb,
  COUNT(*)        AS posteringer
FROM transaktioner t
JOIN kontoplan k          ON k.kontonr         = t.kontonr
JOIN omkostningssteder o  ON o.omkostningssted = t.omkostningssted
WHERE k.kontogruppe = 'IT og licenser'
GROUP BY o.navn, o.afdeling
ORDER BY beloeb DESC`,
    forklaring:
      "Forespørgslen tager posteringerne i kontogruppen IT og licenser, kobler dem til " +
      "omkostningsstedets navn og afdeling, og summerer beløbet pr. omkostningssted. " +
      "Størst forbrug står øverst.",
    forbehold: [
      "Tallene er før fordelingsnøglen. Det er omkostningsstedets eget forbrug, ikke det beløb der ender på et forretningsområde.",
      "Central IT bogført ét sted fremstår som ét omkostningssteds forbrug, selv om det dækker hele huset.",
      "Omkostningssteder helt uden IT-posteringer mangler som række frem for at stå med 0 kr.",
      ...FAELLES_FORBEHOLD,
    ],
    graf: {
      type: "soejle",
      xNoegle: "omkostningssted",
      serier: [{ noegle: "beloeb", navn: "IT og licenser" }],
    },
  },
];

/** Bruges når spørgsmålet ikke ligner nogen af eksemplerne. */
export const STANDARDSVAR: Eksempelsvar = {
  id: "kontogrupper",
  spoergsmaal: "Hvordan fordeler omkostningsbasen sig på kontogrupper?",
  noegleord: [],
  sql: `SELECT
  k.kontogruppe   AS kontogruppe,
  SUM(t.beloeb)   AS beloeb,
  COUNT(*)        AS posteringer
FROM transaktioner t
JOIN kontoplan k ON k.kontonr = t.kontonr
GROUP BY k.kontogruppe
ORDER BY beloeb DESC`,
  forklaring:
    "Uden en API-nøgle kan appen ikke oversætte et frit spørgsmål til SQL. I stedet vises " +
    "et overblik: omkostningsbasen lagt sammen pr. kontogruppe for hele 2025.",
  forbehold: [
    "Dette svar er ikke et svar på dit spørgsmål — det er et fast overblik, fordi appen kører uden Claude.",
    "Sæt ANTHROPIC_API_KEY i .env og genstart for at stille frie spørgsmål.",
    ...FAELLES_FORBEHOLD,
  ],
  graf: {
    type: "soejle",
    xNoegle: "kontogruppe",
    serier: [{ noegle: "beloeb", navn: "Beløb 2025" }],
  },
};

/**
 * Vælger det eksempelsvar, der deler flest nøgleord med spørgsmålet.
 * Uden træffere falder vi tilbage på standardsvaret.
 */
export function vaelgEksempelsvar(spoergsmaal: string): Eksempelsvar {
  const tekst = spoergsmaal.toLowerCase();

  let bedste: Eksempelsvar | null = null;
  let bedsteScore = 0;

  for (const svar of EKSEMPELSVAR) {
    const score = svar.noegleord.filter((ord) => tekst.includes(ord)).length;
    if (score > bedsteScore) {
      bedste = svar;
      bedsteScore = score;
    }
  }

  return bedste ?? STANDARDSVAR;
}
