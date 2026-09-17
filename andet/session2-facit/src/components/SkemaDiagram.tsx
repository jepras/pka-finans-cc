import { KeyRound, Table2 } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { formatAntal } from "../lib/format.ts";
import { cn } from "../lib/utils.ts";
import { fordelSoejler } from "../skema.ts";
import type { Skema, SkemaTabel } from "../types.ts";
import { Badge } from "./ui/badge.tsx";

const LINJE = "#c7c9d4";
const LINJE_FREMHAEVET = "#ce0060";

type Linje = {
  noegle: string;
  d: string;
  label: string;
  labelX: number;
  labelY: number;
  fremhaevet: boolean;
};

type Boks = { x: number; y: number; w: number; h: number; mx: number; my: number };

function boks(el: HTMLElement, container: DOMRect): Boks {
  const r = el.getBoundingClientRect();
  const x = r.left - container.left;
  const y = r.top - container.top;
  return { x, y, w: r.width, h: r.height, mx: x + r.width / 2, my: y + r.height / 2 };
}

/** Punktet midt på en kubisk bezier, til at placere kolonnenavnet på linjen. */
function midtpunkt(p1: number, c1: number, c2: number, p2: number): number {
  return (p1 + 3 * c1 + 3 * c2 + p2) / 8;
}

/**
 * Linjerne tegnes ud fra kortenes faktiske placering, så de følger med, når
 * layoutet skifter fra tre søjler til én på en smal skærm.
 */
function beregnLinjer(
  container: HTMLElement,
  kort: Map<string, HTMLElement>,
  skema: Skema,
  fremhaevede: Set<string>,
): Linje[] {
  const c = container.getBoundingClientRect();

  return skema.relationer.flatMap((rel, i): Linje[] => {
    const fraEl = kort.get(rel.fra);
    const tilEl = kort.get(rel.til);
    if (!fraEl || !tilEl) return [];

    const a = boks(fraEl, c);
    const b = boks(tilEl, c);
    const dx = b.mx - a.mx;
    const dy = b.my - a.my;

    let p1x: number, p1y: number, p2x: number, p2y: number;
    let c1x: number, c1y: number, c2x: number, c2y: number;

    if (Math.abs(dx) >= Math.abs(dy)) {
      // Sideordnede kort forbindes kant til kant.
      const k = Math.max(40, Math.abs(dx) / 3);
      p1x = dx >= 0 ? a.x + a.w : a.x;
      p2x = dx >= 0 ? b.x : b.x + b.w;
      p1y = a.my;
      p2y = b.my;
      c1x = p1x + (dx >= 0 ? k : -k);
      c2x = p2x - (dx >= 0 ? k : -k);
      c1y = p1y;
      c2y = p2y;
    } else {
      // Kort i samme søjle forbindes udenom, så linjen ikke løber hen over dem imellem.
      const udad = a.mx < c.width / 2 ? -1 : 1;
      const k = Math.max(30, Math.abs(dy) / 3);
      const bule = udad * Math.max(40, Math.abs(dy) / 3);
      p1x = a.mx + udad * a.w * 0.3;
      p2x = b.mx + udad * b.w * 0.3;
      p1y = dy >= 0 ? a.y + a.h : a.y;
      p2y = dy >= 0 ? b.y : b.y + b.h;
      c1x = p1x + bule;
      c2x = p2x + bule;
      c1y = p1y + (dy >= 0 ? k : -k);
      c2y = p2y - (dy >= 0 ? k : -k);
    }

    return [
      {
        noegle: `${rel.fra}-${rel.til}-${rel.kolonne}-${i}`,
        d: `M ${p1x} ${p1y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2x} ${p2y}`,
        label: rel.kolonne,
        labelX: midtpunkt(p1x, c1x, c2x, p2x),
        labelY: midtpunkt(p1y, c1y, c2y, p2y),
        fremhaevet: fremhaevede.has(rel.fra) && fremhaevede.has(rel.til),
      },
    ];
  });
}

