/**
 * Model over databasens skema til "Se data"-panelet.
 *
 * Alt læses fra filen selv (se hentSkema i db.ts) — her ligger kun tolkningen:
 * hvad en række betyder, og hvordan tabellerne hænger sammen. Derfor virker
 * panelet også, hvis databasen skiftes ud med et andet udtræk.
 */

import type { SkemaRelation, SkemaTabel } from "./types.ts";

/** Fakta om en tabel, som db.ts har målt i databasen. */
export type KolonneFakta = {
  navn: string;
  type: string;
  primaernoegle: boolean;
  /** Sat når kolonnen har lige så mange forskellige værdier som rækker. */
  entydig: boolean;
};

export type TabelFakta = {
  navn: string;
  kolonner: KolonneFakta[];
  antalRaekker: number;
};

/**
 * Én sætning om hvad en række er. Teksterne følger data/DATAMODEL.md; en tabel,
 * vi ikke kender, får en sætning dannet ud fra skemaet i stedet for ingenting.
 */
const BESKRIVELSER: Record<string, string> = {
  transaktioner:
    "Én række er én postering: ét beløb ekskl. moms bogført på én konto, én kreditor og ét omkostningssted.",
  kontoplan: "Én række er én konto i kontoplanen med den kontogruppe, kontoen hører til.",
  kreditorer: "Én række er én kreditor med type og hjemland.",
  omkostningssteder: "Én række er ét omkostningssted med navn og afdeling.",
  fordelingsnoegle:
    "Én række er fordelingen af ét omkostningssted på de to forretningsområder, og andelene summer til 1.",
  kontroltotaler: "Én række er Finanskubens egen total for én periode, til afstemning af udtrækket.",
};

export function beskrivTabel(tabel: TabelFakta): string {
  const kendt = BESKRIVELSER[tabel.navn];
  if (kendt) return kendt;

  const noegle = tabel.kolonner.find((k) => k.primaernoegle) ?? tabel.kolonner.find((k) => k.entydig);
  return noegle
    ? `Én række er én post i ${tabel.navn}, entydigt bestemt af ${noegle.navn}.`
    : `Én række er én post i ${tabel.navn}.`;
}

function kolonne(tabel: TabelFakta, navn: string): KolonneFakta | undefined {
  return tabel.kolonner.find((k) => k.navn === navn);
}

/**
 * Sammenhænge mellem tabellerne. Har databasen erklærede fremmednøgler, bruges de
 * som de er. Ellers udledes de af skemaet: to tabeller med samme kolonnenavn hænger
 * sammen, når værdierne er entydige i mindst den ene — den side peges der hen.
 */
export function udledRelationer(
  tabeller: TabelFakta[],
  erklaerede: SkemaRelation[],
): SkemaRelation[] {
  if (erklaerede.length > 0) return erklaerede;

  const relationer: SkemaRelation[] = [];

  for (let i = 0; i < tabeller.length; i++) {
    for (let j = i + 1; j < tabeller.length; j++) {
      const a = tabeller[i]!;
      const b = tabeller[j]!;

      for (const kol of a.kolonner) {
        const modpart = kolonne(b, kol.navn);
        if (!modpart) continue;
        if (!kol.entydig && !modpart.entydig) continue;

        // Den mange-side peger på den entydige side. Er begge entydige, peger den
        // største tabel på den mindste, så opslagstabeller ender som modtagere.
        const aErKilde =
          kol.entydig && modpart.entydig ? a.antalRaekker >= b.antalRaekker : !kol.entydig;

        relationer.push(
          aErKilde
            ? { fra: a.navn, til: b.navn, kolonne: kol.navn }
            : { fra: b.navn, til: a.navn, kolonne: kol.navn },
        );
      }
    }
  }

  return relationer;
}

/** Antal relationer en tabel indgår i. Bruges til at placere den mest forbundne i midten. */
export function antalForbindelser(navn: string, relationer: SkemaRelation[]): number {
  return relationer.filter((r) => r.fra === navn || r.til === navn).length;
}

/**
 * Tre søjler med den mest forbundne tabel i midten. De øvrige fordeles til venstre
 * og højre, mest forbundne først. Tabeller, der også hænger sammen uden om midten,
 * lægges i samme søjle ved siden af hinanden, så den linje ikke krydser diagrammet.
 */
export function fordelSoejler(tabeller: SkemaTabel[], relationer: SkemaRelation[]) {
  const sorteret = [...tabeller].sort(
    (a, b) =>
      antalForbindelser(b.navn, relationer) - antalForbindelser(a.navn, relationer) ||
      b.antalRaekker - a.antalRaekker,
  );

  const [midte, ...resten] = sorteret;
  if (!midte) return { midte: null, venstre: [], hoejre: [] };

  const naboer = (navn: string) =>
    relationer
      .filter((r) => r.fra === navn || r.til === navn)
      .map((r) => (r.fra === navn ? r.til : r.fra));

  const venstre: SkemaTabel[] = [];
  const hoejre: SkemaTabel[] = [];
  const placeret = new Set<string>();

  for (const tabel of resten) {
    if (placeret.has(tabel.navn)) continue;

    // En tabel og dens naboer uden om midten hører sammen og placeres samlet.
    const gruppe = [
      tabel,
      ...resten.filter(
        (t) => !placeret.has(t.navn) && t.navn !== tabel.navn && naboer(tabel.navn).includes(t.navn),
      ),
    ];

    const soejle = venstre.length <= hoejre.length ? venstre : hoejre;
    for (const t of gruppe) {
      soejle.push(t);
      placeret.add(t.navn);
    }
  }

  return { midte, venstre, hoejre };
}
