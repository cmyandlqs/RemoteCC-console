import { useState, useEffect, useCallback, useRef } from "react";

export type LatencyLevel = "healthy" | "moderate" | "poor" | "unknown";

export type LatencyState = {
  rtt: number | null;
  level: LatencyLevel;
};

function classifyLatency(rtt: number | null): LatencyLevel {
  if (rtt == null) return "unknown";
  if (rtt < 150) return "healthy";
  if (rtt < 400) return "moderate";
  return "poor";
}

export function useLatency(pingFn: () => Promise<unknown>, intervalMs = 15_000) {
  const [state, setState] = useState<LatencyState>({ rtt: null, level: "unknown" });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const measure = useCallback(async () => {
    const start = performance.now();
    try {
      await pingFn();
      const rtt = Math.round(performance.now() - start);
      setState({ rtt, level: classifyLatency(rtt) });
    } catch {
      setState({ rtt: null, level: "unknown" });
    }
  }, [pingFn]);

  useEffect(() => {
    measure();
    timerRef.current = setInterval(measure, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [measure, intervalMs]);

  return state;
}
