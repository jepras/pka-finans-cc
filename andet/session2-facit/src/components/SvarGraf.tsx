import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatAkse, formatVaerdi } from "../lib/format.ts";
import { GRAF_FARVER } from "../lib/theme.ts";
import type { GrafSpec, SvarRaekke } from "../types.ts";

type TooltipPost = { name?: string; value?: number; color?: string; dataKey?: string | number };

function Forklaring({
  active,
  label,
  payload,
  serieNoegler,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPost[];
  serieNoegler: string[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-card border border-border bg-card p-3 text-sm shadow-lg">
      <div className="mb-1.5 font-semibold text-pka-bordeaux">{label}</div>
      {payload.map((p, i) => (
        <div key={p.name ?? i} className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ backgroundColor: p.color }}
              aria-hidden
            />
            {p.name}
          </span>
          <span className="tal font-medium">
            {formatVaerdi(serieNoegler[i] ?? String(p.dataKey ?? ""), p.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Lange kategorinavne på x-aksen kortes, så søjlerne ikke skubbes sammen. */
function kortLabel(v: unknown): string {
  const tekst = String(v ?? "");
  return tekst.length > 18 ? `${tekst.slice(0, 17)}…` : tekst;
}

export function SvarGraf({ graf, raekker }: { graf: GrafSpec; raekker: SvarRaekke[] }) {
  const serieNoegler = graf.serier.map((s) => s.noegle);

  // Array frem for fragment: Recharts finder sine akser blandt børnene, og et
  // fragment ville gemme dem et niveau nede.
  const faellesAkser = [
    <CartesianGrid key="grid" vertical={false} stroke="#E6DFE3" />,
    <XAxis
      key="x"
      dataKey={graf.xNoegle}
      tickFormatter={kortLabel}
      tickLine={false}
      axisLine={{ stroke: "#E6DFE3" }}
      tick={{ fill: "#6B5A62", fontSize: 12 }}
      interval={0}
      angle={raekker.length > 6 ? -25 : 0}
      textAnchor={raekker.length > 6 ? "end" : "middle"}
      height={raekker.length > 6 ? 72 : 40}
    />,
    <YAxis
      key="y"
      tickFormatter={formatAkse}
      tickLine={false}
      axisLine={false}
      width={72}
      tick={{ fill: "#6B5A62", fontSize: 12 }}
    />,
    <Tooltip
      key="tooltip"
      content={<Forklaring serieNoegler={serieNoegler} />}
      cursor={{ fill: "rgba(146, 0, 77, 0.06)" }}
    />,
    ...(graf.serier.length > 1
      ? [
          <Legend
            key="legend"
            verticalAlign="bottom"
            iconType="square"
            wrapperStyle={{ fontSize: 13, color: "#6B5A62", paddingTop: 8 }}
          />,
        ]
      : []),
  ];

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {graf.type === "linje" ? (
          <LineChart data={raekker} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            {faellesAkser}
            {graf.serier.map((s, i) => (
              <Line
                key={s.noegle}
                type="monotone"
                dataKey={s.noegle}
                name={s.navn}
                stroke={GRAF_FARVER[i % GRAF_FARVER.length]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart data={raekker} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            {faellesAkser}
            {graf.serier.map((s, i) => (
              <Bar
                key={s.noegle}
                dataKey={s.noegle}
                name={s.navn}
                fill={GRAF_FARVER[i % GRAF_FARVER.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={72}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
