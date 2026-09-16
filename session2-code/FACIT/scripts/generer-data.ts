// Genererer data/finanskube-2025.sqlite. Alt er syntetisk.
// Kør: bun run scripts/generer-data.ts
import { Database } from "bun:sqlite";
import { unlinkSync, existsSync } from "node:fs";

const FIL = new URL("../data/finanskube-2025.sqlite", import.meta.url).pathname;
if (existsSync(FIL)) unlinkSync(FIL);
const db = new Database(FIL);

// Deterministisk tilfældighed, så filen er den samme hver gang
let seed = 20250916;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const mellem = (a: number, b: number) => a + rnd() * (b - a);
const rund = (x: number) => Math.round(x / 50) * 50;

db.exec(`
CREATE TABLE kontoplan (kontonr TEXT PRIMARY KEY, kontonavn TEXT NOT NULL, kontogruppe TEXT NOT NULL);
CREATE TABLE kreditorer (kreditornr TEXT PRIMARY KEY, kreditornavn TEXT NOT NULL, kreditortype TEXT NOT NULL, land TEXT NOT NULL);
CREATE TABLE omkostningssteder (omkostningssted TEXT PRIMARY KEY, navn TEXT NOT NULL, afdeling TEXT NOT NULL);
CREATE TABLE fordelingsnoegle (omkostningssted TEXT PRIMARY KEY, andel_formueforvaltning REAL NOT NULL, andel_medlemsadministration REAL NOT NULL);
CREATE TABLE transaktioner (
  bilagsnr TEXT NOT NULL, bogfoeringsdato TEXT NOT NULL, periode TEXT NOT NULL, kvartal TEXT NOT NULL,
  kontonr TEXT NOT NULL, kreditornr TEXT, omkostningssted TEXT NOT NULL,
  beloeb REAL NOT NULL, moms REAL NOT NULL, posteringstekst TEXT NOT NULL
);
CREATE TABLE kontroltotaler (periode TEXT PRIMARY KEY, total_ifoelge_finanskuben REAL NOT NULL);
`);

const kontoplan: [string, string, string][] = [
  ["5010", "Løn og gager", "Personale"], ["5020", "Pension, arbejdsgiverandel", "Personale"],
  ["5030", "Kurser og uddannelse", "Personale"], ["5040", "Rejser og repræsentation", "Personale"],
  ["5050", "Kantine og personalegoder", "Personale"],
  ["6010", "Softwarelicenser", "IT og licenser"], ["6020", "Cloud og hosting", "IT og licenser"],
  ["6030", "Hardware og pc-arbejdsplads", "IT og licenser"], ["6040", "Telefoni og netværk", "IT og licenser"],
  ["6050", "IT-support, ekstern", "IT og licenser"],
  ["7010", "Husleje", "Lokaler"], ["7020", "El, vand og varme", "Lokaler"], ["7030", "Rengøring", "Lokaler"],
  ["7040", "Vedligeholdelse af lokaler", "Lokaler"],
  ["8010", "Revision", "Eksterne rådgivere"], ["8020", "Juridisk rådgivning", "Eksterne rådgivere"],
  ["8030", "Konsulentydelser", "Eksterne rådgivere"], ["8040", "Aktuarrådgivning", "Eksterne rådgivere"],
  ["8510", "Depotgebyrer", "Depot og forvaltning"], ["8520", "Markedsdata og kursinformation", "Depot og forvaltning"],
  ["8530", "Transaktionsomkostninger", "Depot og forvaltning"], ["8540", "Systemer til porteføljestyring", "Depot og forvaltning"],
  ["9010", "Kontorartikler og tryk", "Øvrig administration"], ["9020", "Porto og forsendelse", "Øvrig administration"],
  ["9030", "Forsikringer", "Øvrig administration"], ["9040", "Kontingenter og abonnementer", "Øvrig administration"],
  ["9050", "Gebyrer, bank", "Øvrig administration"],
];
const insKonto = db.prepare("INSERT INTO kontoplan VALUES (?,?,?)");
for (const k of kontoplan) insKonto.run(...k);

