import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-colors uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        default: "border-border/70 bg-muted/60 text-foreground/85",
        success: "border-emerald-600/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        info: "border-sky-600/35 bg-sky-500/10 text-sky-800 dark:text-sky-200",
        warning: "border-amber-600/35 bg-amber-500/10 text-amber-950 dark:text-amber-200",
        destructive: "border-red-700/35 bg-red-600/15 text-red-900 dark:text-red-200",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
