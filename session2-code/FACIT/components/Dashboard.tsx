import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiKort } from "@/components/KpiKort";
import { kr, tal } from "@/lib/utils";
import { FARVER, GITTER } from "@/lib/farver";
import type { DashboardData } from "@/lib/typer";

const mio = (v: number) => `${tal(v / 1_000_000, 1)} mio.`;

export function Dashboard({ data }: { data: DashboardData }) {
  const { kpi, kontogrupper, kvartaler, kreditorer } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiKort
          titel="Samlede omkostninger 2025"
          vaerdi={kr(kpi.samletBeloeb)}
          note="Ekskl. moms, hele året"
        />
        <KpiKort
          titel="Antal bilag"
          vaerdi={tal(kpi.antalBilag)}
          note="Unikke bilagsnumre, én postering pr. bilag i dette udtræk"
        />
        <KpiKort
          titel="Største kontogruppe"
          vaerdi={kpi.stoersteKontogruppe.navn}
          note={`${kr(kpi.stoersteKontogruppe.beloeb)}, ${tal(kpi.stoersteKontogruppe.andel, 1)} procent af basen`}
        />
        <KpiKort
          titel="Andel på formueforvaltning"
          vaerdi={`${tal(kpi.formueforvaltning.andel, 1)} procent`}
          note={kr(kpi.formueforvaltning.beloeb)}
          advarsel={
            kpi.formueforvaltning.daekning < 99.95
              ? `Beregnet på ${tal(kpi.formueforvaltning.daekning, 1)} procent af omkostningsbasen. Mindst ét omkostningssted mangler en fordelingsnøgle.`
              : undefined
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-bordeaux">Kontogruppe pr. kvartal</CardTitle>
          <CardDescription>Bogførte beløb ekskl. moms, stablet pr. kvartal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kvartaler} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid stroke={GITTER} vertical={false} />
                <XAxis dataKey="kvartal" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickFormatter={mio}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={70}
                />
                <Tooltip
                  formatter={(v) => kr(Number(v))}
                  contentStyle={{
                    borderRadius: 10,
                    border: `1px solid ${GITTER}`,
                    fontSize: 12,
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                {kontogrupper.map((gruppe, i) => (
                  <Bar
                    key={gruppe}
                    dataKey={gruppe}
                    stackId="a"
                    fill={FARVER[i % FARVER.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-bordeaux">De ti største kreditorer</CardTitle>
          <CardDescription>
            Grupperet på kreditornavn, så samme leverandør med to stavemåder står som to rækker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kreditor</TableHead>
                <TableHead className="text-right">Beløb</TableHead>
                <TableHead className="text-right">Posteringer</TableHead>
                <TableHead className="text-right">Andel af basen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kreditorer.map((k) => (
                <TableRow key={k.kreditornavn}>
                  <TableCell className="font-medium">{k.kreditornavn}</TableCell>
                  <TableCell className="text-right tabular-nums">{kr(k.beloeb)}</TableCell>
                  <TableCell className="text-right tabular-nums">{tal(k.antal)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {tal(k.andel, 1)} procent
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