function TabelKort({
  tabel,
  valgt,
  fremhaevet,
  onVaelg,
  kortRef,
}: {
  tabel: SkemaTabel;
  valgt: boolean;
  fremhaevet: boolean;
  onVaelg: () => void;
  kortRef: (el: HTMLElement | null) => void;
}) {
  return (
    <button
      ref={kortRef}
      type="button"
      onClick={onVaelg}
      aria-pressed={valgt}
      className={cn(
        "w-full max-w-[19rem] rounded-card border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        valgt ? "border-pka-roed bg-muted/40" : "border-border",
        fremhaevet && "border-pka-rubin ring-2 ring-pka-rubin/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold text-pka-bordeaux">
          <Table2 className="size-4 text-pka-roed" aria-hidden />
          {tabel.navn}
        </span>
        <span className="tal text-xs text-muted-foreground">
          {formatAntal(tabel.antalRaekker)} rækker
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tabel.beskrivelse}</p>

      <ul className="mt-3 flex flex-col gap-0.5 border-t border-border pt-3">
        {tabel.kolonner.map((k) => (
          <li key={k.navn} className="flex items-baseline justify-between gap-3 text-xs">
            <span className="tal flex items-center gap-1 text-foreground">
              {k.primaernoegle && <KeyRound className="size-3 text-pka-roed" aria-hidden />}
              {k.navn}
            </span>
            <span className="text-[0.65rem] tracking-wide text-muted-foreground">{k.type}</span>
          </li>
        ))}
      </ul>

      {fremhaevet && (
        <Badge variant="aktiv" className="mt-3">
          Brugt i svaret
        </Badge>
      )}
    </button>
  );
}

export function SkemaDiagram({
  skema,
  valgt,
  onVaelg,
  fremhaevede,
}: {
  skema: Skema;
  valgt: string | null;
  onVaelg: (tabel: string) => void;
  fremhaevede: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const kortRefs = useRef(new Map<string, HTMLElement>());
  const [linjer, setLinjer] = useState<Linje[]>([]);

  const fremhaevetSaet = new Set(fremhaevede);
  const { midte, venstre, hoejre } = fordelSoejler(skema.tabeller, skema.relationer);

  // Arrayet er nyt ved hver render; indholdet er det, målingen afhænger af.
  const fremhaevetNoegle = fremhaevede.join(",");

  const maal = useCallback(() => {
    if (!containerRef.current) return;
    const saet = new Set(fremhaevetNoegle ? fremhaevetNoegle.split(",") : []);
    setLinjer(beregnLinjer(containerRef.current, kortRefs.current, skema, saet));
  }, [skema, fremhaevetNoegle]);

  useLayoutEffect(() => {
    maal();

    const observer = new ResizeObserver(maal);
    if (containerRef.current) observer.observe(containerRef.current);
    for (const el of kortRefs.current.values()) observer.observe(el);
    window.addEventListener("resize", maal);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", maal);
    };
  }, [maal]);

  function kortRef(navn: string) {
    return (el: HTMLElement | null) => {
      if (el) kortRefs.current.set(navn, el);
      else kortRefs.current.delete(navn);
    };
  }

  function soejle(tabeller: SkemaTabel[], justering: string) {
    return (
      <div className={cn("flex flex-col items-center gap-6", justering)}>
        {tabeller.map((t) => (
          <TabelKort
            key={t.navn}
            tabel={t}
            valgt={valgt === t.navn}
            fremhaevet={fremhaevetSaet.has(t.navn)}
            onVaelg={() => onVaelg(t.navn)}
            kortRef={kortRef(t.navn)}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <marker id="pil" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill={LINJE} />
          </marker>
          <marker
            id="pil-fremhaevet"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill={LINJE_FREMHAEVET} />
          </marker>
        </defs>

        {linjer.map((l) => (
          <g key={l.noegle}>
            <path
              d={l.d}
              fill="none"
              stroke={l.fremhaevet ? LINJE_FREMHAEVET : LINJE}
              strokeWidth={l.fremhaevet ? 2.5 : 1.5}
              markerEnd={`url(#${l.fremhaevet ? "pil-fremhaevet" : "pil"})`}
            />
            <text
              x={l.labelX}
              y={l.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill={l.fremhaevet ? LINJE_FREMHAEVET : "#6b5a62"}
              stroke="#ffffff"
              strokeWidth="4"
              paintOrder="stroke"
            >
              {l.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-24">
        {soejle(venstre, "lg:items-end")}
        <div className="flex justify-center">
          {midte && (
            <TabelKort
              tabel={midte}
              valgt={valgt === midte.navn}
              fremhaevet={fremhaevetSaet.has(midte.navn)}
              onVaelg={() => onVaelg(midte.navn)}
              kortRef={kortRef(midte.navn)}
            />
          )}
        </div>
        {soejle(hoejre, "lg:items-start")}
      </div>
    </div>
  );
}
