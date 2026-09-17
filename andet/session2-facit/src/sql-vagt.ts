/**
 * Vagt for SQL, der kommer udefra (fra Claude eller fra eksempelsvarene).
 *
 * Databasen er allerede åbnet read-only, så en skrivning ville fejle i SQLite.
 * Vagten er laget ovenpå: den afviser alt andet end én enkelt SELECT/WITH mod
 * de kendte tabeller, så vi fejler med en forklaring i stedet for en SQLite-fejl,
 * og så ATTACH/PRAGMA aldrig når frem til databasen.
 */

export const TILLADTE_TABELLER = [
  "transaktioner",
  "kontoplan",
  "kreditorer",
  "omkostningssteder",
  "fordelingsnoegle",
  "kontroltotaler",
] as const;

/** Maksimalt antal rækker vi sender til browseren. */
export const RAEKKEGRAENSE = 500;

const FORBUDTE_ORD = [
  "insert",
  "update",
  "delete",
  "drop",
  "alter",
  "create",
  "replace",
  "truncate",
  "attach",
  "detach",
  "pragma",
  "vacuum",
  "reindex",
  "analyze",
  "begin",
  "commit",
  "rollback",
  "savepoint",
  "grant",
  "revoke",
  "load_extension",
  "writefile",
  "readfile",
];

export type VagtSvar = { ok: true; sql: string } | { ok: false; grund: string };

/**
 * Fjerner kommentarer og indholdet af strengliteraler, så nøgleordstjek ikke
 * falder over en posteringstekst som 'Opdatering af licens'. Literaler erstattes
 * af '' i stedet for at blive slettet, så sætningens struktur består.
 */
function udenStrengeOgKommentarer(sql: string): string {
  let ud = "";
  let i = 0;

  while (i < sql.length) {
    const tegn = sql[i]!;
    const naeste = sql[i + 1];

    if (tegn === "'" || tegn === '"') {
      const slut = tegn;
      i++;
      while (i < sql.length) {
        if (sql[i] === slut) {
          // '' og "" er en escapet citationstegn inde i literalen.
          if (sql[i + 1] === slut) i += 2;
          else break;
        } else i++;
      }
      i++;
      ud += slut + slut;
      continue;
    }

    if (tegn === "-" && naeste === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
      ud += " ";
      continue;
    }

    if (tegn === "/" && naeste === "*") {
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i += 2;
      ud += " ";
      continue;
    }

    ud += tegn;
    i++;
  }

  return ud;
}

/** Navne defineret i en WITH-blok er lovlige kilder på linje med tabellerne. */
function cteNavne(renset: string): string[] {
  if (!/^\s*with\b/i.test(renset)) return [];
  return [...renset.matchAll(/(?:^\s*with\s+(?:recursive\s+)?|,\s*)([a-z_][a-z0-9_]*)\s+as\s*\(/gi)]
    .map((m) => m[1]?.toLowerCase())
    .filter((n): n is string => Boolean(n));
}

/**
 * Hvilke af de kendte tabeller læser SQL'en fra? Bruges til at fremhæve dem i
 * "Se data" — ikke til sikkerhed, den del er godkendLaesning.
 */
export function tabellerISql(sql: string, kendte: readonly string[]): string[] {
  const renset = udenStrengeOgKommentarer(sql);
  const efterNavn = new Map(kendte.map((navn) => [navn.toLowerCase(), navn]));
  const brugte = new Set<string>();

  for (const m of renset.matchAll(/\b(?:from|join)\s+([^\s(,;]+)/gi)) {
    const kilde = m[1]!.replace(/["'`\[\]]/g, "").toLowerCase();
    const navn = efterNavn.get(kilde);
    if (navn) brugte.add(navn);
  }

  return [...brugte];
}

export function godkendLaesning(raa: string): VagtSvar {
  const sql = raa.trim().replace(/;\s*$/, "").trim();
  if (!sql) return { ok: false, grund: "Tom forespørgsel." };

  const renset = udenStrengeOgKommentarer(sql);

  if (renset.includes(";")) {
    return { ok: false, grund: "Kun én sætning ad gangen — flere sætninger er ikke tilladt." };
  }

  if (!/^\s*(select|with)\b/i.test(renset)) {
    return { ok: false, grund: "Kun SELECT og WITH må køres." };
  }

  for (const ord of FORBUDTE_ORD) {
    if (new RegExp(`\\b${ord}\\b`, "i").test(renset)) {
      return { ok: false, grund: `Nøgleordet "${ord.toUpperCase()}" er ikke tilladt.` };
    }
  }

  const lovlige = new Set<string>([...TILLADTE_TABELLER, ...cteNavne(renset)]);

  for (const m of renset.matchAll(/\b(?:from|join)\s+([^\s(,;]+)/gi)) {
    const kilde = m[1]!.replace(/["'`\[\]]/g, "").toLowerCase();
    // En underforespørgsel starter med '(' og fanges ikke af mønstret ovenfor.
    if (!lovlige.has(kilde)) {
      return {
        ok: false,
        grund: `Ukendt tabel "${kilde}". Tilladte tabeller: ${TILLADTE_TABELLER.join(", ")}.`,
      };
    }
  }

  return { ok: true, sql };
}
