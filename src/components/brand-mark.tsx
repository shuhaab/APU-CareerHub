import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)} aria-label="APU CareerHub home">
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-xs font-black tracking-tight text-white shadow-sm">
        APU
        <span className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-bold tracking-tight text-foreground">CareerHub</span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Campus employment
          </span>
        </span>
      )}
    </Link>
  );
}
