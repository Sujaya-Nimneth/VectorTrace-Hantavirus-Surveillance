import { AlertTriangle, RotateCw } from "lucide-react";

/** Inline error banner shown when a surveillance query fails, with a retry action. */
export function QueryError({
  what,
  error,
  onRetry,
}: {
  what: string;
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-md border border-alert/30 bg-alert/10 px-4 py-3 text-[12.5px] text-alert"
    >
      <AlertTriangle className="size-4 shrink-0" />
      <span className="flex-1 min-w-40">
        Couldn&apos;t load {what}
        {error instanceof Error && error.message ? ` — ${error.message}` : ""}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-md border border-alert/40 px-2.5 py-1 text-[12px] font-semibold hover:bg-alert/15"
        >
          <RotateCw className="size-3" /> Retry
        </button>
      )}
    </div>
  );
}
