import { Building2, Table2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { KontogruppeGraf } from "./components/KontogruppeGraf.tsx";
import { KreditorTabel } from "./components/KreditorTabel.tsx";
import { Noegletal } from "./components/Noegletal.tsx";
import { SkemaPanel } from "./components/SkemaPanel.tsx";
import { SpoergPanel } from "./components/SpoergPanel.tsx";
import { Badge } from "./components/ui/badge.tsx";
import { Button } from "./components/ui/button.tsx";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Skeleton } from "./components/ui/skeleton.tsx";
import { formatPeriode } from "./lib/format.ts";
import type { DashboardData, Svar } from "./types.ts";

type Tilstand =
  | { status: "henter" }
  | { status: "klar"; data: DashboardData }
  | { status: "fejl"; besked: string };

function Indlaeser() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[520px]" />
      <Skeleton className="h-96" />
    </div>
  );
}

function Fejl({ besked }: { besked: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-5">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-pka-roed" aria-hidden />
        <div>
          <div className="font-semibold text-pka-bordeaux">Kunne ikke hente data</div>
          <p className="mt-1 text-sm text-muted-foreground">{besked}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function App() {
  const [tilstand, setTilstand] = useState<Tilstand>({ status: "henter" });
  const [skemaAabent, setSkemaAabent] = useState(false);
  const [sidsteSvar, setSidsteSvar] = useState<Svar | null>(null);

  useEffect(() => {
    const afbryd = new AbortController();

    fetch("/api/dashboard", { signal: afbryd.signal })
      .then(async (svar) => {
        if (!svar.ok) throw new Error(`Serveren svarede ${svar.status}`);
        return (await svar.json()) as DashboardData;
      })
      .then((data) => setTilstand({ status: "klar", data }))
      .catch((fejl: unknown) => {
        if (afbryd.signal.aborted) return;
        setTilstand({
          status: "fejl",
          besked: fejl instanceof Error ? fejl.message : "Ukendt fejl",
        });
      });

    return () => afbryd.abort();
  }, []);

  const periode =
    tilstand.status === "klar"
      ? `${formatPeriode(tilstand.data.periode.foerste)} – ${formatPeriode(
          tilstand.data.periode.sidste,
        )}`
      : "Kalenderåret 2025";

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-pka-roed text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-7 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <Building2 className="mt-1 size-7 shrink-0" aria-hidden />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">PKA A/S — omkostningsbase</h1>
              <p className="mt-1 text-sm text-white/80">
                Udtræk fra Finanskuben, {periode}. Alle beløb er ekskl. moms.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="sekundaer"
              size="sm"
              onClick={() => setSkemaAabent(true)}
              aria-haspopup="dialog"
            >
              <Table2 className="size-4" aria-hidden />
              Se data
            </Button>
            <Badge variant="aktiv" className="w-fit">
              Syntetiske data
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8">
        {tilstand.status === "henter" && <Indlaeser />}
        {tilstand.status === "fejl" && <Fejl besked={tilstand.besked} />}
        {tilstand.status === "klar" && (
          <>
            <Noegletal tal={tilstand.data.noegletal} />
            <KontogruppeGraf data={tilstand.data.kontogrupperPrKvartal} />
            <KreditorTabel kreditorer={tilstand.data.topKreditorer} />
          </>
        )}

        {/* Spørg-panelet henter selv sin status og virker også, hvis dashboardet fejler. */}
        <SpoergPanel onSvar={setSidsteSvar} />
      </main>

      <SkemaPanel
        aaben={skemaAabent}
        onLuk={() => setSkemaAabent(false)}
        sql={sidsteSvar?.sql ?? null}
      />

      <footer className="mx-auto max-w-[1400px] px-6 pb-10 text-xs text-muted-foreground">
        Tal, kreditorer og navne i datasættet er opdigtede. Databasen læses read-only.
      </footer>
    </div>
  );
}
