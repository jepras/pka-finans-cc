import { Database } from "bun:sqlite";
import { join } from "node:path";

import { sorterKontogrupper } from "./lib/theme.ts";
import { beskrivTabel, udledRelationer, type KolonneFakta, type TabelFakta } from "./skema.ts";
import { godkendLaesning, RAEKKEGRAENSE, TILLADTE_TABELLER } from "./sql-vagt.ts";
import type {
  DashboardData,
  KontogrupperPrKvartal,
  KreditorRaekke,
  Kvartal,
  KvartalsRaekke,
  Noegletal,
  Skema,
  SkemaRelation,
  SvarRaekke,
  TabelUdsnit,
} from "./types.ts";

const DB_STI = join(import.meta.dir, "..", "data", "finanskube-2025.sqlite");

/**
 * Read-only forbindelse. Databasen er et statisk udtræk — appen må aldrig skrive
 * til den, og `readonly` gør et forsøg til en fejl i stedet for en stille ændring.
 */
const db = new Database(DB_STI, { readonly: true });

const KVARTALER: Kvartal[] = ["Q1", "Q2", "Q3", "Q4"];

/** Beløb i basen er ekskl. moms; momsen holdes ude af omkostningsbasen. */
const totalerQuery = db.query<
  { omkostningsbase: number | null; momsIAlt: number | null; antalPosteringer: number },
  []
>(`
  SELECT
    SUM(beloeb) AS omkostningsbase,
    SUM(moms)   AS momsIAlt,
    COUNT(*)    AS antalPosteringer
  FROM transaktioner
`);

const antalKreditorerQuery = db.query<{ antal: number }, []>(`
  SELECT COUNT(DISTINCT kreditornr) AS antal FROM transaktioner
`);

const kontogruppeTotalerQuery = db.query<{ kontogruppe: string; beloeb: number }, []>(`
  SELECT k.kontogruppe AS kontogruppe, SUM(t.beloeb) AS beloeb
  FROM transaktioner t
  JOIN kontoplan k ON k.kontonr = t.kontonr
  GROUP BY k.kontogruppe
  ORDER BY beloeb DESC
`);

const kontogruppePrKvartalQuery = db.query<
  { kvartal: string; kontogruppe: string; beloeb: number },
  []
>(`
  SELECT t.kvartal AS kvartal, k.kontogruppe AS kontogruppe, SUM(t.beloeb) AS beloeb
  FROM transaktioner t
  JOIN kontoplan k ON k.kontonr = t.kontonr
  GROUP BY t.kvartal, k.kontogruppe
`);

const kreditorerQuery = db.query<
  {
    kreditornr: string;
    kreditornavn: string;
    kreditortype: string;
    land: string;
    beloeb: number;
    antalPosteringer: number;
  },
  [number]
>(`
  SELECT
    t.kreditornr                          AS kreditornr,
    COALESCE(kr.kreditornavn, t.kreditornr) AS kreditornavn,
    COALESCE(kr.kreditortype, 'Ukendt')     AS kreditortype,
    COALESCE(kr.land, '-')                  AS land,
    SUM(t.beloeb)                           AS beloeb,
    COUNT(*)                                AS antalPosteringer
  FROM transaktioner t
  LEFT JOIN kreditorer kr ON kr.kreditornr = t.kreditornr
  GROUP BY t.kreditornr
  ORDER BY beloeb DESC
  LIMIT ?
`);

/**
 * Fordeling på forretningsområder. LEFT JOIN, så en postering på et omkostningssted
 * uden fordelingsnøgle tælles som ufordelt i stedet for at forsvinde ud af totalen.
 */
const fordelingQuery = db.query<
  { formueforvaltning: number | null; medlemsadministration: number | null },
  []
>(`
  SELECT
    SUM(t.beloeb * COALESCE(f.andel_formueforvaltning, 0))    AS formueforvaltning,
    SUM(t.beloeb * COALESCE(f.andel_medlemsadministration, 0)) AS medlemsadministration
  FROM transaktioner t
  LEFT JOIN fordelingsnoegle f ON f.omkostningssted = t.omkostningssted
`);

const kontroltotalerQuery = db.query<{ total: number | null; antalPerioder: number }, []>(`
  SELECT SUM(total_ifoelge_finanskuben) AS total, COUNT(*) AS antalPerioder
  FROM kontroltotaler
`);

const periodeQuery = db.query<{ foerste: string | null; sidste: string | null }, []>(`
  SELECT MIN(periode) AS foerste, MAX(periode) AS sidste FROM transaktioner
`);

function andel(del: number, total: number): number {
  return total === 0 ? 0 : del / total;
}

