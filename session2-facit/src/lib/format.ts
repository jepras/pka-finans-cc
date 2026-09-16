/** Dansk formatering. Formatering hører kun i visningslaget — aldrig i API-svar. */

const heltal = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 });

const kroner = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  maximumFractionDigits: 0,
});

const kronerMedOerer = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const procent = new Intl.NumberFormat("da-DK", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const enDecimal = new Intl.NumberFormat("da-DK", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 1.234.567 */
export function formatAntal(v: number): string {
  return heltal.format(v);
}

/** 1.234.567 kr. */
export function formatKr(v: number): string {
  return kroner.format(v);
}

/** 1.234.567,89 kr. — kun hvor øre er relevante (afstemning). */
export function formatKrPraecis(v: number): string {
  return kronerMedOerer.format(v);
}

/** 12,3 % — forventer en andel mellem 0 og 1. */
export function formatProcent(andel: number): string {
  return procent.format(andel);
}

/**
 * Kompakt beløb til akser og tætte tabeller: 12,3 mio. kr. / 845 t.kr.
 * Runder aggressivt — brug aldrig til tal, der skal afstemmes.
 */
export function formatKrKompakt(v: number): string {
  const tegn = v < 0 ? "-" : "";
  const abs = Math.abs(v);

  if (abs >= 1_000_000) return `${tegn}${enDecimal.format(abs / 1_000_000)} mio. kr.`;
  if (abs >= 1_000) return `${tegn}${heltal.format(Math.round(abs / 1_000))} t.kr.`;
  return `${tegn}${heltal.format(abs)} kr.`;
}

/** Til grafakser, hvor "kr." ville støje: 12,3 mio. / 845 t. */
export function formatAkse(v: number): string {
  const tegn = v < 0 ? "-" : "";
  const abs = Math.abs(v);

  if (abs >= 1_000_000) return `${tegn}${enDecimal.format(abs / 1_000_000)} mio.`;
  if (abs >= 1_000) return `${tegn}${heltal.format(Math.round(abs / 1_000))} t.`;
  return `${tegn}${heltal.format(abs)}`;
}

const toDecimaler = new Intl.NumberFormat("da-DK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Beløbskolonner i frie forespørgsler hedder typisk beloeb, moms eller ..._kr. */
function erBeloeb(kolonne: string): boolean {
  return /(beloeb|belob|beløb|moms|_kr\b|\bkr\b|omkostning)/i.test(kolonne);
}

function erProcent(kolonne: string): boolean {
  return /(pct|procent|andel)/i.test(kolonne);
}

/**
 * Formaterer en celle i et frit resultatsæt. Kolonnenavnet afgør enheden —
 * derfor beder vi modellen om læsbare aliasser som beloeb og pct_formueforvaltning.
 */
export function formatVaerdi(kolonne: string, vaerdi: string | number | null): string {
  if (vaerdi === null || vaerdi === undefined) return "—";
  if (typeof vaerdi === "string") return vaerdi;
  if (!Number.isFinite(vaerdi)) return String(vaerdi);

  if (erBeloeb(kolonne)) return formatKr(vaerdi);
  // Andel som brøk (0-1) vises som procent; en kolonne der allerede er i procent vises som tal.
  if (erProcent(kolonne)) {
    return Math.abs(vaerdi) <= 1 ? formatProcent(vaerdi) : `${enDecimal.format(vaerdi)} %`;
  }
  if (Number.isInteger(vaerdi)) return heltal.format(vaerdi);
  return toDecimaler.format(vaerdi);
}

/** 2025-03 -> marts 2025 */
export function formatPeriode(periode: string): string {
  const [aar, maaned] = periode.split("-");
  if (!aar || !maaned) return periode;

  const navne = [
    "januar",
    "februar",
    "marts",
    "april",
    "maj",
    "juni",
    "juli",
    "august",
    "september",
    "oktober",
    "november",
    "december",
  ];
  const navn = navne[Number(maaned) - 1];
  return navn ? `${navn} ${aar}` : periode;
}
