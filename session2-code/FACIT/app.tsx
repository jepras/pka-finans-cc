import * as React from "react";
import { createRoot } from "react-dom/client";
import { Badge } from "@/components/ui/badge";
import { Dashboard } from "@/components/Dashboard";
import { SpoergPanel } from "@/components/SpoergPanel";
import type { DashboardData } from "@/lib/typer";

function Header({ tilstand }: { tilstand?: DashboardData["tilstand"] }) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="text-2xl font-semibold text-bordeaux">Spørg dine tal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          PKA A/S, omkostningsbase 2025, syntetiske data
        </p>
      </div>
      {tilstand && (
        <div className="text-right">
          <Badge variant={tilstand === "claude" ? "default" : "secondary"}>
            {tilstand === "claude" ? "Claude" : "Mock"}
          </Badge>
          <p className="mt-1 text-xs text-muted-foreground">
            {tilstand === "claude" ? "claude-sonnet-5" : "Kanoniske svar, ingen API-nøgle"}
          </p>
        </div>
      )}
    </header>
  );
}

function App() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [fejl, setFejl] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e) => setFejl(String(e)));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Header tilstand={data?.tilstand} />
      {fejl && (
        <p className="rounded-lg border border-border bg-powder/20 px-4 py-3 text-sm">
          Kunne ikke hente dashboardet: {fejl}
        </p>
      )}
      {!fejl && !data && <p className="text-sm text-muted-foreground">Henter tal.</p>}
      {data && (
        <div className="flex flex-col gap-6">
          <Dashboard data={data} />
          <SpoergPanel />
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