function noegletal(): Noegletal {
  const totaler = totalerQuery.get();
  const omkostningsbase = totaler?.omkostningsbase ?? 0;
  const momsIAlt = totaler?.momsIAlt ?? 0;

  const kontogrupper = kontogruppeTotalerQuery.all();
  const stoerste = kontogrupper[0];

  const fordeling = fordelingQuery.get();
  const formueforvaltning = fordeling?.formueforvaltning ?? 0;
  const medlemsadministration = fordeling?.medlemsadministration ?? 0;

  const kontrol = kontroltotalerQuery.get();
  const totalIfoelgeFinanskuben = kontrol?.total ?? 0;
  const afvigelse = omkostningsbase - totalIfoelgeFinanskuben;

  return {
    omkostningsbase,
    momsIAlt,
    antalPosteringer: totaler?.antalPosteringer ?? 0,
    antalKreditorer: antalKreditorerQuery.get()?.antal ?? 0,
    stoersteKontogruppe: {
      kontogruppe: stoerste?.kontogruppe ?? "-",
      beloeb: stoerste?.beloeb ?? 0,
      andel: andel(stoerste?.beloeb ?? 0, omkostningsbase),
    },
    formueforvaltning: {
      beloeb: formueforvaltning,
      andel: andel(formueforvaltning, omkostningsbase),
    },
    medlemsadministration: {
      beloeb: medlemsadministration,
      andel: andel(medlemsadministration, omkostningsbase),
    },
    afstemning: {
      totalIfoelgeFinanskuben,
      afvigelse,
      afvigelseAndel: andel(afvigelse, totalIfoelgeFinanskuben),
      // Under 1 kr. i afvigelse er afrunding, ikke et hul i udtrækket.
      stemmer: Math.abs(afvigelse) < 1,
      antalPerioder: kontrol?.antalPerioder ?? 0,
    },
  };
}

function kontogrupperPrKvartal(): KontogrupperPrKvartal {
  const rows = kontogruppePrKvartalQuery.all();
  const kontogrupper = sorterKontogrupper([...new Set(rows.map((r) => r.kontogruppe))]);

  const raekker = KVARTALER.map((kvartal) => {
    const raekke = { kvartal, total: 0 } as KvartalsRaekke;
    for (const gruppe of kontogrupper) raekke[gruppe] = 0;

    for (const r of rows) {
      if (r.kvartal !== kvartal) continue;
      raekke[r.kontogruppe] = r.beloeb;
      raekke.total += r.beloeb;
    }
    return raekke;
  });

  return { kontogrupper, raekker };
}

function topKreditorer(graense: number, omkostningsbase: number): KreditorRaekke[] {
  return kreditorerQuery.all(graense).map((r) => ({
    ...r,
    andel: andel(r.beloeb, omkostningsbase),
  }));
}

/**
 * Hele dashboardet i ét svar. Datasættet er statisk, så resultatet beregnes én gang
 * pr. proces — hot reload i udvikling giver en frisk proces og dermed friske tal.
 */
let cache: DashboardData | null = null;

export function hentDashboard(): DashboardData {
  if (cache) return cache;

  const tal = noegletal();
  const periode = periodeQuery.get();

  cache = {
    noegletal: tal,
    kontogrupperPrKvartal: kontogrupperPrKvartal(),
    topKreditorer: topKreditorer(15, tal.omkostningsbase),
    periode: {
      foerste: periode?.foerste ?? "2025-01",
      sidste: periode?.sidste ?? "2025-12",
    },
  };

  return cache;
}

/* ---------- Fri læsning til spørg-panelet ---------- */

const skemaQuery = db.query<{ name: string; sql: string | null }, []>(`
  SELECT name, sql FROM sqlite_master WHERE type = 'table' ORDER BY name
`);

/**
 * Databasens faktiske DDL for de tilladte tabeller. Sendes til modellen som
 * skemabeskrivelse, så prompten ikke kan komme til at beskrive noget, der ikke
 * står i filen.
 */
export function skemaDDL(): string {
  const tilladte = new Set<string>(TILLADTE_TABELLER);
  return skemaQuery
    .all()
    .filter((t) => tilladte.has(t.name) && t.sql)
    .map((t) => `${t.sql!.trim()};`)
    .join("\n\n");
}

/* ---------- Skema til "Se data" ---------- */

/** Antal rækker panelet viser, når man åbner en tabel. */
export const UDSNITSGRAENSE = 20;

/**
 * Tabellerne i filen, uden SQLites egne. Læses én gang: databasen er et statisk
 * udtræk, og navnene er samtidig den liste, tabelopslag valideres mod.
 */
let tabelnavne: string[] | null = null;

function navne(): string[] {
  tabelnavne ??= skemaQuery
    .all()
    .map((t) => t.name)
    .filter((navn) => !navn.startsWith("sqlite_"));
  return tabelnavne;
}

export function erTabel(navn: string): boolean {
  return navne().includes(navn);
}

/**
 * Tabel- og kolonnenavne sættes ind i SQL'en frem for som parametre — PRAGMA og
 * FROM tager ikke bindinger. Begge dele kommer fra databasens eget skema og er
 * slået op i `navne()` først, så der er ingen vej ind udefra.
 */
function citer(navn: string): string {
  return `"${navn.replace(/"/g, '""')}"`;
}

type PragmaKolonne = { name: string; type: string; pk: number };
type PragmaFremmednoegle = { table: string; from: string };

