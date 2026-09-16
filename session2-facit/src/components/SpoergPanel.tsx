import {
  Bot,
  ChartColumn,
  Check,
  Copy,
  CornerDownLeft,
  Database,
  ListChecks,
  MessageSquareText,
  Save,
  Table2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import type { GemtRapport, Status, Svar } from "../types.ts";
import { SvarGraf } from "./SvarGraf.tsx";
import { SvarTabel } from "./SvarTabel.tsx";
import { Badge } from "./ui/badge.tsx";
import { Button } from "./ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card.tsx";
import { Skeleton } from "./ui/skeleton.tsx";
import { Textarea } from "./ui/textarea.tsx";

type Forslag = { id: string; spoergsmaal: string };

function StatusMaerkat({ status }: { status: Status | null }) {
  if (!status) return <Skeleton className="h-6 w-40" />;

  const medClaude = status.kilde === "claude";
  const Ikon = medClaude ? Bot : ListChecks;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={medClaude ? "aktiv" : "kontur"}>
        <Ikon className="size-3.5" aria-hidden />
        {medClaude ? `Claude — ${status.model}` : "Eksempelsvar"}
      </Badge>
      <span className="text-xs text-muted-foreground">{status.begrundelse}</span>
    </div>
  );
}

function Afsnit({
  ikon,
  titel,
  children,
}: {
  ikon: ReactNode;
  titel: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-pka-bordeaux">
        <span className="text-pka-roed">{ikon}</span>
        {titel}
      </h3>
      {children}
    </section>
  );
}

