import index from "../index.html";
import { hentDashboard, hentSkema, hentTabeludsnit } from "./db.ts";
import { EKSEMPELSVAR } from "./eksempelsvar.ts";
import { erSvar, gemRapport } from "./rapport.ts";
import { besvar, status } from "./spoerg.ts";

const port = Number(process.env.PORT ?? 3000);

const server = Bun.serve({
  port,
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/api/dashboard": {
      GET: () => Response.json(hentDashboard()),
    },

    /** Tabeller, kolonner og sammenhænge, læst af databasen selv. */
    "/api/skema": {
      GET: () => Response.json(hentSkema()),
    },

    /** De første rækker af én tabel til "Se data". */
    "/api/tabel/:navn": {
      GET: (req) => {
        const udsnit = hentTabeludsnit(req.params.navn);
        return udsnit
          ? Response.json(udsnit)
          : Response.json({ fejl: "Tabellen findes ikke i databasen." }, { status: 404 });
      },
    },

    /** Kører appen med Claude eller med eksempelsvar? */
    "/api/status": {
      GET: () => Response.json(status()),
    },

    /** Forslag til panelet — altid eksempelspørgsmålene, også med Claude slået til. */
    "/api/eksempler": {
      GET: () =>
        Response.json(EKSEMPELSVAR.map(({ id, spoergsmaal }) => ({ id, spoergsmaal }))),
    },

    "/api/spoerg": {
      POST: async (req) => {
        let krop: { spoergsmaal?: unknown };
        try {
          krop = await req.json();
        } catch {
          return Response.json({ fejl: "Ugyldig JSON i forespørgslen." }, { status: 400 });
        }

        if (typeof krop.spoergsmaal !== "string") {
          return Response.json({ fejl: "Feltet spoergsmaal mangler." }, { status: 400 });
        }

        const svar = await besvar(krop.spoergsmaal);
        return Response.json(svar, { status: "fejl" in svar ? 400 : 200 });
      },
    },

    /** Gemmer et svar som Markdown i rapporter/ og returnerer filnavnet. */
    "/api/rapport": {
      POST: async (req) => {
        let krop: unknown;
        try {
          krop = await req.json();
        } catch {
          return Response.json({ fejl: "Ugyldig JSON i forespørgslen." }, { status: 400 });
        }

        if (!erSvar(krop)) {
          return Response.json({ fejl: "Kroppen er ikke et gyldigt svar." }, { status: 400 });
        }

        try {
          return Response.json(await gemRapport(krop));
        } catch (fejl) {
          return Response.json(
            { fejl: `Rapporten kunne ikke gemmes: ${(fejl as Error).message}` },
            { status: 500 },
          );
        }
      },
    },

    // Alt andet serveres af den bundlede index.html.
    "/*": index,
  },
  error(fejl) {
    console.error(fejl);
    return Response.json({ fejl: "Uventet serverfejl" }, { status: 500 });
  },
});

const tilstand = status();
console.log(`PKA A/S — Omkostningsbase 2025 kører på ${server.url}`);
console.log(
  tilstand.kilde === "claude"
    ? `Spørg-panel: Claude (${tilstand.model})`
    : "Spørg-panel: eksempelsvar — sæt ANTHROPIC_API_KEY i .env for frie spørgsmål",
);
