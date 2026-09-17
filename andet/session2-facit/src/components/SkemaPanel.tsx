import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { formatAntal, formatVaerdi } from "../lib/format.ts";
import { tabellerISql } from "../sql-vagt.ts";
import type { Skema, TabelUdsnit } from "../types.ts";
import { SkemaDiagram } from "./SkemaDiagram.tsx";
import { Badge } from "./ui/badge.tsx";
import { Dialog, DialogBody } from "./ui/dialog.tsx";
import { Skeleton } from "./ui/skeleton.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";

function Udsnit({ udsnit }: { udsnit: TabelUdsnit }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-pka-bordeaux">
          Første {formatAntal(udsnit.raekker.length)} rækker af {udsnit.tabel}
        </h3>
        <span className="text-xs text-muted-foreground">
          {formatAntal(udsnit.antalRaekker)} rækker i alt
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {udsnit.kolonner.map((k) => (
                <TableHead
                  key={k}
                  className={typeof udsnit.raekker[0]?.[k] === "number" ? "text-right" : ""}
                >
                  {k}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {udsnit.raekker.map((raekke, i) => (
              <TableRow key={i}>
                {udsnit.kolonner.map((k) => {
                  const vaerdi = raekke[k] ?? null;
                  const erTal = typeof vaerdi === "number";
                  return (
                    <TableCell key={k} className={erTal ? "tal text-right" : ""}>
                      {formatVaerdi(k, vaerdi)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function Fejl({ besked }: { besked: string }) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-pka-roed/30 bg-pka-roed/5 p-4">
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-pka-roed" aria-hidden />
      <p className="text-sm text-muted-foreground">{besked}</p>
    </div>
  );
}

/**
 * Databasen som den er: tabellerne med deres kolonner, hvordan de hænger sammen,
 * og de første rækker af den tabel, man klikker på. Skemaet hentes fra serveren,
 * som læser det af filen — panelet kender ikke tabellerne på forhånd.
 */
export function SkemaPanel({
  aaben,
  onLuk,
  sql,
}: {
  aaben: boolean;
  onLuk: () => void;
  /** SQL'en fra svaret i spørg-panelet. De tabeller, den bruger, fremhæves. */
  sql: string | null;
}) {
  const [skema, setSkema] = useState<Skema | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);
  const [valgt, setValgt] = useState<string | null>(null);
  const [udsnit, setUdsnit] = useState<TabelUdsnit | null>(null);

  // Skemaet hentes første gang panelet åbnes, ikke ved sidens indlæsning.
  useEffect(() => {
    if (!aaben || skema) return;

    const afbryd = new AbortController();

    void fetch("/api/skema", { signal: afbryd.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Serveren svarede ${r.status}`);
        return (await r.json()) as Skema;
      })
      .then(setSkema)
      .catch((e: unknown) => {
        if (afbryd.signal.aborted) return;
        setFejl(e instanceof Error ? e.message : "Skemaet kunne ikke hentes.");
      });

    return () => afbryd.abort();
  }, [aaben, skema]);

  useEffect(() => {
    if (!valgt) {
      setUdsnit(null);
      return;
    }

    const afbryd = new AbortController();
    setUdsnit(null);
    setFejl(null);

    void fetch(`/api/tabel/${encodeURIComponent(valgt)}`, { signal: afbryd.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Serveren svarede ${r.status}`);
        return (await r.json()) as TabelUdsnit;
      })
      .then(setUdsnit)
      .catch((e: unknown) => {
        if (afbryd.signal.aborted) return;
        setFejl(e instanceof Error ? e.message : "Rækkerne kunne ikke hentes.");
      });

    return () => afbryd.abort();
  }, [valgt]);

  const fremhaevede =
    skema && sql ? tabellerISql(sql, skema.tabeller.map((t) => t.navn)) : [];

  return (
    <Dialog
      aaben={aaben}
      onLuk={onLuk}
      titel="Data bag dashboardet"
      beskrivelse={
        <>
          Tabellerne i databasen, som de står i filen. Linjerne viser, hvilken kolonne der binder
          dem sammen. Klik på en tabel for at se de første rækker.
        </>
      }
    >
      <DialogBody>
        {fremhaevede.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Svaret i spørg-panelet bruger:</span>
            {fremhaevede.map((t) => (
              <Badge key={t} variant="aktiv">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {fejl && <Fejl besked={fejl} />}

        {!skema && !fejl && <Skeleton className="h-96" />}

        {skema && (
          <SkemaDiagram
            skema={skema}
            valgt={valgt}
            onVaelg={(tabel) => setValgt((tidligere) => (tidligere === tabel ? null : tabel))}
            fremhaevede={fremhaevede}
          />
        )}

        {valgt && !udsnit && !fejl && <Skeleton className="h-64" />}
        {udsnit && <Udsnit udsnit={udsnit} />}
      </DialogBody>
    </Dialog>
  );
}
