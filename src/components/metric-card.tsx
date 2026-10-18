import type { LucideIcon } from "lucide-react";

export function MetricCard({ label, value, change, icon: Icon, accent = "navy" }: {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  accent?: "navy" | "pink" | "teal";
}) {
  const styles = {
    navy: "bg-[#eef1f7] text-[#24345c]",
    pink: "bg-rose-50 text-[#d91b62]",
    teal: "bg-cyan-50 text-cyan-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(35,52,92,0.04)]">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`grid size-9 place-items-center rounded-xl ${styles[accent]}`}><Icon className="size-4" /></span>
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-[#18233f]">{value}</div>
      <p className="mt-2 text-xs font-medium text-slate-400">{change}</p>
    </div>
  );
}
