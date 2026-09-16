// Typer der deles mellem server og UI. Ingen imports, så filen kan bruges begge steder.

export type Tilstand = "claude" | "mock";

export type Kpi = {
  samletBeloeb: number;
  antalBilag: number;
  stoersteKontogruppe: { navn: string; beloeb: number; andel: number };
  formueforvaltning: { beloeb: number; andel: number; daekning: number };
};

export type KvartalRaekke = { kvartal: string } & Record<string, number | string>;

export type KreditorRaekke = {
  kreditornavn: string;
  beloeb: number;
  antal: number;
  andel: number;
};

export type Graftype = "soejle" | "linje" | "ingen";

export type Raekke = Record<string, string | number | null>;

export type AskSvar = {
  titel: string;
  sql: string;
  forklaring: string;
  graftype: Graftype;
  raekker: Raekke[];
  afkortet: boolean;
};

// Ved fejl sendes SQL'en med tilbage, hvis den findes, så man kan se hvad der blev afvist.
export type AskFejl = {
  fejl: string;
  titel?: string;
  sql?: string;
  forklaring?: string;
};

export type RapportSvar = { sqlFil: string; mdFil: string };

export type DashboardData = {
  tilstand: Tilstand;
  kpi: Kpi;
  kontogrupper: string[];
  kvartaler: KvartalRaekke[];
  kreditorer: KreditorRaekke[];
};
