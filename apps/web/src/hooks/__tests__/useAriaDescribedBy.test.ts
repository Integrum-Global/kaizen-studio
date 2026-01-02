import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAriaDescribedBy } from "../useAriaDescribedBy";

describe("useAriaDescribedBy", () => {
  it("should return undefined describedBy when no description or error", () => {
    const { result } = renderHook(() => useAriaDescribedBy(false, false));

    expect(result.current.describedBy).toBeUndefined();
    expect(result.current.descriptionId).toBeUndefined();
    expect(result.current.errorId).toBeUndefined();
  });

  it("should generate descriptionId when hasDescription is true", () => {
    const { result } = renderHook(() => useAriaDescribedBy(true, false));

    expect(result.current.descriptionId).toBeDefined();
    expect(result.current.descriptionId).toMatch(/-description$/);
    expect(result.current.errorId).toBeUndefined();
    expect(result.current.describedBy).toBe(result.current.descriptionId);
  });

  it("should generate errorId when hasError is true", () => {
    const { result } = renderHook(() => useAriaDescribedBy(false, true));

    expect(result.current.errorId).toBeDefined();
    expect(result.current.errorId).toMatch(/-error$/);
    expect(result.current.descriptionId).toBeUndefined();
    expect(result.current.describedBy).toBe(result.current.errorId);
  });

  it("should generate both IDs when hasDescription and hasError are true", () => {
    const { result } = renderHook(() => useAriaDescribedBy(true, true));

    expect(result.current.descriptionId).toBeDefined();
    expect(result.current.errorId).toBeDefined();
    expect(result.current.describedBy).toContain(result.current.descriptionId);
    expect(result.current.describedBy).toContain(result.current.errorId);
  });

  it("should separate multiple IDs with space in describedBy", () => {
    const { result } = renderHook(() => useAriaDescribedBy(true, true));

    const ids = result.current.describedBy?.split(" ");
    expect(ids?.length).toBe(2);
    expect(ids?.[0]).toBe(result.current.descriptionId);
    expect(ids?.[1]).toBe(result.current.errorId);
  });

  it("should generate unique IDs across multiple instances", () => {
    const { result: result1 } = renderHook(() =>
      useAriaDescribedBy(true, true)
    );
    const { result: result2 } = renderHook(() =>
      useAriaDescribedBy(true, true)
    );

    expect(result1.current.descriptionId).not.toBe(
      result2.current.descriptionId
    );
    expect(result1.current.errorId).not.toBe(result2.current.errorId);
  });

  it("should maintain stable IDs across re-renders", () => {
    const { result, rerender } = renderHook(
      ({ hasDesc, hasErr }) => useAriaDescribedBy(hasDesc, hasErr),
      {
        initialProps: { hasDesc: true, hasErr: true },
      }
    );

    const initialDescriptionId = result.current.descriptionId;
    const initialErrorId = result.current.errorId;

    rerender({ hasDesc: true, hasErr: true });

    expect(result.current.descriptionId).toBe(initialDescriptionId);
    expect(result.current.errorId).toBe(initialErrorId);
  });

  it("should update IDs when props change", () => {
    const { result, rerender } = renderHook(
      ({ hasDesc, hasErr }) => useAriaDescribedBy(hasDesc, hasErr),
      {
        initialProps: { hasDesc: false, hasErr: false },
      }
    );

    expect(result.current.describedBy).toBeUndefined();

    rerender({ hasDesc: true, hasErr: false });

    expect(result.current.descriptionId).toBeDefined();
    expect(result.current.describedBy).toBe(result.current.descriptionId);
  });

  it("should handle transition from description to error", () => {
    const { result, rerender } = renderHook(
      ({ hasDesc, hasErr }) => useAriaDescribedBy(hasDesc, hasErr),
      {
        initialProps: { hasDesc: true, hasErr: false },
      }
    );

    const initialDescriptionId = result.current.descriptionId;
    expect(result.current.describedBy).toBe(initialDescriptionId);

    rerender({ hasDesc: true, hasErr: true });

    expect(result.current.descriptionId).toBe(initialDescriptionId);
    expect(result.current.errorId).toBeDefined();
    expect(result.current.describedBy).toContain(initialDescriptionId);
    expect(result.current.describedBy).toContain(result.current.errorId!);
  });

  it("should format IDs consistently", () => {
    const { result } = renderHook(() => useAriaDescribedBy(true, true));

    // IDs should end with -description or -error
    expect(result.current.descriptionId).toMatch(/-description$/);
    expect(result.current.errorId).toMatch(/-error$/);

    // Both IDs should share the same base
    const baseId = result.current.descriptionId?.replace("-description", "");
    const errorBaseId = result.current.errorId?.replace("-error", "");

    expect(baseId).toBe(errorBaseId);
    expect(baseId).toBeDefined();
  });
});
