import { describe, it, expect } from "vitest";
import * as LoadingModule from "../index";

describe("Loading Module Exports", () => {
  it("exports Skeleton component", () => {
    expect(LoadingModule.Skeleton).toBeDefined();
  });

  it("exports SkeletonText component", () => {
    expect(LoadingModule.SkeletonText).toBeDefined();
  });

  it("exports SkeletonCard component", () => {
    expect(LoadingModule.SkeletonCard).toBeDefined();
  });

  it("exports SkeletonTable component", () => {
    expect(LoadingModule.SkeletonTable).toBeDefined();
  });

  it("exports SkeletonList component", () => {
    expect(LoadingModule.SkeletonList).toBeDefined();
  });

  it("exports SkeletonForm component", () => {
    expect(LoadingModule.SkeletonForm).toBeDefined();
  });

  it("exports PageSkeleton component", () => {
    expect(LoadingModule.PageSkeleton).toBeDefined();
  });

  it("exports all expected components", () => {
    const expectedExports = [
      "Skeleton",
      "SkeletonText",
      "SkeletonCard",
      "SkeletonTable",
      "SkeletonList",
      "SkeletonForm",
      "PageSkeleton",
    ];

    expectedExports.forEach((exportName) => {
      expect(LoadingModule).toHaveProperty(exportName);
    });
  });

  it("components are functions", () => {
    expect(typeof LoadingModule.Skeleton).toBe("function");
    expect(typeof LoadingModule.SkeletonText).toBe("function");
    expect(typeof LoadingModule.SkeletonCard).toBe("function");
    expect(typeof LoadingModule.SkeletonTable).toBe("function");
    expect(typeof LoadingModule.SkeletonList).toBe("function");
    expect(typeof LoadingModule.SkeletonForm).toBe("function");
    expect(typeof LoadingModule.PageSkeleton).toBe("function");
  });
});
