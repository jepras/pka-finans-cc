// Tallene bag dashboardet. Alt læses fra transaktioner_renset, aldrig fra transaktioner.
import { query } from "./db";
import { tilstand } from "./provider";
import type { DashboardData, KvartalRaekke } from "@/lib/typer";

// Rækkefølgen styrer både stablingen i grafen og farveopslaget i UI'et.
export const KONTOGRUPPER = [
  "Personale",
  "Eksterne rådgivere",
  "Depot og forvaltning",
  "IT og licenser",
  "Øvrig administration",
  "Lokaler",
] as const;

export function hentDashboard(): DashboardData {
  const [total] = query<{ beloeb: number; antalBilag: number }>(`
    SELECT ROUND(SUM(beloeb)) AS beloeb, COUNT(DISTINCT bilagsnr) AS antalBilag
    FROM transaktioner_renset
  `);

  const grupper = query<{ navn: string; beloeb: number }>(`
    SELECT k.kontogruppe AS navn, ROUND(SUM(t.beloeb)) AS beloeb
    FROM transaktioner_renset t
    JOIN kontoplan k ON k.kontonr = t.kontonr
    GROUP BY k.kontogruppe
    ORDER BY beloeb DESC
  `);

  // LEFT JOIN med vilje. Omkostningssted 700 mangler i fordelingsnoegle, og et indre
  // join ville tabe godt 10 procent af omkostningsbasen uden at sige det.
  const [ff] = query<{ beloeb: number; andel: number; daekning: number }>(`
    SELECT
      ROUND(SUM(t.beloeb * COALESCE(f.andel_formueforvaltning, 0))) AS beloeb,
      ROUND(100.0 * SUM(t.beloeb * COALESCE(f.andel_formueforvaltning, 0)) / SUM(t.beloeb), 1) AS andel,
      ROUND(100.0 * SUM(CASE WHEN f.omkostningssted IS NOT NULL THEN t.beloeb ELSE 0 END) / SUM(t.beloeb), 1) AS daekning
    FROM transaktioner_renset t
    LEFT JOIN fordelingsnoegle f ON f.omkostningssted = t.omkostningssted
  `);

  const pr_kvartal = query<{ kvartal: string; kontogruppe: string; beloeb: number }>(`
    SELECT t.kvartal, k.kontogruppe, ROUND(SUM(t.beloeb)) AS beloeb
    FROM transaktioner_renset t
    JOIN kontoplan k ON k.kontonr = t.kontonr
    GROUP BY t.kvartal, k.kontogruppe
    ORDER BY t.kvartal
  `);

  // Grupperet på kreditornavn, ikke kreditornr. Så kan man se, at samme leverandør
  // optræder med to stavemåder i udtrækket.
  const kreditorer = query<{ kreditornavn: string; beloeb: number; antal: number }>(`
    SELECT kr.kreditornavn, ROUND(SUM(t.beloeb)) AS beloeb, COUNT(*) AS antal
    FROM transaktioner_renset t
    JOIN kreditorer kr ON kr.kreditornr = t.kreditornr
    GROUP BY kr.kreditornavn
    ORDER BY beloeb DESC
    LIMIT 10
  `);

  const samletBeloeb = total?.beloeb ?? 0;
  const stoerste = grupper[0] ?? { navn: "ingen data", beloeb: 0 };

  return {
    tilstand,
    kpi: {
      samletBeloeb,
      antalBilag: total?.antalBilag ?? 0,
      stoersteKontogruppe: {
        navn: stoerste.navn,
        beloeb: stoerste.beloeb,
        andel: andelAf(stoerste.beloeb, samletBeloeb),
      },
      formueforvaltning: {
        beloeb: ff?.beloeb ?? 0,
        andel: ff?.andel ?? 0,
        daekning: ff?.daekning ?? 0,
      },
    },
    kontogrupper: [...KONTOGRUPPER],
    kvartaler: pivoter(pr_kvartal),
    kreditorer: kreditorer.map((k) => ({ ...k, andel: andelAf(k.beloeb, samletBeloeb) })),
  };
}

function andelAf(del: number, helhed: number) {
  return helhed ? Math.round((1000 * del) / helhed) / 10 : 0;
}

// Én række pr. kvartal med en nøgle pr. kontogruppe, så Recharts kan stable direkte.
function pivoter(rows: { kvartal: string; kontogruppe: string; beloeb: number }[]): KvartalRaekke[] {
  const kvartaler = new Map<string, KvartalRaekke>();
  for (const r of rows) {
    let raekke = kvartaler.get(r.kvartal);
    if (!raekke) {
      raekke = { kvartal: r.kvartal };
      for (const g of KONTOGRUPPER) raekke[g] = 0;
      kvartaler.set(r.kvartal, raekke);
    }
    raekke[r.kontogruppe] = r.beloeb;
  }
  return [...kvartaler.values()].sort((a, b) => a.kvartal.localeCompare(b.kvartal));
}
