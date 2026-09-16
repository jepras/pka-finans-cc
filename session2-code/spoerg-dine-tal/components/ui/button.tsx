import * as React from "react";
import { cn } from "@/lib/utils";

const varianter = {
  default: "bg-primary text-primary-foreground hover:bg-bordeaux",
  secondary: "bg-muted text-foreground border border-border hover:bg-summer-grey/60",
  ghost: "hover:bg-muted text-foreground",
  outline: "border border-border bg-card hover:bg-muted",
};
const stoerrelser = { default: "h-9 px-4 text-sm", sm: "h-8 px-3 text-xs", lg: "h-10 px-6 text-sm" };

export function Button({ className, variant = "default", size = "default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof varianter; size?: keyof typeof stoerrelser }) {
  return (
    <button
      className={cn("inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-ruby", varianter[variant], stoerrelser[size], className)}
      {...props}
    />
  );
}
