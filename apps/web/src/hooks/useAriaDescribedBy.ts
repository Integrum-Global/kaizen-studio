/**
 * Hook for generating unique IDs for ARIA describedby relationships
 */
import { useId } from "react";

export function useAriaDescribedBy(hasDescription: boolean, hasError: boolean) {
  const baseId = useId();

  const descriptionId = hasDescription ? `${baseId}-description` : undefined;
  const errorId = hasError ? `${baseId}-error` : undefined;

  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return {
    describedBy,
    descriptionId,
    errorId,
  };
}
