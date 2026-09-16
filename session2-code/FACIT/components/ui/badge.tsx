import * as React from "react";
import { cn } from "@/lib/utils";

const varianter = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-muted text-foreground border border-border",
  outline: "border border-border text-muted-foreground",
  success: "bg-leaf/25 text-[#305e44]",
  warning: "bg-yellow/30 text-[#6b4a08]",
  destructive: "bg-powder/30 text-[#7a2b1f]",
};

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof varianter }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", varianter[variant], className)} {...props} />;
}
