/** Samler spørgsmål → SQL → kørsel → svar. Serveren holder sig til HTTP. */

import { harClaude, MODEL_ID, spoergClaude } from "./ai.ts";
import { koerLaesning, type LaesningResultat } from "./db.ts";
import { vaelgEksempelsvar } from "./eksempelsvar.ts";
import type { GrafSpec, Kilde, SpoergFejl, Status, Svar } from "./types.ts";

export function status(): Status {
  return harClaude()
    ? {
        kilde: "claude",
        model: MODEL_ID,
        begrundelse: "ANTHROPIC_API_KEY er sat — frie spørgsmål oversættes til SQL af Claude.",
      }
    : {
        kilde: "eksempelsvar",
        model: null,
        begrundelse:
          "Ingen ANTHROPIC_API_KEY i .env — appen svarer fra et fast sæt eksempler. " +
          "SQL'en køres stadig mod databasen, så tallene er rigtige.",
      };
}

/**
 * En graf er kun brugbar, hvis dens kolonner findes i resultatet, og der er mere
 * end én række at tegne. Ellers droppes den frem for at rendere en tom akse.
 */
function gyldigGraf(graf: GrafSpec | null, kolonner: string[], antalRaekker: number): GrafSpec | null {
  if (!graf || antalRaekker < 2) return null;

  const kendte = new Set(kolonner);
  if (!kendte.has(graf.xNoegle)) return null;

  const serier = graf.serier.filter((s) => kendte.has(s.noegle));
  return serier.length ? { ...graf, serier } : null;
}

function byg(
  spoergsmaal: string,
  kilde: Kilde,
  sql: string,
  forklaring: string,
  forbehold: string[],
  graf: GrafSpec | null,
  resultat: Extract<LaesningResultat, { ok: true }>,
): Svar {
  return {
    spoergsmaal,
    kilde,
    sql,
    forklaring,
    forbehold: resultat.afkortet
      ? [...forbehold, `Kun de første ${resultat.raekker.length} rækker vises.`]
      : forbehold,
    kolonner: resultat.kolonner,
    raekker: resultat.raekker,
    afkortet: resultat.afkortet,
    graf: gyldigGraf(graf, resultat.kolonner, resultat.raekker.length),
  };
}

export async function besvar(spoergsmaal: string): Promise<Svar | SpoergFejl> {
  const tekst = spoergsmaal.trim();
  if (!tekst) return { fejl: "Skriv et spørgsmål først." };

  if (!harClaude()) {
    const eksempel = vaelgEksempelsvar(tekst);
    const resultat = koerLaesning(eksempel.sql);
    if (!resultat.ok) return { fejl: resultat.grund, sql: eksempel.sql };

    return byg(
      tekst,
      "eksempelsvar",
      eksempel.sql,
      eksempel.forklaring,
      eksempel.forbehold,
      eksempel.graf,
      resultat,
    );
  }

  let tidligereFejl: { sql: string; grund: string } | undefined;

  // To forsøg: første gang frit, anden gang med afvisningen som rettelse.
  for (let forsoeg = 0; forsoeg < 2; forsoeg++) {
    let svar;
    try {
      svar = await spoergClaude(tekst, tidligereFejl);
    } catch (fejl) {
      return { fejl: `Claude svarede ikke: ${(fejl as Error).message}` };
    }

    const resultat = koerLaesning(svar.sql);
    if (resultat.ok) {
      return byg(tekst, "claude", svar.sql, svar.forklaring, svar.forbehold, svar.graf, resultat);
    }

    tidligereFejl = { sql: svar.sql, grund: resultat.grund };
  }

  return {
    fejl: `SQL'en kunne ikke køres efter to forsøg. ${tidligereFejl?.grund ?? ""}`.trim(),
    sql: tidligereFejl?.sql,
  };
}
