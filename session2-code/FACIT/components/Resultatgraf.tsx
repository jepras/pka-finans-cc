import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FARVER, GITTER } from "@/lib/farver";
import { erBeloebskolonne, kortTal, tal } from "@/lib/utils";
import type { Graftype, Raekke } from "@/lib/typer";

type Props = { raekker: Raekke[]; graftype: Graftype };

// Første tekstkolonne bliver kategori, første talkolonne bliver værdi.
// Modellen bestemmer kolonnenavnene, så reglen skal kunne holde til alt.
function vaelgKolonner(raekker: Raekke[]) {
  const foerste = raekker[0];
  const navne = Object.keys(foerste);
  const kategori = navne.find((n) => typeof foerste[n] === "string");
  const vaerdi = navne.find((n) => typeof foerste[n] === "number");
  return kategori && vaerdi ? { kategori, vaerdi } : null;
}

export function Resultatgraf({ raekker, graftype }: Props) {
  if (graftype === "ingen" || raekker.length < 2) return null;

  const kolonner = vaelgKolonner(raekker);
  if (!kolonner) {
    return (
      <p className="text-xs text-muted-foreground">
        Resultatet har ikke både en tekstkolonne og en talkolonne, så der er ingen graf.
      </p>
    );
  }

  const { kategori, vaerdi } = kolonner;
  const iKroner = erBeloebskolonne(vaerdi);
  const visVaerdi = (v: number) => (iKroner ? `${tal(v)} kr.` : tal(v, Number.isInteger(v) ? 0 : 2));

  // Kun rækker med et tal i værdikolonnen. NULL ville give huller i grafen.
  const data = raekker.filter((r) => typeof r[vaerdi] === "number");
  if (data.length < 2) return null;

  // Et array og ikke en fragment. Recharts leder efter sine akser blandt de direkte
  // børn, og React fladgør arrays, mens en fragment ville skjule akserne for Recharts.
  const akse = [
    <CartesianGrid key="gitter" stroke={GITTER} vertical={false} />,
    <XAxis
      key="x"
      dataKey={kategori}
      tickLine={false}
      axisLine={false}
      fontSize={11}
      interval={0}
      height={64}
      angle={-30}
      textAnchor="end"
      tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}.` : v)}
    />,
    <YAxis
      key="y"
      tickFormatter={kortTal}
      tickLine={false}
      axisLine={false}
      fontSize={11}
      width={70}
    />,
    <Tooltip
      key="tooltip"
      formatter={(v) => visVaerdi(Number(v))}
      contentStyle={{ borderRadius: 10, border: `1px solid ${GITTER}`, fontSize: 12 }}
    />,
  ];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {graftype === "linje" ? (
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            {akse}
            <Line
              type="monotone"
              dataKey={vaerdi}
              stroke={FARVER[0]}
              strokeWidth={2}
              dot={{ r: 3, fill: FARVER[0] }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            {akse}
            <Bar dataKey={vaerdi} fill={FARVER[0]} radius={[3, 3, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
