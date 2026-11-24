import { cn } from "@/lib/utils";

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const tam = { sm: "text-2xl", md: "text-3xl", lg: "text-7xl" }[size];
  const sub = { sm: "text-[9px] tracking-[0.45em]", md: "text-[10px] tracking-[0.5em]", lg: "text-xl tracking-[0.6em]" }[size];
  return (
    <div className={cn("select-none leading-none", className)} aria-label="RED SENSI PRO FF">
      <div className={cn("font-display font-bold uppercase", tam)}>
        <span className="neon-text">RED</span> <span className="text-foreground">SENSI</span>
      </div>
      <div className={cn("font-display uppercase text-muted-foreground", sub, size === "lg" ? "-mt-2" : "-mt-1")}>
        PRO FF
      </div>
    </div>
  );
}
