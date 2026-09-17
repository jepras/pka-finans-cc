import { X } from "lucide-react";
import { useEffect, type ComponentProps, type ReactNode } from "react";

import { cn } from "../../lib/utils.ts";
import { Button } from "./button.tsx";

/**
 * Overlay med et panel i midten. Lukker på Escape og på klik uden for panelet.
 * Ingen ekstra afhængighed — komponenten følger shadcn-opdelingen, ikke dens kode.
 */
export function Dialog({
  aaben,
  onLuk,
  titel,
  beskrivelse,
  children,
}: {
  aaben: boolean;
  onLuk: () => void;
  titel: string;
  beskrivelse?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!aaben) return;

    const paaTast = (e: KeyboardEvent) => {
      if (e.key === "Escape") onLuk();
    };

    document.addEventListener("keydown", paaTast);
    const tidligere = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", paaTast);
      document.body.style.overflow = tidligere;
    };
  }, [aaben, onLuk]);

  if (!aaben) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pka-bordeaux/40 p-4 md:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onLuk();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titel}
        className="w-full max-w-[1200px] rounded-card border border-border bg-card shadow-lg"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-pka-bordeaux">{titel}</h2>
            {beskrivelse && <p className="mt-1 text-sm text-muted-foreground">{beskrivelse}</p>}
          </div>
          <Button variant="sekundaer" size="sm" onClick={onLuk} aria-label="Luk">
            <X className="size-4" aria-hidden />
            Luk
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DialogBody({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-8 px-6 py-6", className)} {...props} />;
}
