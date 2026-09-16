import type { ComponentProps } from "react";

import { cn } from "../../lib/utils.ts";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-md border border-border bg-card px-3 py-2.5 text-sm",
        "placeholder:text-muted-foreground",
        "focus-visible:border-pka-rubin focus-visible:ring-2 focus-visible:ring-pka-rubin/30 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
