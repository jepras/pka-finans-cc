/** Farver. Kun grafarverne bruges til dataserier — aldrig PKA-rød/bordeaux/rubin. */

export const GRAF_FARVER = [
  "#6E9BAA",
  "#9EDFCE",
  "#C5AED5",
  "#EFC47C",
  "#E88F80",
  "#85B499",
] as const;

export const PKA = {
  roed: "#92004D",
  bordeaux: "#660036",
  rubin: "#CE0060",
} as const;

/**
 * Fast rækkefølge af kontogrupperne fra kontoplanen, så en kontogruppe altid
 * får samme farve på tværs af genindlæsninger og komponenter.
 */
export const KONTOGRUPPE_RAEKKEFOELGE = [
  "Personale",
  "IT og licenser",
  "Lokaler",
  "Eksterne rådgivere",
  "Depot og forvaltning",
  "Øvrig administration",
] as const;

/** Farve til en kontogruppe. Ukendte grupper falder tilbage på listens orden. */
export function farveTilKontogruppe(kontogruppe: string, fallbackIndeks = 0): string {
  const i = KONTOGRUPPE_RAEKKEFOELGE.indexOf(
    kontogruppe as (typeof KONTOGRUPPE_RAEKKEFOELGE)[number],
  );
  const indeks = i >= 0 ? i : fallbackIndeks;
  return GRAF_FARVER[indeks % GRAF_FARVER.length] as string;
}

/** Sorterer kontogrupper i kontoplanens rækkefølge; ukendte lægges til sidst. */
export function sorterKontogrupper(kontogrupper: string[]): string[] {
  const orden = new Map<string, number>(
    KONTOGRUPPE_RAEKKEFOELGE.map((navn, i) => [navn as string, i]),
  );
  return [...kontogrupper].sort(
    (a, b) => (orden.get(a) ?? Number.MAX_SAFE_INTEGER) - (orden.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}
