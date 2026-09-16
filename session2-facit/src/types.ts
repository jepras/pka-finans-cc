/** Delte typer mellem server og klient. Feltnavne følger datamodellen (dansk). */

export type Kvartal = "Q1" | "Q2" | "Q3" | "Q4";

export type Noegletal = {
  /** Sum af beloeb (ekskl. moms) for hele 2025. */
  omkostningsbase: number;
  /** Sum af moms for hele 2025. Indgår ikke i omkostningsbasen. */
  momsIAlt: number;
  antalPosteringer: number;
  antalKreditorer: number;
  /** Største kontogruppe målt på beloeb. */
  stoersteKontogruppe: { kontogruppe: string; beloeb: number; andel: number };
  /** Fordeling af omkostningsbasen via fordelingsnoegle, i kr. og som andel (0-1). */
  formueforvaltning: { beloeb: number; andel: number };
  medlemsadministration: { beloeb: number; andel: number };
  /** Afstemning mod kontroltotaler: udtrukket vs. Finanskubens egen total. */
  afstemning: {
    totalIfoelgeFinanskuben: number;
    afvigelse: number;
    afvigelseAndel: number;
    stemmer: boolean;
    antalPerioder: number;
  };
};

/** Én række pr. kvartal med et felt pr. kontogruppe — klar til stacked bar. */
export type KvartalsRaekke = {
  kvartal: Kvartal;
  total: number;
} & Record<string, number | string>;

export type KontogrupperPrKvartal = {
  kontogrupper: string[];
  raekker: KvartalsRaekke[];
};

export type KreditorRaekke = {
  kreditornr: string;
  kreditornavn: string;
  kreditortype: string;
  land: string;
  beloeb: number;
  antalPosteringer: number;
  /** Andel af den samlede omkostningsbase, 0-1. */
  andel: number;
};

/* ---------- Spørg-panel ---------- */

export type Kilde = "claude" | "eksempelsvar";

export type Status = {
  kilde: Kilde;
  model: string | null;
  /** Kort forklaring til brugeren af, hvorfor appen kører i den tilstand. */
  begrundelse: string;
};

export type GrafType = "soejle" | "linje";

/** Grafopskrift knyttet til et resultatsæt. Nøgler skal findes i `kolonner`. */
export type GrafSpec = {
  type: GrafType;
  xNoegle: string;
  serier: { noegle: string; navn: string }[];
};

export type SvarRaekke = Record<string, string | number | null>;

export type Svar = {
  spoergsmaal: string;
  kilde: Kilde;
  sql: string;
  /** Hvad SQL'en gør, på almindeligt dansk. */
  forklaring: string;
  /** Hvad SQL'en ikke tager højde for. */
  forbehold: string[];
  kolonner: string[];
  raekker: SvarRaekke[];
  /** Sat når resultatet blev skåret ned til rækkegrænsen. */
  afkortet: boolean;
  graf: GrafSpec | null;
};

export type GemtRapport = {
  filnavn: string;
  /** Sti relativt til projektroden, fx rapporter/2025-11-04-licenser-q4.md */
  sti: string;
};

export type SpoergFejl = {
  fejl: string;
  /** SQL'en vises også når den blev afvist, så man kan se hvad der blev foreslået. */
  sql?: string;
};

export type DashboardData = {
  noegletal: Noegletal;
  kontogrupperPrKvartal: KontogrupperPrKvartal;
  topKreditorer: KreditorRaekke[];
  periode: { foerste: string; sidste: string };
};
