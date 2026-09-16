// Bun.serve serverer index.html som route og bundler React og TSX selv.
// Kør: bun run dev
import index from "./index.html";
import { hentDashboard } from "./server/dashboard";
import { besvar } from "./server/ask";
import { gemRapport, type RapportOenske } from "./server/rapport";

const port = Number(process.env.PORT ?? 3000);

const server = Bun.serve({
  port,
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/": index,
    "/api/dashboard": {
      GET: () => {
        try {
          return Response.json(hentDashboard());
        } catch (fejl) {
          console.error("Dashboard fejlede:", fejl);
          return Response.json({ fejl: String(fejl) }, { status: 500 });
        }
      },
    },
    "/api/ask": {
      POST: async (req) => {
        let spoergsmaal = "";
        try {
          ({ spoergsmaal } = (await req.json()) as { spoergsmaal?: string });
        } catch {
          return Response.json({ fejl: "Forventede JSON med feltet spoergsmaal." }, { status: 400 });
        }
        const { status, krop } = await besvar(spoergsmaal ?? "");
        return Response.json(krop, { status });
      },
    },
    "/api/rapport": {
      POST: async (req) => {
        let oenske: RapportOenske;
        try {
          oenske = (await req.json()) as RapportOenske;
        } catch {
          return Response.json({ fejl: "Forventede JSON med svaret, der skal gemmes." }, { status: 400 });
        }
        try {
          const { status, krop } = gemRapport(oenske);
          return Response.json(krop, { status });
        } catch (fejl) {
          console.error("Rapporten kunne ikke gemmes:", fejl);
          return Response.json({ fejl: `Kunne ikke skrive filerne: ${String(fejl)}` }, { status: 500 });
        }
      },
    },
  },
});

console.log(`Spørg dine tal kører på ${server.url}`);