// kreditornr, navn, type, land, konti de typisk rammer, månedligt beløb (0 = ad hoc), sandsynlighed for ad hoc
type Kred = [string, string, string, string, string[], number, number];
const kreditorer: Kred[] = [
  ["K1001", "Bjergsø Lønservice A/S", "Lønbureau", "DK", ["5010", "5020"], 0, 0],
  ["K1010", "Nordlys Software ApS", "Softwareleverandør", "DK", ["6010"], 84500, 0.15],
  ["K1011", "Nordlys Software", "Softwareleverandør", "DK", ["6010"], 0, 0.35],
  ["K1012", "Fjordhavn Cloud Services", "Hosting", "DK", ["6020"], 61200, 0.1],
  ["K1013", "Stellaris Analytics Ltd", "Softwareleverandør", "UK", ["6010", "8520"], 42800, 0.1],
  ["K1014", "Kystlinje IT-Support ApS", "IT-leverandør", "DK", ["6050", "6030"], 27500, 0.4],
  ["K1015", "Telenord Danmark A/S", "Telefoni", "DK", ["6040"], 18900, 0.05],
  ["K1016", "Granit Hardware ApS", "Hardware", "DK", ["6030"], 0, 0.5],
  ["K1017", "Vindrose Licensgruppen A/S", "Softwareleverandør", "DK", ["6010"], 0, 0.3],
  ["K1018", "Havbris Data Platform", "Softwareleverandør", "SE", ["6020", "6010"], 0, 0.3],
  ["K2001", "Ejendomsselskabet Tofteparken", "Udlejer", "DK", ["7010"], 415000, 0],
  ["K2002", "Nordkraft Energi A/S", "Forsyning", "DK", ["7020"], 38600, 0.1],
  ["K2003", "Rensam Rengøring ApS", "Service", "DK", ["7030"], 46200, 0.1],
  ["K2004", "Bygholm Ejendomsservice", "Service", "DK", ["7040"], 0, 0.5],
  ["K3001", "Revisionshuset Lindegaard", "Revisor", "DK", ["8010"], 0, 0.6],
  ["K3002", "Advokatfirmaet Søholt & Brink", "Advokat", "DK", ["8020"], 0, 0.6],
  ["K3003", "Kompas Management Consulting", "Konsulenthus", "DK", ["8030"], 0, 0.7],
  ["K3004", "Aktuarhuset Nord", "Aktuar", "DK", ["8040"], 0, 0.4],
  ["K3005", "Brohoved Consulting Group", "Konsulenthus", "DK", ["8030"], 0, 0.6],
  ["K3006", "Meridian Advisory GmbH", "Konsulenthus", "DE", ["8030"], 0, 0.3],
  ["K4001", "Nordisk Depotbank A/S", "Depotbank", "DK", ["8510", "8530"], 312000, 0.2],
  ["K4002", "Marketline Data Services", "Markedsdata", "UK", ["8520"], 96400, 0.1],
  ["K4003", "Portefølje Systemer A/S", "Softwareleverandør", "DK", ["8540"], 138000, 0.1],
  ["K4004", "Clearhouse Europe SA", "Clearing", "LU", ["8530"], 0, 0.5],
  ["K5001", "Skriverhuset ApS", "Kontorforsyning", "DK", ["9010"], 0, 0.6],
  ["K5002", "PostNord Danmark", "Forsendelse", "DK", ["9020"], 6800, 0.2],
  ["K5003", "Tryghedsgruppen Forsikring", "Forsikring", "DK", ["9030"], 0, 0.15],
  ["K5004", "Finansforeningen", "Forening", "DK", ["9040"], 0, 0.2],
  ["K5005", "Nordbanken A/S", "Bank", "DK", ["9050"], 4200, 0.3],
  ["K5006", "Kantinekompagniet ApS", "Kantine", "DK", ["5050"], 72500, 0.2],
  ["K5007", "Kursuscenter Havnefronten", "Kursus", "DK", ["5030"], 0, 0.6],
  ["K5008", "Rejsebureauet Kompasrosen", "Rejser", "DK", ["5040"], 0, 0.7],
  ["K5009", "Brancheforum Pension", "Forening", "DK", ["9040", "5030"], 0, 0.3],
];
const insKred = db.prepare("INSERT INTO kreditorer VALUES (?,?,?,?)");
for (const k of kreditorer) insKred.run(k[0], k[1], k[2], k[3]);

