// Gemmer et svar som to filer i rapporter/: forespørgslen og en læsbar note.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { query } from "./db";
import { erLaesning } from "./provider";
import { erBeloebskolonne, kr, tal } from "@/lib/utils";
import type { Raekke } from "@/lib/typer";

const rod = new URL("..", import.meta.url).pathname;
const mappe = `${rod}rapporter/`;

export type RapportOenske = {
  spoergsmaal?: string;
  titel?: string;
  sql?: string;
  forklaring?: string;
};

export function gemRapport(oenske: RapportOenske): {
  status: number;
  krop: { sqlFil: string; mdFil: string } | { fejl: string };
} {
  const sql = oenske.sql?.trim();
  if (!sql) return { status: 400, krop: { fejl: "Der er ingen SQL at gemme." } };

  // Samme kontrol som ved et spørgsmål. Vi gemmer ikke SQL, vi ikke selv vil køre.
  if (!erLaesning(sql)) {
    return { status: 422, krop: { fejl: "SQL'en består ikke læsekontrollen og blev ikke gemt." } };
  }

  // Rækkerne hentes forfra i stedet for at stole på det, browseren sender.
  // Så svarer rapporten altid til, hvad databasen faktisk giver.
  let raekker: Raekke[];
  try {
    raekker = query<Raekke>(sql);
  } catch (fejl) {
    const tekst = fejl instanceof Error ? fejl.message : String(fejl);
    return { status: 422, krop: { fejl: `SQL'en kunne ikke køre, så intet blev gemt: ${tekst}` } };
  }

  const titel = oenske.titel?.trim() || "Uden titel";
  const spoergsmaal = oenske.spoergsmaal?.trim() || "Ikke oplyst";
  const forklaring = oenske.forklaring?.trim() || "Ingen forklaring.";
  const dato = idag();

  mkdirSync(mappe, { recursive: true });
  const navn = ledigtNavn(`${dato}-${slug(titel)}`);

  writeFileSync(`${mappe}${navn}.sql`, sqlFil(titel, spoergsmaal, dato, sql), "utf8");
  writeFileSync(
    `${mappe}${navn}.md`,
    mdFil(titel, spoergsmaal, forklaring, dato, sql, raekker),
    "utf8",
  );

  return { status: 200, krop: { sqlFil: `rapporter/${navn}.sql`, mdFil: `rapporter/${navn}.md` } };
}

// sv-SE giver 2026-09-16, altså ISO-format, men i lokal tid.
// toISOString ville give UTC og dermed forkert dato sidst på dagen i Danmark.
const idag = () => new Date().toLocaleDateString("sv-SE");

// Kun små bogstaver, tal og bindestreg, så filnavnet ikke kan pege uden for rapporter/.
function slug(titel: string) {
  const rent = titel
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return rent || "rapport";
}

// To klik på samme svar må ikke overskrive den første rapport.
function ledigtNavn(grundnavn: string) {
  if (!existsSync(`${mappe}${grundnavn}.md`) && !existsSync(`${mappe}${grundnavn}.sql`)) {
    return grundnavn;
  }
  for (let n = 2; n < 100; n++) {
    const forsoeg = `${grundnavn}-${n}`;
    if (!existsSync(`${mappe}${forsoeg}.md`) && !existsSync(`${mappe}${forsoeg}.sql`)) {
      return forsoeg;
    }
  }
  return `${grundnavn}-${Date.now()}`;
}

function sqlFil(titel: string, spoergsmaal: string, dato: string, sql: string) {
  return [
    `-- ${titel}`,
    `-- Spørgsmål: ${spoergsmaal}`,
    `-- Gemt: ${dato}`,
    "-- Kør mod finanskube-2025.sqlite efter data/rettelser.sql.",
    "",
    sql.replace(/;*\s*$/, ";"),
    "",
  ].join("\n");
}

function mdFil(
  titel: string,
  spoergsmaal: string,
  forklaring: string,
  dato: string,
  sql: string,
  raekker: Raekke[],
) {
  return [
    `# ${titel}`,
    "",
    `**Spørgsmål:** ${spoergsmaal}`,
    "",
    `**Dato:** ${dato}`,
    "",
    "## Hvad gør den",
    "",
    forklaring,
    "",
    "## Forespørgsel",
    "",
    "```sql",
    sql.trim(),
    "```",
    "",
    "## Resultat",
    "",
    markdownTabel(raekker),
    "",
  ].join("\n");
}

function markdownTabel(raekker: Raekke[]) {
  if (!raekker.length) return "Forespørgslen gav ingen rækker.";
  const kolonner = Object.keys(raekker[0]);
  const linjer = [
    `| ${kolonner.join(" | ")} |`,
    `| ${kolonner.map(() => "---").join(" | ")} |`,
    ...raekker.map((r) => `| ${kolonner.map((k) => celle(k, r[k])).join(" | ")} |`),
  ];
  return linjer.join("\n");
}

function celle(navn: string, vaerdi: string | number | null) {
  if (vaerdi === null || vaerdi === undefined) return "tom";
  if (typeof vaerdi === "number") {
    return erBeloebskolonne(navn) ? kr(vaerdi) : tal(vaerdi, Number.isInteger(vaerdi) ? 0 : 2);
  }
  // En lodret streg i en tekst ville ellers bryde tabellen.
  return String(vaerdi).replace(/\|/g, "\\|");
}
