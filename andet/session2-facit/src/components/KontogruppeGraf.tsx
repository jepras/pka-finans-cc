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

import { formatAkse, formatKr, formatKrKompakt, formatProcent } from "../lib/format.ts";
import { farveTilKontogruppe } from "../lib/theme.ts";
import type { KontogrupperPrKvartal } from "../types.ts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card.tsx";

type TooltipPost = { name?: string; value?: number; color?: string };

function Forklaring({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPost[];
}) {
  if (!active || !payload?.length) return null;

  const poster = [...payload].reverse();
  const total = poster.reduce((sum, p) => sum + (p.value ?? 0), 0);

  return (
    <div className="rounded-card border border-border bg-card p-3 shadow-lg">
      <div className="mb-2 text-sm font-semibold text-pka-bordeaux">{label}</div>
      <table className="text-sm">
        <tbody>
          {poster.map((p) => (
            <tr key={p.name}>
              <td className="pr-3 align-middle">
                <span
                  className="inline-block size-2.5 rounded-sm align-middle"
                  style={{ backgroundColor: p.color }}
                  aria-hidden
                />
              </td>
              <td className="pr-4 whitespace-nowrap">{p.name}</td>
              <td className="tal pr-3 text-right whitespace-nowrap">{formatKr(p.value ?? 0)}</td>
              <td className="tal text-right whitespace-nowrap text-muted-foreground">
                {formatProcent(total === 0 ? 0 : (p.value ?? 0) / total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex justify-between gap-6 border-t border-border pt-2 text-sm font-medium">
        <span>I alt</span>
        <span className="tal">{formatKr(total)}</span>
      </div>
    </div>
  );
}

export function KontogruppeGraf({ data }: { data: KontogrupperPrKvartal }) {
  const { kontogrupper, raekker } = data;
  const aarstotal = raekker.reduce((sum, r) => sum + r.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontogrupper pr. kvartal</CardTitle>
        <CardDescription>
          Omkostningsbase ekskl. moms, fordelt på kontoplanens grupper. Året i alt{" "}
          {formatKrKompakt(aarstotal)}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={raekker} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E6DFE3" />
              <XAxis
                dataKey="kvartal"
                tickLine={false}
                axisLine={{ stroke: "#E6DFE3" }}
                tick={{ fill: "#6B5A62", fontSize: 13 }}
              />
              <YAxis
                tickFormatter={formatAkse}
                tickLine={false}
                axisLine={false}
                width={72}
                tick={{ fill: "#6B5A62", fontSize: 12 }}
              />
              <Tooltip content={<Forklaring />} cursor={{ fill: "rgba(146, 0, 77, 0.06)" }} />
              <Legend
                verticalAlign="bottom"
                height={48}
                iconType="square"
                wrapperStyle={{ fontSize: 13, color: "#6B5A62", paddingTop: 12 }}
              />
              {kontogrupper.map((gruppe, i) => (
                <Bar
                  key={gruppe}
                  dataKey={gruppe}
                  stackId="kontogrupper"
                  fill={farveTilKontogruppe(gruppe, i)}
                  radius={i === kontogrupper.length - 1 ? [4, 4, 0, 0] : undefined}
                  maxBarSize={96}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
