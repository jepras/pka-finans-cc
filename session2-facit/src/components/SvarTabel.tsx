import { formatAntal, formatVaerdi } from "../lib/format.ts";
import type { SvarRaekke } from "../types.ts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";

/** Kolonnenavne kommer fra SQL-aliasser: vis pct_formueforvaltning som "Pct formueforvaltning". */
function pænKolonne(navn: string): string {
  const med_mellemrum = navn.replace(/_/g, " ").trim();
  return med_mellemrum.charAt(0).toUpperCase() + med_mellemrum.slice(1);
}

export function SvarTabel({
  kolonner,
  raekker,
}: {
  kolonner: string[];
  raekker: SvarRaekke[];
}) {
  if (raekker.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Forespørgslen kørte, men gav ingen rækker. Prøv en bredere afgrænsning.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            {kolonner.map((k) => (
              <TableHead key={k} className={typeof raekker[0]?.[k] === "number" ? "text-right" : ""}>
                {pænKolonne(k)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {raekker.map((raekke, i) => (
            <TableRow key={i}>
              {kolonner.map((k) => {
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
      <p className="text-xs text-muted-foreground">
        {formatAntal(raekker.length)} {raekker.length === 1 ? "række" : "rækker"}
      </p>
    </div>
  );
}
