/**
 * Gemmer et svar som en Markdown-rapport i rapporter/, klar til at sende videre.
 *
 * Filen skrives altid inde i rapporter/ — filnavnet dannes af os selv ud fra
 * spørgsmålet, aldrig af noget klienten sender, så et spørgsmål med skråstreger
 * eller ".." ikke kan pege et andet sted hen.
 */

import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { formatVaerdi } from "./lib/format.ts";
import type { Svar, SvarRaekke } from "./types.ts";

export const RAPPORTMAPPE = join(import.meta.dir, "..", "rapporter");

/** Længste del af filnavnet, der kommer fra spørgsmålet. */
const MAKS_SLUG = 60;

function slug(tekst: string): string {
  const oversat = tekst
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  const rent = oversat
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAKS_SLUG)
    .replace(/-+$/g, "");

  return rent || "rapport";
}

function idag(): string {
  const nu = new Date();
  const to = (n: number) => String(n).padStart(2, "0");
  return `${nu.getFullYear()}-${to(nu.getMonth() + 1)}-${to(nu.getDate())}`;
}

/** Rørtegn ville bryde Markdown-tabellen. */
function celle(vaerdi: string): string {
  return vaerdi.replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

function pænKolonne(navn: string): string {
  const med_mellemrum = navn.replace(/_/g, " ").trim();
  return med_mellemrum.charAt(0).toUpperCase() + med_mellemrum.slice(1);
}

function markdownTabel(kolonner: string[], raekker: SvarRaekke[]): string {
  if (kolonner.length === 0 || raekker.length === 0) {
    return "_Forespørgslen gav ingen rækker._";
  }

  const højrestillet = kolonner.map((k) => typeof raekker[0]?.[k] === "number");

  const linjer = [
    `| ${kolonner.map((k) => celle(pænKolonne(k))).join(" | ")} |`,
    `| ${højrestillet.map((tal) => (tal ? "---:" : ":---")).join(" | ")} |`,
    ...raekker.map(
      (raekke) =>
        `| ${kolonner.map((k) => celle(formatVaerdi(k, raekke[k] ?? null))).join(" | ")} |`,
    ),
  ];

  return linjer.join("\n");
}

/** Kroppen kommer fra browseren, så vi tjekker formen frem for at stole på den. */
export function erSvar(v: unknown): v is Svar {
  if (typeof v !== "object" || v === null) return false;
  const k = v as Record<string, unknown>;

  return (
    typeof k.spoergsmaal === "string" &&
    k.spoergsmaal.trim().length > 0 &&
    typeof k.sql === "string" &&
    typeof k.forklaring === "string" &&
    Array.isArray(k.forbehold) &&
    k.forbehold.every((p) => typeof p === "string") &&
    Array.isArray(k.kolonner) &&
    k.kolonner.every((c) => typeof c === "string") &&
    Array.isArray(k.raekker) &&
    (k.kilde === "claude" || k.kilde === "eksempelsvar")
  );
}

export function byggRapport(svar: Svar): string {
  const kilde =
    svar.kilde === "claude"
      ? "SQL'en er skrevet af Claude ud fra spørgsmålet."
      : "Appen kørte uden API-nøgle. SQL'en kommer fra appens faste sæt eksempelsvar og svarer måske ikke præcist på spørgsmålet.";

  return `# ${svar.spoergsmaal}

Rapport fra PKA A/S — omkostningsbase 2025. Dannet ${idag()}.

## Sådan skal den læses

${svar.forklaring}

### Det tager forespørgslen ikke højde for

${svar.forbehold.map((punkt) => `- ${punkt}`).join("\n")}

## Resultat

${markdownTabel(svar.kolonner, svar.raekker)}

## SQL der blev kørt

\`\`\`sql
${svar.sql}
\`\`\`

---

${kilde}
Kilde: \`data/finanskube-2025.sqlite\`, et syntetisk udtræk fra Finanskuben.
Tal, kreditorer og navne er opdigtede. Beløb er ekskl. moms.
`;
}

/** Finder et ledigt filnavn, så en gentaget rapport ikke overskriver den forrige. */
async function ledigtFilnavn(basis: string): Promise<string> {
  for (let n = 0; n < 100; n++) {
    const filnavn = n === 0 ? `${basis}.md` : `${basis}-${n + 1}.md`;
    if (!(await Bun.file(join(RAPPORTMAPPE, filnavn)).exists())) return filnavn;
  }
  return `${basis}-${Date.now()}.md`;
}

export async function gemRapport(svar: Svar): Promise<{ filnavn: string; sti: string }> {
  await mkdir(RAPPORTMAPPE, { recursive: true });

  const filnavn = await ledigtFilnavn(`${idag()}-${slug(svar.spoergsmaal)}`);
  const sti = join(RAPPORTMAPPE, filnavn);

  await Bun.write(sti, byggRapport(svar));

  return { filnavn, sti: `rapporter/${filnavn}` };
}
