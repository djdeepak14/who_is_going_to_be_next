export default function Loading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading sign in form...</span>
      <div className="paper-panel w-full max-w-md rounded-3xl p-8 space-y-4">
        <div className="skeleton-shimmer mx-auto h-8 w-1/2" />
        <div className="skeleton-shimmer h-11 w-full" />
        <div className="skeleton-shimmer h-11 w-full" />
        <div className="skeleton-shimmer h-11 w-full" />
      </div>
    </div>
  );
}
