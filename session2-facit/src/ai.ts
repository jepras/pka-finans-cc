/**
 * Oversætter et dansk spørgsmål til SQL med Claude via Vercel AI SDK.
 *
 * Modellen får databasens faktiske DDL med, så den ikke kan finde på kolonner.
 * Den SQL, modellen returnerer, går altid gennem sql-vagten før den røres ved
 * databasen — prompten er en instruktion, ikke en sikkerhedsgrænse.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

import { skemaDDL } from "./db.ts";
import { RAEKKEGRAENSE, TILLADTE_TABELLER } from "./sql-vagt.ts";
import type { GrafSpec } from "./types.ts";

export const MODEL_ID = "claude-sonnet-5";

export function harClaude(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

const grafSkema = z
  .object({
    type: z.enum(["soejle", "linje"]).describe("soejle til kategorier, linje til tidsserier"),
    xNoegle: z.string().describe("Kolonnenavn på x-aksen, skal findes i SELECT'en"),
    serier: z
      .array(
        z.object({
          noegle: z.string().describe("Kolonnenavn med tal, skal findes i SELECT'en"),
          navn: z.string().describe("Dansk label til forklaringsboksen"),
        }),
      )
      .min(1)
      .max(4),
  })
  .nullable()
  .describe("null når resultatet ikke egner sig til en graf, fx en enkelt række");

const svarSkema = z.object({
  sql: z.string().describe("Én SELECT-sætning til SQLite, uden afsluttende semikolon"),
  forklaring: z
    .string()
    .describe("2-4 sætninger på almindeligt dansk om hvad forespørgslen gør. Ingen SQL-jargon."),
  forbehold: z
    .array(z.string())
    .min(2)
    .max(6)
    .describe("Hvad forespørgslen IKKE tager højde for. Konkret, ikke generelle forbehold."),
  graf: grafSkema,
});

export type ClaudeSvar = {
  sql: string;
  forklaring: string;
  forbehold: string[];
  graf: GrafSpec | null;
};

function systemPrompt(): string {
  return [
    "Du er analytiker på et dansk pensionsselskab, PKA A/S, og oversætter spørgsmål til SQLite-SQL",
    "mod et udtræk fra Finanskuben for kalenderåret 2025.",
    "",
    "Databasens skema:",
    "",
    skemaDDL(),
    "",
    "Regler for SQL:",
    `- Kun én SELECT- eller WITH-sætning. Ingen INSERT, UPDATE, DELETE, PRAGMA, ATTACH eller lignende — basen er read-only.`,
    `- Brug kun tabellerne: ${TILLADTE_TABELLER.join(", ")}.`,
    "- beloeb er ekskl. moms og er det, omkostningsbasen regnes på. Læg aldrig moms til med mindre der spørges om det.",
    "- kvartal er 'Q1'-'Q4'. periode er 'ÅÅÅÅ-MM'. Filtrér på disse kolonner frem for at regne på bogfoeringsdato.",
    "- Kontogrupper: Personale, IT og licenser, Lokaler, Eksterne rådgivere, Depot og forvaltning, Øvrig administration.",
    "- Fordeling på forretningsområder sker ved at gange beloeb med fordelingsnoegle-andelene.",
    "- Giv kolonnerne læsbare danske aliasser i snake_case, fx kreditor, beloeb, posteringer.",
    `- Sortér meningsfuldt og sæt LIMIT hvor det giver mening. Over ${RAEKKEGRAENSE} rækker bliver afkortet.`,
    "",
    "Regler for forklaringen:",
    "- Skriv til en controller, der ikke læser SQL. Beskriv hvad der tælles med og hvordan der grupperes.",
    "- Forbehold skal være konkrete for netop denne forespørgsel: hvilke konti eller grupper der falder udenfor,",
    "  hvor afgrænsningen er skarp, hvad der mangler som række frem for at stå med nul, hvad et JOIN smider væk.",
    "- Skriv aldrig at datasættet er syntetisk som forbehold — det ved brugeren.",
    "- Alt på dansk. Ingen emojis.",
  ].join("\n");
}

/**
 * Spørger Claude. `tidligereFejl` sendes med ved andet forsøg, så modellen kan
 * rette en forespørgsel, der blev afvist af vagten eller fejlede i SQLite.
 */
export async function spoergClaude(
  spoergsmaal: string,
  tidligereFejl?: { sql: string; grund: string },
): Promise<ClaudeSvar> {
  const prompt = tidligereFejl
    ? [
        `Spørgsmål: ${spoergsmaal}`,
        "",
        "Dit forrige forsøg blev afvist:",
        tidligereFejl.sql,
        "",
        `Årsag: ${tidligereFejl.grund}`,
        "",
        "Ret forespørgslen, så den overholder reglerne.",
      ].join("\n")
    : `Spørgsmål: ${spoergsmaal}`;

  const { object } = await generateObject({
    model: anthropic(MODEL_ID),
    schema: svarSkema,
    system: systemPrompt(),
    prompt,
    temperature: 0,
  });

  return object as ClaudeSvar;
}
