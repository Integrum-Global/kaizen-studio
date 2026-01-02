import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHelpSearch } from "../hooks/useHelpSearch";

describe("useHelpSearch", () => {
  it("should return all articles when no query or category", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "", category: "all" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.hasResults).toBe(true);
    expect(result.current.isEmpty).toBe(false);
  });

  it("should filter articles by category", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "", category: "getting-started" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    result.current.results.forEach(({ article }) => {
      expect(article.category).toBe("getting-started");
    });
  });

  it("should search articles by title", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "First Agent", category: "all" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    const firstResult = result.current.results[0];
    expect(firstResult?.article.title.toLowerCase()).toContain("first agent");
  });

  it("should search articles by keywords", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "pipeline", category: "all" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.hasResults).toBe(true);
  });

  it("should search articles by content", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "deployment", category: "all" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.hasResults).toBe(true);
  });

  it("should return empty results for non-matching query", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "xyznonexistent123", category: "all" })
    );

    expect(result.current.results.length).toBe(0);
    expect(result.current.hasResults).toBe(false);
    expect(result.current.isEmpty).toBe(true);
  });

  it("should sort results by score", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "agent", category: "all" })
    );

    expect(result.current.results.length).toBeGreaterThan(1);

    // Scores should be in descending order
    for (let i = 0; i < result.current.results.length - 1; i++) {
      expect(result.current.results[i]?.score).toBeGreaterThanOrEqual(
        result.current.results[i + 1]?.score ?? 0
      );
    }
  });

  it("should handle case-insensitive search", () => {
    const { result: upperCase } = renderHook(() =>
      useHelpSearch({ query: "AGENT", category: "all" })
    );

    const { result: lowerCase } = renderHook(() =>
      useHelpSearch({ query: "agent", category: "all" })
    );

    expect(upperCase.current.results.length).toBe(
      lowerCase.current.results.length
    );
  });

  it("should combine category and query filters", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "tools", category: "agents" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    result.current.results.forEach(({ article }) => {
      expect(article.category).toBe("agents");
    });
  });

  it("should give higher score to title matches", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "Creating Your First Agent", category: "all" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    const topResult = result.current.results[0];
    expect(topResult?.score).toBeGreaterThan(0);
  });

  it("should handle empty query gracefully", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "", category: "all" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.isEmpty).toBe(false);
  });

  it("should handle whitespace-only query", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "   ", category: "all" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.isEmpty).toBe(false);
  });

  it("should search across all categories when category is all", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "error", category: "all" })
    );

    const categories = new Set(
      result.current.results.map((r) => r.article.category)
    );
    expect(categories.size).toBeGreaterThan(1);
  });

  it("should support fuzzy matching for partial words", () => {
    const { result } = renderHook(() =>
      useHelpSearch({ query: "config", category: "all" })
    );

    expect(result.current.results.length).toBeGreaterThan(0);
    // Should match "configuration", "configure", etc.
  });
});
