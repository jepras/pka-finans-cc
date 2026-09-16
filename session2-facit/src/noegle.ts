/**
 * API-nøglen kan sættes fra appen, så man ikke skal redigere .env og genstarte serveren.
 *
 * Nøglen holdes i hukommelsen og er den, ai.ts bygger sin Claude-klient af ved hvert
 * kald. Den skrives også til .env, så den gælder efter næste opstart. Nøglen sendes
 * aldrig tilbage til browseren — kun de sidste fire tegn, så man kan se hvilken der står.
 *
 * Feltet i appen er til en lokal workshop-app på egen maskine. Serveren skal ikke
 * eksponeres på et netværk, for den, der kan nå /api/noegle, kan skrive i .env.
 */

import { join } from "node:path";

const NAVN = "ANTHROPIC_API_KEY";
const ENV_FIL = join(import.meta.dir, "..", ".env");

/** Mindste længde vi accepterer. Fanger en halv indsættelse frem for at ramme præcist. */
const MINDSTE_LAENGDE = 20;

let noegle: string | null = process.env[NAVN]?.trim() || null;

export function harNoegle(): boolean {
  return noegle !== null;
}

export function hentNoegle(): string | null {
  return noegle;
}

/** Fx "sk-ant-…f4a9". Null når der ikke er nogen nøgle. */
export function maskeretNoegle(): string | null {
  return noegle ? `sk-ant-…${noegle.slice(-4)}` : null;
}

export type NoegleTjek = { ok: true; noegle: string } | { ok: false; grund: string };

export function tjekNoegle(raa: unknown): NoegleTjek {
  if (typeof raa !== "string") return { ok: false, grund: "Feltet noegle mangler." };

  const rent = raa.trim();
  if (!rent) return { ok: false, grund: "Skriv en nøgle først." };
  if (/\s/.test(rent)) {
    return { ok: false, grund: "Nøglen må ikke indeholde mellemrum eller linjeskift." };
  }
  if (!rent.startsWith("sk-ant-")) {
    return { ok: false, grund: "Nøglen ser ikke ud som en Anthropic-nøgle. Den skal begynde med sk-ant-." };
  }
  if (rent.length < MINDSTE_LAENGDE) {
    return { ok: false, grund: "Nøglen er for kort. Kontrollér, at hele nøglen blev indsat." };
  }

  return { ok: true, noegle: rent };
}

/** Erstatter linjen med nøglen, eller tilføjer den, og lader resten af filen stå. */
function medNoegle(nuvaerende: string, vaerdi: string): string {
  const linje = `${NAVN}=${vaerdi}`;
  const findes = new RegExp(`^${NAVN}=.*$`, "m");

  if (findes.test(nuvaerende)) return nuvaerende.replace(findes, linje);
  if (!nuvaerende.trim()) return `${linje}\n`;
  return `${nuvaerende.replace(/\n*$/, "")}\n${linje}\n`;
}

/**
 * Tager nøglen i brug med det samme og skriver den til .env bagefter. Skrivningen
 * kan fejle uden at nøglen bliver ubrugelig, så det meldes som en advarsel frem for
 * en fejl — appen kører videre med Claude, nøglen holder blot ikke en genstart.
 */
export async function saetNoegle(vaerdi: string): Promise<{ advarsel?: string }> {
  noegle = vaerdi;
  process.env[NAVN] = vaerdi;

  try {
    const fil = Bun.file(ENV_FIL);
    const nuvaerende = (await fil.exists()) ? await fil.text() : "";
    await Bun.write(ENV_FIL, medNoegle(nuvaerende, vaerdi));
    return {};
  } catch (fejl) {
    return {
      advarsel:
        `Nøglen er taget i brug nu, men kunne ikke skrives til .env: ${(fejl as Error).message}. ` +
        "Den gælder kun indtil serveren genstartes.",
    };
  }
}
