import {
  CircleCheck,
  Coins,
  FileText,
  Layers,
  PieChart as PieChartIkon,
  Scale,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";

import { formatAntal, formatKr, formatKrKompakt, formatProcent } from "../lib/format.ts";
import type { Noegletal as NoegletalType } from "../types.ts";
import { Card, CardContent } from "./ui/card.tsx";

type FeltProps = {
  overskrift: string;
  vaerdi: string;
  note: ReactNode;
  ikon: ReactNode;
};

function Felt({ overskrift, vaerdi, note, ikon }: FeltProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {overskrift}
          </span>
          <span className="text-pka-roed">{ikon}</span>
        </div>
        <div>
          <div className="tal text-2xl leading-tight font-semibold text-pka-bordeaux">{vaerdi}</div>
          <div className="mt-1 text-sm text-muted-foreground">{note}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Noegletal({ tal }: { tal: NoegletalType }) {
  const { afstemning } = tal;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Felt
        overskrift="Omkostningsbase 2025"
        vaerdi={formatKr(tal.omkostningsbase)}
        note={`Ekskl. moms. Moms udgør ${formatKrKompakt(tal.momsIAlt)}`}
        ikon={<Coins className="size-5" aria-hidden />}
      />

      <Felt
        overskrift="Største kontogruppe"
        vaerdi={tal.stoersteKontogruppe.kontogruppe}
        note={`${formatKrKompakt(tal.stoersteKontogruppe.beloeb)} — ${formatProcent(
          tal.stoersteKontogruppe.andel,
        )} af basen`}
        ikon={<Layers className="size-5" aria-hidden />}
      />

      <Felt
        overskrift="Formueforvaltning"
        vaerdi={formatProcent(tal.formueforvaltning.andel)}
        note={`${formatKrKompakt(tal.formueforvaltning.beloeb)} fordelt via fordelingsnøgle`}
        ikon={<PieChartIkon className="size-5" aria-hidden />}
      />

      <Felt
        overskrift="Medlemsadministration"
        vaerdi={formatProcent(tal.medlemsadministration.andel)}
        note={`${formatKrKompakt(tal.medlemsadministration.beloeb)} fordelt via fordelingsnøgle`}
        ikon={<Scale className="size-5" aria-hidden />}
      />

      {afstemning.stemmer ? (
        <Felt
          overskrift="Afstemning"
          vaerdi="Stemmer"
          note={`Udtrækket matcher Finanskuben over ${formatAntal(afstemning.antalPerioder)} perioder`}
          ikon={<CircleCheck className="size-5" aria-hidden />}
        />
      ) : (
        <Felt
          overskrift="Afstemning"
          vaerdi={formatKrKompakt(afstemning.afvigelse)}
          note={`Afvigelse på ${formatProcent(Math.abs(afstemning.afvigelseAndel))} mod Finanskubens ${formatKrKompakt(
            afstemning.totalIfoelgeFinanskuben,
          )}`}
          ikon={<TriangleAlert className="size-5" aria-hidden />}
        />
      )}

      <div className="md:col-span-2 xl:col-span-5">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-2 pt-5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <FileText className="size-4 text-pka-roed" aria-hidden />
              <span className="tal font-medium text-foreground">
                {formatAntal(tal.antalPosteringer)}
              </span>
              posteringer
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="tal font-medium text-foreground">
                {formatAntal(tal.antalKreditorer)}
              </span>
              kreditorer med posteringer i året
            </span>
            <span className="inline-flex items-center gap-2">
              Gennemsnitlig postering
              <span className="tal font-medium text-foreground">
                {formatKr(
                  tal.antalPosteringer === 0 ? 0 : tal.omkostningsbase / tal.antalPosteringer,
                )}
              </span>
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
