type SkeletonBlockProps = {
  className?: string;
  delayMs?: number;
};

function SkeletonBlock({ className = "", delayMs = 0 }: SkeletonBlockProps) {
  return (
    <div className={`skeleton-shimmer ${className}`} style={{ animationDelay: `${delayMs}ms` }} />
  );
}

export function HomeGridSkeleton() {
  return (
    <div className="space-y-10" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading content...</span>
      <div className="form-card flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="w-full max-w-2xl space-y-3">
          <SkeletonBlock className="h-11 w-64" />
          <SkeletonBlock className="h-4 w-full" delayMs={60} />
          <SkeletonBlock className="h-4 w-10/12" delayMs={90} />
          <SkeletonBlock className="h-9 w-36 mt-4" delayMs={120} />
        </div>
        <div className="w-full md:w-auto flex flex-col md:items-end gap-3">
          <SkeletonBlock className="h-11 w-full md:w-40" delayMs={70} />
          <SkeletonBlock className="h-11 w-full md:w-80" delayMs={110} />
        </div>
      </div>

      <div className="card-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <article key={i} className="paper-panel rounded-3xl overflow-hidden">
            <SkeletonBlock className="h-64 w-full rounded-none" delayMs={i * 35} />
            <div className="p-6 space-y-3">
              <SkeletonBlock className="h-7 w-3/4" delayMs={i * 35 + 40} />
              <SkeletonBlock className="h-4 w-2/5" delayMs={i * 35 + 70} />
              <SkeletonBlock className="h-4 w-full" delayMs={i * 35 + 100} />
              <SkeletonBlock className="h-4 w-5/6" delayMs={i * 35 + 120} />
            </div>
            <div className="p-6 border-t border-outline-variant/20 flex justify-between items-center">
              <div className="flex gap-2">
                <SkeletonBlock className="h-8 w-20" delayMs={i * 35 + 140} />
                <SkeletonBlock className="h-8 w-20" delayMs={i * 35 + 170} />
              </div>
              <SkeletonBlock className="h-4 w-16" delayMs={i * 35 + 190} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ArresteeDetailSkeleton() {
  return (
    <div className="pt-10 pb-16" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading content...</span>
      <div className="w-full min-h-[320px] paper-panel overflow-hidden flex flex-col lg:flex-row">
        <SkeletonBlock className="w-full lg:w-2/5 min-h-[400px] rounded-none" />
        <div className="flex-1 p-6 lg:p-12 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <SkeletonBlock className="h-10 w-3/5" delayMs={60} />
              <SkeletonBlock className="h-5 w-2/5" delayMs={90} />
              <SkeletonBlock className="h-4 w-24" delayMs={120} />
            </div>
            <div className="flex gap-2 pt-1">
              <SkeletonBlock className="h-7 w-14" delayMs={90} />
              <SkeletonBlock className="h-7 w-16" delayMs={120} />
            </div>
          </div>
          <div className="rounded-xl bg-surface-container-low p-6 space-y-3">
            <SkeletonBlock className="h-10 w-3/5" />
            <SkeletonBlock className="h-5 w-11/12" delayMs={30} />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-full" delayMs={60} />
            <SkeletonBlock className="h-4 w-10/12" delayMs={90} />
            <SkeletonBlock className="h-4 w-9/12" delayMs={120} />
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
            <div className="flex gap-3">
              <SkeletonBlock className="h-10 w-24" delayMs={150} />
              <SkeletonBlock className="h-10 w-24" delayMs={180} />
            </div>
            <SkeletonBlock className="h-5 w-28" delayMs={210} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-12" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading content...</span>
      <div className="form-card space-y-6">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-4 w-3/4" delayMs={60} />

        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-32" delayMs={80} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonBlock className="h-12 w-full" delayMs={100} />
            <SkeletonBlock className="h-12 w-full" delayMs={130} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonBlock className="h-12 w-full" delayMs={150} />
            <SkeletonBlock className="h-12 w-full" delayMs={180} />
            <SkeletonBlock className="h-12 w-full" delayMs={210} />
          </div>
        </div>

        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-32" delayMs={230} />
          <SkeletonBlock className="h-28 w-full" delayMs={260} />
          <SkeletonBlock className="h-28 w-full" delayMs={290} />
        </div>

        <div className="space-y-3">
          <SkeletonBlock className="h-4 w-36" delayMs={320} />
          <SkeletonBlock className="h-28 w-full" delayMs={350} />
          <SkeletonBlock className="h-16 w-full" delayMs={380} />
        </div>

        <SkeletonBlock className="h-12 w-full" delayMs={410} />
      </div>
    </div>
  );
}

export function PollsListSkeleton() {
  return (
    <div className="pt-10" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading content...</span>
      <div className="form-card mb-12 text-center max-w-4xl mx-auto space-y-4">
        <SkeletonBlock className="h-6 w-32 mx-auto" />
        <SkeletonBlock className="h-12 w-3/4 max-w-2xl mx-auto" delayMs={60} />
        <SkeletonBlock className="h-4 w-2/3 max-w-lg mx-auto" delayMs={90} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <article key={i} className="paper-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <SkeletonBlock className="h-7 w-3/4" delayMs={i * 50 + 30} />
                <SkeletonBlock className="h-5 w-20" delayMs={i * 50 + 60} />
              </div>
              <SkeletonBlock className="h-9 w-full" delayMs={i * 50 + 90} />
              <SkeletonBlock className="h-9 w-full" delayMs={i * 50 + 120} />
              <SkeletonBlock className="h-9 w-5/6" delayMs={i * 50 + 150} />
              <SkeletonBlock className="h-8 w-28" delayMs={i * 50 + 180} />
            </article>
          ))}
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl p-6 bg-surface-container-high space-y-3 border border-outline-variant/40">
            <SkeletonBlock className="h-8 w-8" delayMs={120} />
            <SkeletonBlock className="h-6 w-2/3" delayMs={150} />
            <SkeletonBlock className="h-4 w-full" delayMs={180} />
            <SkeletonBlock className="h-10 w-full" delayMs={210} />
          </div>
          <SkeletonBlock className="h-6 w-full" delayMs={240} />
        </aside>
      </div>
    </div>
  );
}

export function PollDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-12" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading content...</span>
      <div className="mb-12 flex items-start justify-between gap-4">
        <SkeletonBlock className="h-10 w-3/4" />
        <SkeletonBlock className="h-10 w-32" delayMs={50} />
      </div>

      <div className="form-card mb-6 space-y-3">
        <SkeletonBlock className="h-7 w-40" delayMs={80} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SkeletonBlock className="h-12 w-full" delayMs={110} />
          <SkeletonBlock className="h-12 w-full" delayMs={140} />
          <SkeletonBlock className="h-12 w-full" delayMs={170} />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <SkeletonBlock className="h-4 w-1/3" delayMs={i * 40 + 200} />
              <SkeletonBlock className="h-4 w-12" delayMs={i * 40 + 230} />
            </div>
            <SkeletonBlock className="h-16 w-full" delayMs={i * 40 + 260} />
          </div>
        ))}
      </div>
    </div>
  );
}
