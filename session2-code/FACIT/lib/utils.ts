import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const kr = (v: number) =>
  v.toLocaleString("da-DK", { maximumFractionDigits: 0 }) + " kr.";

export const tal = (v: number, decimaler = 0) =>
  v.toLocaleString("da-DK", { minimumFractionDigits: decimaler, maximumFractionDigits: decimaler });

// SQL'en fra modellen navngiver selv sine kolonner, så kolonnenavnet afgør,
// om en talkolonne skal vises som kroner eller som et almindeligt tal.
export const erBeloebskolonne = (navn: string) =>
  /beloeb|beløb|bogfoert|kontroltotal|afvigelse|i_alt|forvaltning|administration/i.test(navn);

// Til akser, hvor der ikke er plads til hele beløbet.
export const kortTal = (v: number) =>
  Math.abs(v) >= 1_000_000 ? `${tal(v / 1_000_000, 1)} mio.` : tal(v);
