import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../../lib/utils.ts";

const knapVarianter = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primaer: "bg-pka-roed text-white hover:bg-pka-bordeaux",
        sekundaer: "border border-border bg-card text-foreground hover:bg-muted",
        stille: "text-pka-roed hover:bg-muted",
      },
      size: {
        md: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "primaer",
      size: "md",
    },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof knapVarianter>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(knapVarianter({ variant, size }), className)} {...props} />;
}
