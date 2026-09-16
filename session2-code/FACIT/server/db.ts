// Databasen åbnes read-only én gang for hele processen.
// rettelser.sql laver TEMP VIEW transaktioner_renset, og temp-views hører til forbindelsen.
// Derfor må der kun være én Database-instans, og query() er den eneste vej til data.
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";

const rod = new URL("..", import.meta.url).pathname;

const db = new Database(`${rod}data/finanskube-2025.sqlite`, { readonly: true });
db.exec(readFileSync(`${rod}data/rettelser.sql`, "utf8"));

export function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  return db.query(sql).all(...(params as never[])) as T[];
}
