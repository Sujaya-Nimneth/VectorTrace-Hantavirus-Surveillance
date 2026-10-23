import { useEffect, useState } from "react";

/**
 * A ticking `Date.now()` so time-window computations derived inside useMemo
 * don't silently go stale until the next data change.
 */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
