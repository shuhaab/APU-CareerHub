export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-6 sm:px-8" aria-label="Loading page" aria-busy="true">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#e8ebf2]" />
            <div className="space-y-2">
              <div className="h-3 w-28 rounded-full bg-[#dfe3ec]" />
              <div className="h-2.5 w-20 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="h-9 w-24 rounded-xl bg-[#e8ebf2]" />
        </div>

        <div className="mt-10 max-w-2xl space-y-4">
          <div className="h-3 w-32 rounded-full bg-rose-100" />
          <div className="h-9 w-4/5 rounded-xl bg-[#dfe3ec]" />
          <div className="h-4 w-full rounded-full bg-slate-200" />
          <div className="h-4 w-2/3 rounded-full bg-slate-200" />
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 rounded-2xl border border-slate-200 bg-white shadow-sm" />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div className="h-72 rounded-2xl border border-slate-200 bg-white shadow-sm" />
          <div className="h-72 rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </div>
        <p className="sr-only">Loading the latest portal information…</p>
      </div>
    </main>
  );
}