function antalRaekker(tabel: string): number {
  return db.query<{ antal: number }, []>(`SELECT COUNT(*) AS antal FROM ${citer(tabel)}`).get()!
    .antal;
}

function forskelligeVaerdier(tabel: string, kolonne: string): number {
  return db
    .query<{ antal: number }, []>(
      `SELECT COUNT(DISTINCT ${citer(kolonne)}) AS antal FROM ${citer(tabel)}`,
    )
    .get()!.antal;
}

/** Erklærede fremmednøgler, hvis udtrækket har dem. Tomt for Finanskube-filen. */
function erklaeredeRelationer(tabeller: string[]): SkemaRelation[] {
  return tabeller.flatMap((tabel) =>
    db
      .query<PragmaFremmednoegle, []>(`PRAGMA foreign_key_list(${citer(tabel)})`)
      .all()
      .filter((fk) => tabeller.includes(fk.table))
      .map((fk) => ({ fra: tabel, til: fk.table, kolonne: fk.from })),
  );
}

function tabelFakta(): TabelFakta[] {
  const raa = navne().map((navn) => ({
    navn,
    antal: antalRaekker(navn),
    kolonner: db.query<PragmaKolonne, []>(`PRAGMA table_info(${citer(navn)})`).all(),
  }));

  // Kun kolonnenavne, der går igen i flere tabeller, kan være en sammenhæng —
  // og kun dem tæller vi forskellige værdier på.
  const forekomster = new Map<string, number>();
  for (const t of raa) {
    for (const k of t.kolonner) forekomster.set(k.name, (forekomster.get(k.name) ?? 0) + 1);
  }

  return raa.map((t) => ({
    navn: t.navn,
    antalRaekker: t.antal,
    kolonner: t.kolonner.map(
      (k): KolonneFakta => ({
        navn: k.name,
        type: k.type,
        primaernoegle: k.pk > 0,
        entydig:
          k.pk > 0 ||
          ((forekomster.get(k.name) ?? 0) > 1 &&
            t.antal > 0 &&
            forskelligeVaerdier(t.navn, k.name) === t.antal),
      }),
    ),
  }));
}

let skemaCache: Skema | null = null;

/** Hele skemaet som panelet tegner det. Læses af filen selv, ikke af en fast liste. */
export function hentSkema(): Skema {
  if (skemaCache) return skemaCache;

  const fakta = tabelFakta();

  skemaCache = {
    tabeller: fakta.map((t) => ({
      navn: t.navn,
      antalRaekker: t.antalRaekker,
      beskrivelse: beskrivTabel(t),
      kolonner: t.kolonner.map(({ navn, type, primaernoegle }) => ({
        navn,
        type,
        primaernoegle,
      })),
    })),
    relationer: udledRelationer(fakta, erklaeredeRelationer(navne())),
  };

  return skemaCache;
}

/** De første rækker af én tabel. Navnet skal være en tabel i filen. */
export function hentTabeludsnit(tabel: string): TabelUdsnit | null {
  if (!erTabel(tabel)) return null;

  const stmt = db.prepare<SvarRaekke, []>(
    `SELECT * FROM ${citer(tabel)} LIMIT ${UDSNITSGRAENSE}`,
  );

  try {
    const raekker = stmt.all();
    const fraStmt = (stmt as unknown as { columnNames?: string[] }).columnNames;

    return {
      tabel,
      kolonner: fraStmt?.length ? fraStmt : Object.keys(raekker[0] ?? {}),
      raekker,
      antalRaekker: antalRaekker(tabel),
    };
  } finally {
    stmt.finalize();
  }
}

export type LaesningResultat =
  | { ok: true; kolonner: string[]; raekker: SvarRaekke[]; afkortet: boolean }
  | { ok: false; grund: string };

/** Kører én SELECT efter vagtens godkendelse. Alt andet afvises før SQLite. */
export function koerLaesning(raaSql: string): LaesningResultat {
  const vagt = godkendLaesning(raaSql);
  if (!vagt.ok) return { ok: false, grund: vagt.grund };

  // prepare frem for query: brugerens SQL varierer, og vi vil ikke fylde
  // statement-cachen op med engangsforespørgsler.
  let stmt;
  try {
    stmt = db.prepare<SvarRaekke, []>(vagt.sql);
  } catch (fejl) {
    return { ok: false, grund: `SQL kunne ikke fortolkes: ${(fejl as Error).message}` };
  }

  try {
    const alle = stmt.all();
    const afkortet = alle.length > RAEKKEGRAENSE;
    const raekker = afkortet ? alle.slice(0, RAEKKEGRAENSE) : alle;

    const fraStmt = (stmt as unknown as { columnNames?: string[] }).columnNames;
    const kolonner = fraStmt?.length ? fraStmt : Object.keys(raekker[0] ?? {});

    return { ok: true, kolonner, raekker, afkortet };
  } catch (fejl) {
    return { ok: false, grund: `Forespørgslen fejlede: ${(fejl as Error).message}` };
  } finally {
    stmt.finalize();
  }
}
