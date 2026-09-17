/**
 * Feltet til API-nøglen, med tilstandsmærkatet ved siden af.
 *
 * Nøglen sendes til /api/noegle, som tager den i brug og skriver den i .env.
 * Serveren svarer med den nye tilstand, så mærkatet skifter fra eksempelsvar til
 * Claude uden genstart og uden at siden skal genindlæses.
 */

import { Bot, Check, KeyRound, ListChecks, TriangleAlert } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { NoegleSvar, Status } from "../types.ts";
import { Badge } from "./ui/badge.tsx";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Skeleton } from "./ui/skeleton.tsx";

type Gemning =
  | { status: "klar" }
  | { status: "gemmer" }
  | { status: "gemt"; advarsel?: string }
  | { status: "fejl"; besked: string };

function StatusMaerkat({ status }: { status: Status | null }) {
  if (!status) return <Skeleton className="h-6 w-32" />;

  const medClaude = status.kilde === "claude";
  const Ikon = medClaude ? Bot : ListChecks;

  return (
    <Badge variant={medClaude ? "aktiv" : "kontur"}>
      <Ikon className="size-3.5" aria-hidden />
      {medClaude ? `Claude — ${status.model}` : "Eksempelsvar"}
    </Badge>
  );
}

export function NoegleFelt({
  status,
  onStatus,
}: {
  status: Status | null;
  onStatus: (status: Status) => void;
}) {
  const [tekst, setTekst] = useState("");
  const [gemning, setGemning] = useState<Gemning>({ status: "klar" });

  async function gem(e: FormEvent) {
    e.preventDefault();
    if (!tekst.trim() || gemning.status === "gemmer") return;

    setGemning({ status: "gemmer" });
    try {
      const respons = await fetch("/api/noegle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noegle: tekst.trim() }),
      });
      const krop = (await respons.json()) as NoegleSvar | { fejl: string };

      if ("fejl" in krop) {
        setGemning({ status: "fejl", besked: krop.fejl });
      } else {
        onStatus(krop.status);
        setTekst("");
        setGemning({ status: "gemt", advarsel: krop.advarsel });
      }
    } catch (e) {
      setGemning({
        status: "fejl",
        besked: e instanceof Error ? e.message : "Ukendt fejl",
      });
    }
  }

  const gemmer = gemning.status === "gemmer";

  return (
    <div className="flex w-full flex-col gap-1.5 md:w-auto md:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={gem} className="flex items-center gap-2">
          <KeyRound className="size-4 shrink-0 text-pka-roed" aria-hidden />
          <Input
            type="password"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            disabled={gemmer}
            autoComplete="off"
            spellCheck={false}
            className="w-56 font-mono"
            placeholder={status?.noegleMaske ?? "sk-ant-..."}
            aria-label="Anthropic API-nøgle"
          />
          <Button type="submit" variant="sekundaer" size="sm" disabled={gemmer || !tekst.trim()}>
            {gemmer ? "Gemmer…" : "Gem nøgle"}
          </Button>
        </form>
        <StatusMaerkat status={status} />
      </div>

      <p className="max-w-[64ch] text-xs text-muted-foreground md:text-right">
        {gemning.status === "fejl" ? (
          <span className="inline-flex items-start gap-1.5 text-pka-roed">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {gemning.besked}
          </span>
        ) : gemning.status === "gemt" ? (
          <span className="inline-flex items-start gap-1.5">
            <Check className="mt-0.5 size-3.5 shrink-0 text-pka-rubin" aria-hidden />
            {gemning.advarsel ?? "Nøglen er gemt i .env og er i brug nu. Ingen genstart nødvendig."}
          </span>
        ) : (
          (status?.begrundelse ?? "Henter tilstand…")
        )}
      </p>
    </div>
  );
}
