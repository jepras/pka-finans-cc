// Ét spørgsmål ind, én kørt SQL ud. Modellen skriver SQL'en, serveren afgør om den må køre.
import { query } from "./db";
import { erLaesning, spoerg } from "./provider";
import type { AskFejl, AskSvar, Raekke } from "@/lib/typer";

// Panelet skal kunne læses på skærmen. Flere rækker end det peger på et andet spørgsmål.
const MAKS_RAEKKER = 200;

export async function besvar(spoergsmaal: string): Promise<
  { status: number; krop: AskSvar | AskFejl }
> {
  const tekst = spoergsmaal.trim();
  if (!tekst) {
    return { status: 400, krop: { fejl: "Skriv et spørgsmål først." } };
  }

  let svar;
  try {
    svar = await spoerg(tekst);
  } catch (fejl) {
    console.error("Modellen fejlede:", fejl);
    return {
      status: 502,
      krop: { fejl: `Modellen svarede ikke: ${beskriv(fejl)}` },
    };
  }

  // Sidste kontrol før databasen. Kun SELECT og WITH slipper igennem.
  if (!erLaesning(svar.sql)) {
    return {
      status: 422,
      krop: {
        fejl: "SQL'en blev afvist. Serveren kører kun forespørgsler, der starter med SELECT eller WITH, og som ikke skriver til databasen.",
        ...svar,
      },
    };
  }

  let raekker: Raekke[];
  try {
    raekker = query<Raekke>(svar.sql);
  } catch (fejl) {
    return {
      status: 422,
      krop: { fejl: `SQL'en kunne ikke køre: ${beskriv(fejl)}`, ...svar },
    };
  }

  return {
    status: 200,
    krop: {
      ...svar,
      raekker: raekker.slice(0, MAKS_RAEKKER),
      afkortet: raekker.length > MAKS_RAEKKER,
    },
  };
}

const beskriv = (fejl: unknown) => (fejl instanceof Error ? fejl.message : String(fejl));
