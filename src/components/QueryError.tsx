import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";

export function QueryError({
  what,
  error,
  onRetry,
}: {
  what: string;
  error: unknown;
  onRetry?: () => void;
}) {
  const detail = error instanceof Error ? error.message : String(error ?? "Request failed");

  return (
    <Banner
      status="error"
      title={`Unable to load ${what}`}
      description={detail}
      endContent={
        onRetry ? (
          <Button label="Retry" size="sm" variant="secondary" onClick={onRetry} />
        ) : undefined
      }
    />
  );
}
