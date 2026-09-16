import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("flex min-h-[72px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ruby disabled:opacity-50", className)}
      {...props}
    />
  );
}