function SqlBoks({ sql }: { sql: string }) {
  const [kopieret, setKopieret] = useState(false);

  useEffect(() => {
    if (!kopieret) return;
    const timer = setTimeout(() => setKopieret(false), 2000);
    return () => clearTimeout(timer);
  }, [kopieret]);

  return (
    <div className="relative">
      <pre className="tal overflow-x-auto rounded-card border border-border bg-muted/60 p-4 text-xs leading-relaxed text-foreground">
        <code>{sql}</code>
      </pre>
      <Button
        variant="sekundaer"
        size="sm"
        className="absolute top-2 right-2"
        onClick={() => {
          void navigator.clipboard.writeText(sql).then(() => setKopieret(true));
        }}
      >
        {kopieret ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {kopieret ? "Kopieret" : "Kopiér"}
      </Button>
    </div>
  );
}

type Gemning =
  | { status: "klar" }
  | { status: "gemmer" }
  | { status: "gemt"; sti: string }
  | { status: "fejl"; besked: string };

function GemRapportKnap({ svar }: { svar: Svar }) {
  const [gemning, setGemning] = useState<Gemning>({ status: "klar" });

  // Et nyt svar skal ikke arve det forrige svars kvittering.
  useEffect(() => setGemning({ status: "klar" }), [svar]);

  async function gem() {
    setGemning({ status: "gemmer" });
    try {
      const respons = await fetch("/api/rapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(svar),
      });
      const krop = (await respons.json()) as GemtRapport | { fejl: string };

      if ("fejl" in krop) setGemning({ status: "fejl", besked: krop.fejl });
      else setGemning({ status: "gemt", sti: krop.sti });
    } catch (e) {
      setGemning({
        status: "fejl",
        besked: e instanceof Error ? e.message : "Ukendt fejl",
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      <Button
        type="button"
        variant="sekundaer"
        size="sm"
        disabled={gemning.status === "gemmer"}
        onClick={() => void gem()}
      >
        <Save className="size-3.5" aria-hidden />
        {gemning.status === "gemmer" ? "Gemmer…" : "Gem som rapport"}
      </Button>

      {gemning.status === "gemt" && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="size-3.5 text-pka-rubin" aria-hidden />
          Gemt som <code className="tal font-medium text-foreground">{gemning.sti}</code>
        </span>
      )}

      {gemning.status === "fejl" && (
        <span className="inline-flex items-center gap-1.5 text-xs text-pka-roed">
          <TriangleAlert className="size-3.5" aria-hidden />
          {gemning.besked}
        </span>
      )}
    </div>
  );
}

function Svarvisning({ svar }: { svar: Svar }) {
  return (
    <div className="flex flex-col gap-7 border-t border-border pt-6">
      <GemRapportKnap svar={svar} />

      <Afsnit ikon={<Database className="size-4" aria-hidden />} titel="SQL der blev kørt">
        <SqlBoks sql={svar.sql} />
      </Afsnit>

      <Afsnit
        ikon={<MessageSquareText className="size-4" aria-hidden />}
        titel="Sådan skal den læses"
      >
        <p className="max-w-[80ch] text-sm leading-relaxed">{svar.forklaring}</p>
        <div className="mt-2">
          <div className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Det tager forespørgslen ikke højde for
          </div>
          <ul className="flex max-w-[80ch] flex-col gap-1.5 text-sm text-muted-foreground">
            {svar.forbehold.map((punkt, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-pka-rubin" aria-hidden />
                <span>{punkt}</span>
              </li>
            ))}
          </ul>
        </div>
      </Afsnit>

      <Afsnit ikon={<Table2 className="size-4" aria-hidden />} titel="Resultat">
        <SvarTabel kolonner={svar.kolonner} raekker={svar.raekker} />
      </Afsnit>

      {svar.graf && (
        <Afsnit ikon={<ChartColumn className="size-4" aria-hidden />} titel="Graf">
          <SvarGraf graf={svar.graf} raekker={svar.raekker} />
        </Afsnit>
      )}
    </div>
  );
}

export function SpoergPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [forslag, setForslag] = useState<Forslag[]>([]);
  const [tekst, setTekst] = useState("");
  const [arbejder, setArbejder] = useState(false);
  const [svar, setSvar] = useState<Svar | null>(null);
  const [fejl, setFejl] = useState<{ besked: string; sql?: string } | null>(null);

  useEffect(() => {
    const afbryd = new AbortController();

    void fetch("/api/status", { signal: afbryd.signal })
      .then((r) => r.json() as Promise<Status>)
      .then(setStatus)
      .catch(() => {});

    void fetch("/api/eksempler", { signal: afbryd.signal })
      .then((r) => r.json() as Promise<Forslag[]>)
      .then(setForslag)
      .catch(() => {});

    return () => afbryd.abort();
  }, []);

  async function spoerg(spoergsmaal: string) {
    const rent = spoergsmaal.trim();
    if (!rent || arbejder) return;

    setArbejder(true);
    setFejl(null);

    try {
      const svarFraServer = await fetch("/api/spoerg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spoergsmaal: rent }),
      });
      const krop = (await svarFraServer.json()) as Svar | { fejl: string; sql?: string };

      if ("fejl" in krop) {
        setSvar(null);
        setFejl({ besked: krop.fejl, sql: krop.sql });
      } else {
        setSvar(krop);
      }
    } catch (e) {
      setSvar(null);
      setFejl({ besked: e instanceof Error ? e.message : "Ukendt fejl" });
    } finally {
      setArbejder(false);
    }
  }

  function send(e: FormEvent) {
    e.preventDefault();
    void spoerg(tekst);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Spørg til tallene</CardTitle>
            <StatusMaerkat status={status} />
          </div>
          <CardDescription>
            Skriv et spørgsmål på dansk. Du får den SQL, der blev kørt, en forklaring på hvad den
            gør og ikke tager højde for, resultatet som tabel og en graf, når det giver mening.
            Kun læsende forespørgsler køres.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <form onSubmit={send} className="flex flex-col gap-3">
          <Textarea
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e);
            }}
            rows={3}
            disabled={arbejder}
            placeholder="For eksempel: hvad brugte vi på licenser i Q4, pr. kreditor?"
            aria-label="Dit spørgsmål"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {forslag.map((f) => (
                <Button
                  key={f.id}
                  type="button"
                  variant="sekundaer"
                  size="sm"
                  disabled={arbejder}
                  onClick={() => {
                    setTekst(f.spoergsmaal);
                    void spoerg(f.spoergsmaal);
                  }}
                >
                  {f.spoergsmaal}
                </Button>
              ))}
            </div>

            <Button type="submit" disabled={arbejder || tekst.trim().length === 0}>
              {arbejder ? "Arbejder…" : "Spørg"}
              <CornerDownLeft className="size-4" aria-hidden />
            </Button>
          </div>
        </form>

        {fejl && (
          <div className="flex flex-col gap-3 rounded-card border border-pka-roed/30 bg-pka-roed/5 p-4">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-pka-roed" aria-hidden />
              <div>
                <div className="font-semibold text-pka-bordeaux">Spørgsmålet kunne ikke besvares</div>
                <p className="mt-1 text-sm text-muted-foreground">{fejl.besked}</p>
              </div>
            </div>
            {fejl.sql && <SqlBoks sql={fejl.sql} />}
          </div>
        )}

        {arbejder && !svar && <Skeleton className="h-40" />}

        {svar && <Svarvisning svar={svar} />}
      </CardContent>
    </Card>
  );
}
