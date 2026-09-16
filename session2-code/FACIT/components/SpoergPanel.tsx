import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Resultatgraf } from "@/components/Resultatgraf";
import { erBeloebskolonne, kr, tal } from "@/lib/utils";
import type { AskFejl, AskSvar, Raekke, RapportSvar } from "@/lib/typer";

const EKSEMPLER = [
  "Hvad brugte vi på licenser i Q4 pr. kreditor?",
  "Vis personaleomkostninger pr. måned",
  "Hvem er de fem største eksterne rådgivere?",
];

export function SpoergPanel() {
  const [spoergsmaal, setSpoergsmaal] = React.useState("");
  const [svar, setSvar] = React.useState<AskSvar | null>(null);
  const [fejl, setFejl] = React.useState<AskFejl | null>(null);
  const [koerer, setKoerer] = React.useState(false);
  // Spørgsmålet som det var, da svaret kom. Tekstfeltet kan være redigeret siden,
  // og rapporten skal gemme det spørgsmål, svaret faktisk hører til.
  const [stillet, setStillet] = React.useState("");
  const [gemmer, setGemmer] = React.useState(false);
  const [gemt, setGemt] = React.useState<RapportSvar | null>(null);
  const [gemFejl, setGemFejl] = React.useState<string | null>(null);

  async function spoerg() {
    const tekst = spoergsmaal.trim();
    if (!tekst || koerer) return;
    setKoerer(true);
    setFejl(null);
    setSvar(null);
    setGemt(null);
    setGemFejl(null);
    setStillet(tekst);
    try {
      const svarFraServer = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spoergsmaal: tekst }),
      });
      const krop = await svarFraServer.json();
      if (svarFraServer.ok) setSvar(krop as AskSvar);
      else setFejl(krop as AskFejl);
    } catch (e) {
      setFejl({ fejl: `Kunne ikke nå serveren: ${String(e)}` });
    } finally {
      setKoerer(false);
    }
  }

  // Serveren kører SQL'en igen, når den gemmer, så rapporten viser databasens tal
  // og ikke det, browseren tilfældigvis står med.
  async function gem() {
    if (!svar || gemmer) return;
    setGemmer(true);
    setGemFejl(null);
    try {
      const svarFraServer = await fetch("/api/rapport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spoergsmaal: stillet,
          titel: svar.titel,
          sql: svar.sql,
          forklaring: svar.forklaring,
        }),
      });
      const krop = await svarFraServer.json();
      if (svarFraServer.ok) setGemt(krop as RapportSvar);
      else setGemFejl((krop as { fejl?: string }).fejl ?? `HTTP ${svarFraServer.status}`);
    } catch (e) {
      setGemFejl(`Kunne ikke nå serveren: ${String(e)}`);
    } finally {
      setGemmer(false);
    }
  }

  // Cmd eller Ctrl med Enter sender, så man ikke skal flytte hånden til musen.
  function paaTast(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void spoerg();
    }
  }

  const vist = svar ?? (fejl?.sql ? fejl : null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-bordeaux">Spørg dine tal</CardTitle>
        <CardDescription>
          Skriv et spørgsmål på dansk. Du får SQL'en, en forklaring og resultatet, så du selv kan
          vurdere svaret.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Textarea
            value={spoergsmaal}
            onChange={(e) => setSpoergsmaal(e.target.value)}
            onKeyDown={paaTast}
            placeholder="Eksempel: Hvad brugte vi på licenser i Q4 pr. kreditor?"
            disabled={koerer}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {EKSEMPLER.map((e) => (
                <Button
                  key={e}
                  variant="secondary"
                  size="sm"
                  onClick={() => setSpoergsmaal(e)}
                  disabled={koerer}
                >
                  {e}
                </Button>
              ))}
            </div>
            <Button onClick={() => void spoerg()} disabled={koerer || !spoergsmaal.trim()}>
              {koerer ? "Spørger" : "Spørg"}
            </Button>
          </div>
        </div>

        {fejl && <Fejlbesked fejl={fejl} />}

        {vist?.sql && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {svar && <h3 className="text-sm font-semibold text-bordeaux">{svar.titel}</h3>}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <Sql sql={vist.sql} />
                {vist.forklaring && (
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-bordeaux">Hvad gør den</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {vist.forklaring}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-bordeaux">Resultat</h4>
                  {svar && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void gem()}
                      disabled={gemmer}
                    >
                      {gemmer ? "Gemmer" : "Gem som rapport"}
                    </Button>
                  )}
                </div>
                {gemt && (
                  <div className="mb-3 rounded-md border border-border bg-mint/20 px-3 py-2">
                    <p className="text-xs font-semibold text-foreground">Gemt</p>
                    <p className="mt-1 font-mono text-xs leading-relaxed break-all text-muted-foreground">
                      {gemt.mdFil}
                      <br />
                      {gemt.sqlFil}
                    </p>
                  </div>
                )}
                {gemFejl && (
                  <p className="mb-3 rounded-md border border-powder bg-powder/15 px-3 py-2 text-xs text-foreground">
                    Rapporten blev ikke gemt: {gemFejl}
                  </p>
                )}
                {svar ? (
                  <div className="flex flex-col gap-4">
                    <Resultat raekker={svar.raekker} afkortet={svar.afkortet} />
                    <Resultatgraf raekker={svar.raekker} graftype={svar.graftype} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Forespørgslen blev ikke kørt, så der er ikke noget resultat.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Fejlbesked({ fejl }: { fejl: AskFejl }) {
  return (
    <div className="rounded-lg border border-powder bg-powder/15 px-4 py-3">
      <p className="text-sm font-semibold text-[#7a2b1f]">Det gik ikke</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{fejl.fejl}</p>
      {fejl.sql && (
        <p className="mt-1 text-xs text-muted-foreground">
          SQL'en står nedenfor, så du kan se, hvad der blev afvist.
        </p>
      )}
    </div>
  );
}

function Sql({ sql }: { sql: string }) {
  const [kopieret, setKopieret] = React.useState(false);

  async function kopier() {
    try {
      await navigator.clipboard.writeText(sql);
      setKopieret(true);
      setTimeout(() => setKopieret(false), 1500);
    } catch {
      setKopieret(false);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-bordeaux">SQL</h4>
        <Button variant="ghost" size="sm" onClick={() => void kopier()}>
          {kopieret ? "Kopieret" : "Kopiér"}
        </Button>
      </div>
      <pre className="overflow-auto rounded-md border border-border bg-muted px-3 py-3 text-xs leading-relaxed">
        <code>{sql}</code>
      </pre>
    </div>
  );
}

// Beløbskolonner får kr. på, alle andre tal vises blot i dansk talformat.
function formater(navn: string, vaerdi: string | number | null) {
  if (vaerdi === null || vaerdi === undefined) return "tom";
  if (typeof vaerdi !== "number") return String(vaerdi);
  if (erBeloebskolonne(navn)) return kr(vaerdi);
  return tal(vaerdi, Number.isInteger(vaerdi) ? 0 : 2);
}

function Resultat({ raekker, afkortet }: { raekker: Raekke[]; afkortet: boolean }) {
  if (!raekker.length) {
    return <p className="text-sm text-muted-foreground">Forespørgslen gav ingen rækker.</p>;
  }
  const kolonner = Object.keys(raekker[0]);

  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-96 overflow-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {kolonner.map((k) => (
                <TableHead key={k} className={typeof raekker[0][k] === "number" ? "text-right" : ""}>
                  {k}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {raekker.map((r, i) => (
              <TableRow key={i}>
                {kolonner.map((k) => (
                  <TableCell
                    key={k}
                    className={typeof r[k] === "number" ? "text-right tabular-nums" : ""}
                  >
                    {formater(k, r[k])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {tal(raekker.length)} {raekker.length === 1 ? "række" : "rækker"}
        {afkortet && ", vist som de første 200. Forespørgslen gav flere."}
      </p>
    </div>
  );
}
