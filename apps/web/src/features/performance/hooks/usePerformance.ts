import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MetricName,
  PerformanceMetric,
  PerformanceReport,
} from "../types";
import { calculatePerformanceScore, initWebVitals } from "../utils";

/**
 * Hook for monitoring Web Vitals performance metrics
 *
 * @example
 * ```tsx
 * function App() {
 *   const { metrics, score, isCollecting } = usePerformance({
 *     debug: process.env.NODE_ENV === 'development'
 *   });
 *
 *   return (
 *     <div>
 *       <p>Performance Score: {score}</p>
 *       {metrics.LCP && <p>LCP: {metrics.LCP.value}ms</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformance(
  options: { debug?: boolean; reportEndpoint?: string } = {}
) {
  const [metrics, setMetrics] = useState<
    Partial<Record<MetricName, PerformanceMetric>>
  >({});
  const [isCollecting, setIsCollecting] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    initWebVitals({
      debug: options.debug,
      reportEndpoint: options.reportEndpoint,
      onMetric: (metric) => {
        setMetrics((prev) => ({
          ...prev,
          [metric.name]: metric,
        }));
      },
    });

    // Mark collection as complete after a short delay
    // Most critical metrics should be collected by then
    const timer = setTimeout(() => {
      setIsCollecting(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [options.debug, options.reportEndpoint]);

  const score = calculatePerformanceScore(metrics);

  const getReport = useCallback((): PerformanceReport => {
    return {
      timestamp: new Date(),
      url: window.location.href,
      metrics,
      score,
    };
  }, [metrics, score]);

  return {
    metrics,
    score,
    isCollecting,
    getReport,
  };
}
