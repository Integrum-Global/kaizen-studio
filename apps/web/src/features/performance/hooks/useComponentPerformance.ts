import { useCallback, useEffect, useRef, useState } from "react";
import { markPerformance, measureBetweenMarks } from "../utils";

/**
 * Hook for measuring component render and mount performance
 *
 * @example
 * ```tsx
 * function ExpensiveComponent() {
 *   const { renderTime, mountTime } = useComponentPerformance('ExpensiveComponent');
 *
 *   // Component will track:
 *   // - Time from render start to mount completion
 *   // - Each subsequent render time
 *
 *   return <div>Render time: {renderTime}ms</div>;
 * }
 * ```
 */
export function useComponentPerformance(componentName: string) {
  const renderStartRef = useRef<number>(performance.now());
  const mountTimeRef = useRef<number | null>(null);
  const renderCountRef = useRef(0);

  // Mark render start
  const renderStart = performance.now();
  renderStartRef.current = renderStart;
  renderCountRef.current += 1;

  useEffect(() => {
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStartRef.current;

    // Mark first mount
    if (mountTimeRef.current === null) {
      mountTimeRef.current = renderTime;
      markPerformance(`${componentName}-mounted`);

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Performance] ${componentName} mounted in ${renderTime.toFixed(2)}ms`
        );
      }
    } else if (process.env.NODE_ENV === "development" && renderTime > 16) {
      // Log slow re-renders (> 16ms = dropped frame)
      console.warn(
        `[Performance] ${componentName} slow re-render: ${renderTime.toFixed(2)}ms (render #${renderCountRef.current})`
      );
    }
  });

  return {
    renderTime: performance.now() - renderStartRef.current,
    mountTime: mountTimeRef.current,
    renderCount: renderCountRef.current,
  };
}

/**
 * Hook for measuring async operation performance
 *
 * @example
 * ```tsx
 * function DataFetcher() {
 *   const { startMeasure, endMeasure, duration } = useAsyncPerformance('fetchUsers');
 *
 *   const fetchData = async () => {
 *     startMeasure();
 *     try {
 *       await api.fetchUsers();
 *     } finally {
 *       endMeasure();
 *     }
 *   };
 *
 *   return <div>Last fetch took: {duration}ms</div>;
 * }
 * ```
 */
export function useAsyncPerformance(operationName: string) {
  const startTimeRef = useRef<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const startMeasure = useCallback(() => {
    startTimeRef.current = performance.now();
    setIsRunning(true);
    markPerformance(`${operationName}-start`);
  }, [operationName]);

  const endMeasure = useCallback(() => {
    if (startTimeRef.current !== null) {
      const endTime = performance.now();
      const measuredDuration = endTime - startTimeRef.current;
      setDuration(measuredDuration);
      setIsRunning(false);
      markPerformance(`${operationName}-end`);

      measureBetweenMarks(
        operationName,
        `${operationName}-start`,
        `${operationName}-end`
      );

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Performance] ${operationName} completed in ${measuredDuration.toFixed(2)}ms`
        );
      }

      startTimeRef.current = null;
    }
  }, [operationName]);

  return {
    startMeasure,
    endMeasure,
    duration,
    isRunning,
  };
}
