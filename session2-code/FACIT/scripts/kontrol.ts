// Kører de gyldne spørgsmål i kontroller/gyldne-spoergsmaal.json mod databasen.
// Kør: bun run kontrol
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";

const rod = new URL("..", import.meta.url).pathname;
const db = new Database(`${rod}data/finanskube-2025.sqlite`, { readonly: true });
db.exec(readFileSync(`${rod}data/rettelser.sql`, "utf8"));

type Kontrol = { id: number; spoergsmaal: string; sql: string; forventet: number | string; tolerance?: number; solo?: boolean };
const kontroller: Kontrol[] = JSON.parse(readFileSync(`${rod}kontroller/gyldne-spoergsmaal.json`, "utf8"));

const fmt = (v: unknown) => typeof v === "number" ? v.toLocaleString("da-DK", { maximumFractionDigits: 2 }) : String(v);
let fejl = 0;
for (const k of kontroller) {
  const rows = db.query(k.sql).all() as Record<string, unknown>[];
  let faktisk: unknown = rows.length ? Object.values(rows[0])[0] : null;
  const ok = typeof k.forventet === "number"
    ? Math.abs(Number(faktisk) - k.forventet) <= (k.tolerance ?? 0)
    : String(faktisk) === k.forventet;
  const maerke = ok ? "BESTÅET" : k.solo ? "FEJLET (solo-opgave)" : "FEJLET";
  if (!ok && !k.solo) fejl++;
  console.log(`${ok ? "  ok " : " FEJL"}  ${k.id}. ${k.spoergsmaal}`);
  console.log(`        ${maerke}. Forventet ${fmt(k.forventet)}, fik ${fmt(faktisk)}`);
}
console.log(fejl === 0 ? "\nAlle kontroller bestået." : `\n${fejl} kontrol${fejl > 1 ? "ler" : ""} fejlet.`);
process.exit(fejl === 0 ? 0 : 1);
