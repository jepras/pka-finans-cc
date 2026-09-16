// Ét sted at spørge modellen. Med ANTHROPIC_API_KEY bruges Claude, uden bruges mock.ts.
import { readFileSync } from "node:fs";
import { z } from "zod";
import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { findKanonisk } from "./mock";

export const SvarSkema = z.object({
  titel: z.string(),
  sql: z.string(),
  forklaring: z.string(),
  graftype: z.enum(["soejle", "linje", "ingen"]),
});
export type Svar = z.infer<typeof SvarSkema>;

const rod = new URL("..", import.meta.url).pathname;
const noegle = process.env.ANTHROPIC_API_KEY?.trim();

export const tilstand: "claude" | "mock" = noegle ? "claude" : "mock";

const systemprompt = () =>
  readFileSync(`${rod}server/prompts/system.md`, "utf8")
    .replace("{{DATAMODEL}}", readFileSync(`${rod}data/DATAMODEL.md`, "utf8"));

export async function spoerg(spoergsmaal: string): Promise<Svar> {
  if (!noegle) return findKanonisk(spoergsmaal);
  const anthropic = createAnthropic({ apiKey: noegle });
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: SvarSkema,
    system: systemprompt(),
    prompt: spoergsmaal,
  });
  return object;
}

// Kun læsning. Alt andet afvises, før det når databasen.
export function erLaesning(sql: string): boolean {
  const s = sql.trim().replace(/;+\s*$/, "").toUpperCase();
  if (!(s.startsWith("SELECT") || s.startsWith("WITH"))) return false;
  return !/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|PRAGMA|REPLACE|VACUUM)\b/.test(s);
}
