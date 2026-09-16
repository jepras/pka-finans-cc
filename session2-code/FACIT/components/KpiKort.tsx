import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  titel: string;
  vaerdi: string;
  note?: string;
  advarsel?: string;
};

// Note står under tallet. Advarsel bruges, når tallet har et forbehold, man skal se.
export function KpiKort({ titel, vaerdi, note, advarsel }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titel}</CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <p className="text-2xl font-semibold tabular-nums text-bordeaux">{vaerdi}</p>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
        {advarsel && <p className="mt-2 text-xs leading-snug text-[#7a2b1f]">{advarsel}</p>}
      </CardContent>
    </Card>
  );
}
