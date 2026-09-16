import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../../lib/utils.ts";

const badgeVarianter = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-border bg-muted text-muted-foreground",
        primaer: "border-transparent bg-pka-roed text-white",
        aktiv: "border-transparent bg-pka-rubin text-white",
        kontur: "border-pka-roed/30 bg-transparent text-pka-roed",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVarianter>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVarianter({ variant }), className)} {...props} />;
}
