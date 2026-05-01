import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <main className="relative isolate flex flex-1 flex-col items-center justify-center gap-20 overflow-hidden bg-background px-4 py-16 sm:gap-28 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-14%] top-[-35%] h-[460px] w-[520px] rounded-full bg-accent/55 blur-[120px]" />
        <div className="absolute bottom-[-26%] right-[-22%] h-[460px] w-[460px] rounded-full bg-muted/90 blur-[100px]" />
      </div>
      <article className="mx-auto max-w-3xl space-y-8 text-center sm:space-y-10">
        <span className="inline-flex rounded-full border border-primary/35 bg-muted/65 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          Phase 2 · Frontend
        </span>
        <div className="space-y-5 animate-in fade-in-0 zoom-in-95">
          <h1 className="text-pretty text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            Tailored CV &amp; letter studio
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
            Pair your truthful profile data with job context, invoke the FastAPI assistant for each artifact separately,
            preview in a distraction-free pane, then copy or export text and PDF—all without bouncing between terminals.
          </p>
        </div>
        <Link
          href="/workspace"
          aria-label="Start composing tailored documents"
          className={cn(
            buttonVariants({ size: "lg" }),
            "group inline-flex h-11 rounded-full px-10 text-[0.95rem] tracking-tight"
          )}
        >
          Start
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </article>
        <footer className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
        <p>Phase-tracked workspaces now pair regenerated assets with Postgres-backed trackers.</p>
        <Link
          href="/dashboard"
          className="font-semibold underline-offset-4 hover:text-foreground hover:underline"
        >
          Open application dashboard →
        </Link>
      </footer>
    </main>
  );
}
