import { formatAntal, formatKr, formatProcent } from "../lib/format.ts";
import type { KreditorRaekke } from "../types.ts";
import { Badge } from "./ui/badge.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table.tsx";

export function KreditorTabel({ kreditorer }: { kreditorer: KreditorRaekke[] }) {
  const stoerste = kreditorer[0]?.beloeb ?? 0;
  const samletAndel = kreditorer.reduce((sum, k) => sum + k.andel, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Største kreditorer</CardTitle>
        <CardDescription>
          Top {formatAntal(kreditorer.length)} målt på beløb ekskl. moms. Tilsammen{" "}
          {formatProcent(samletAndel)} af omkostningsbasen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-right">#</TableHead>
              <TableHead>Kreditor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-16">Land</TableHead>
              <TableHead className="text-right">Posteringer</TableHead>
              <TableHead className="text-right">Beløb</TableHead>
              <TableHead className="w-44">Andel af basen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kreditorer.map((k, i) => (
              <TableRow key={k.kreditornr}>
                <TableCell className="tal text-right text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{k.kreditornavn}</div>
                  <div className="tal text-xs text-muted-foreground">{k.kreditornr}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{k.kreditortype}</TableCell>
                <TableCell>
                  <Badge variant={k.land === "DK" ? "neutral" : "kontur"}>{k.land}</Badge>
                </TableCell>
                <TableCell className="tal text-right text-muted-foreground">
                  {formatAntal(k.antalPosteringer)}
                </TableCell>
                <TableCell className="tal text-right font-medium">{formatKr(k.beloeb)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-pka-rubin"
                        style={{
                          width: `${stoerste === 0 ? 0 : (k.beloeb / stoerste) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="tal w-14 text-right text-sm text-muted-foreground">
                      {formatProcent(k.andel)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