const steder: [string, string, string, number][] = [
  ["100", "Direktion", "Ledelse", 0.5],
  ["200", "Økonomi og skat", "Finans", 0.4],
  ["300", "Risikostyring og compliance", "Finans", 0.6],
  ["400", "Data, valuation og reporting", "Finans", 0.7],
  ["500", "IT og drift", "Finans", 0.5],
  ["600", "HR", "Finans", 0.2],
  ["700", "Fondsadministration", "Finans", 0.85],   // mangler i fordelingsnøglen, med vilje
  ["800", "Fælles og faciliteter", "Stab", 0.45],
];
const insSted = db.prepare("INSERT INTO omkostningssteder VALUES (?,?,?)");
const insNoegle = db.prepare("INSERT INTO fordelingsnoegle VALUES (?,?,?)");
for (const s of steder) {
  insSted.run(s[0], s[1], s[2]);
  if (s[0] !== "700") insNoegle.run(s[0], s[3], Math.round((1 - s[3]) * 100) / 100);
}

const perioder = Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, "0")}`);
const kvartalAf = (p: string) => `Q${Math.ceil(Number(p.slice(5)) / 3)}`;
const dagI = (p: string) => `${p}-${String(Math.floor(mellem(1, 28))).padStart(2, "0")}`;
const insTx = db.prepare("INSERT INTO transaktioner VALUES (?,?,?,?,?,?,?,?,?,?)");
let bilag = 250001;
const nyBilag = () => `B${bilag++}`;
const tekster: Record<string, string[]> = {
  "5010": ["Løn {p}", "Lønkørsel {p}"], "5020": ["Pensionsbidrag {p}"], "5030": ["Kursus, {n}", "Uddannelsesforløb"],
  "5040": ["Rejse, {n}", "Repræsentation"], "5050": ["Kantinedrift {p}", "Frugtordning"],
  "6010": ["Licenser {p}", "Licensfornyelse", "Tillægsbrugere"], "6020": ["Hosting {p}", "Cloudforbrug {p}"],
  "6030": ["Laptops, udskiftning", "Skærme og docking", "Pc-arbejdsplads, opsætning"], "6040": ["Telefoni {p}", "Netværk {p}"],
  "6050": ["Support {p}", "Timer, support"], "7010": ["Husleje {p}"], "7020": ["Forbrug {p}"], "7030": ["Rengøring {p}"],
  "7040": ["Reparation, ventilation", "Maling af mødelokaler", "Låsesystem"], "8010": ["Revision, årsregnskab", "Revision, delårsgennemgang", "Erklæringsopgave"],
  "8020": ["Juridisk bistand, kontrakt", "Juridisk vurdering", "Udbudsrådgivning"], "8030": ["Konsulentbistand, {n}", "Projektassistance", "Analyse, {n}"],
  "8040": ["Aktuarberegning", "Hensættelsesmodel, gennemgang"], "8510": ["Depotgebyr {p}"], "8520": ["Markedsdata {p}"],
  "8530": ["Transaktionsomkostninger {p}", "Clearing {p}"], "8540": ["Systemabonnement {p}"], "9010": ["Kontorartikler", "Tryksager"],
  "9020": ["Porto {p}"], "9030": ["Erhvervsforsikring", "Bestyrelsesansvar"], "9040": ["Kontingent 2025", "Abonnement, tidsskrift"], "9050": ["Bankgebyrer {p}"],
};
const emner = ["risikorapportering", "datavarehus", "regnskabsproces", "compliance", "porteføljesystem", "budgetmodel"];
const tekst = (konto: string, p: string) => pick(tekster[konto]).replace("{p}", p).replace("{n}", pick(emner));

const kontoSteder: Record<string, string[]> = {
  "5": steder.map((s) => s[0]), "6": ["500", "200", "300", "400"], "7": ["800"], "8": ["200", "300", "400", "100"], "9": ["800", "200", "100", "600"],
};
const stedFor = (konto: string) => konto.startsWith("85") ? pick(["700", "400"]) : pick(kontoSteder[konto[0]]);

// Løn: én postering pr. omkostningssted pr. måned, ingen moms
const loen: Record<string, number> = { "100": 620000, "200": 1180000, "300": 1420000, "400": 1650000, "500": 1310000, "600": 410000, "700": 420000, "800": 350000 };
for (const p of perioder) {
  for (const s of steder) {
    const l = rund(loen[s[0]] * mellem(0.97, 1.03));
    insTx.run(nyBilag(), `${p}-28`, p, kvartalAf(p), "5010", "K1001", s[0], l, 0, tekst("5010", p));
    insTx.run(nyBilag(), `${p}-28`, p, kvartalAf(p), "5020", "K1001", s[0], rund(l * 0.12), 0, tekst("5020", p));
  }
}

// Faste månedlige kreditorer
for (const k of kreditorer) {
  if (k[5] === 0) continue;
  for (const p of perioder) {
    const konto = k[4][0];
    const b = rund(k[5] * mellem(0.96, 1.04));
    insTx.run(nyBilag(), dagI(p), p, kvartalAf(p), konto, k[0], stedFor(konto), b, Math.round(b * 0.25), tekst(konto, p));
  }
}

// Ad hoc: ca. 2.300 posteringer fordelt over året
for (let i = 0; i < 4600; i++) {
  const k = pick(kreditorer.filter((x) => x[6] > 0));
  if (rnd() > k[6] + 0.3) continue;
  const konto = pick(k[4]);
  const p = pick(perioder);
  const stoerrelse = konto.startsWith("8") ? mellem(15000, 240000) : konto.startsWith("6") ? mellem(2500, 90000) : mellem(800, 45000);
  const b = rund(stoerrelse);
  insTx.run(nyBilag(), dagI(p), p, kvartalAf(p), konto, k[0], stedFor(konto), b, Math.round(b * 0.25), tekst(konto, p));
}

// Fælde 1: huslejeforudbetaling bogført to gange i oktober med to bilagsnumre
const dublet = ["2025-10-03", "2025-10", "Q4", "7010", "K2001", "800", 48000, 0, "Forudbetaling, huslejeregulering Q4"] as const;
insTx.run(nyBilag(), ...dublet);
const dubletBilag = nyBilag();
insTx.run(dubletBilag, ...dublet);

// Kontroltotaler: hvad Finanskuben "selv" siger, altså uden dubletten
const rows = db.query<{ periode: string; total: number }, []>("SELECT periode, SUM(beloeb) AS total FROM transaktioner GROUP BY periode").all();
const insTot = db.prepare("INSERT INTO kontroltotaler VALUES (?,?)");
for (const r of rows) insTot.run(r.periode, r.periode === "2025-10" ? r.total - 48000 : r.total);

db.exec("CREATE INDEX ix_tx_periode ON transaktioner(periode); CREATE INDEX ix_tx_konto ON transaktioner(kontonr); CREATE INDEX ix_tx_kred ON transaktioner(kreditornr);");

const n = db.query<{ n: number }, []>("SELECT COUNT(*) AS n FROM transaktioner").get()!.n;
const total = db.query<{ t: number }, []>("SELECT SUM(beloeb) AS t FROM transaktioner").get()!.t;
console.log(`Skrev ${n} transaktioner, total ${total.toLocaleString("da-DK")} kr., dubletbilag ${dubletBilag}`);
db.close();
