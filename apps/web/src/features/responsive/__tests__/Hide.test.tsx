import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hide } from "../components/Hide";

// Mock the useBreakpoint hook
vi.mock("../hooks/useBreakpoint", () => ({
  useBreakpoint: vi.fn(),
}));

import { useBreakpoint } from "../hooks/useBreakpoint";

describe("Hide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should hide children on mobile when on='mobile'", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(
      <Hide on="mobile">
        <div>Hidden on mobile</div>
      </Hide>
    );

    expect(screen.queryByText("Hidden on mobile")).not.toBeInTheDocument();
  });

  it("should show children on tablet when on='mobile'", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    render(
      <Hide on="mobile">
        <div>Hidden on mobile</div>
      </Hide>
    );

    expect(screen.getByText("Hidden on mobile")).toBeInTheDocument();
  });

  it("should hide children on tablet when on='tablet'", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    render(
      <Hide on="tablet">
        <div>Hidden on tablet</div>
      </Hide>
    );

    expect(screen.queryByText("Hidden on tablet")).not.toBeInTheDocument();
  });

  it("should hide children on desktop when on='desktop'", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(
      <Hide on="desktop">
        <div>Hidden on desktop</div>
      </Hide>
    );

    expect(screen.queryByText("Hidden on desktop")).not.toBeInTheDocument();
  });

  it("should hide children on mobile and tablet when on=['mobile', 'tablet']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(
      <Hide on={["mobile", "tablet"]}>
        <div>Hidden on mobile and tablet</div>
      </Hide>
    );

    expect(
      screen.queryByText("Hidden on mobile and tablet")
    ).not.toBeInTheDocument();
  });

  it("should hide children on tablet when on=['mobile', 'tablet']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    render(
      <Hide on={["mobile", "tablet"]}>
        <div>Hidden on mobile and tablet</div>
      </Hide>
    );

    expect(
      screen.queryByText("Hidden on mobile and tablet")
    ).not.toBeInTheDocument();
  });

  it("should show children on desktop when on=['mobile', 'tablet']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(
      <Hide on={["mobile", "tablet"]}>
        <div>Hidden on mobile and tablet</div>
      </Hide>
    );

    expect(screen.getByText("Hidden on mobile and tablet")).toBeInTheDocument();
  });

  it("should hide children on all breakpoints when on=['mobile', 'tablet', 'desktop']", () => {
    const breakpoints = [
      {
        breakpoint: "mobile" as const,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      },
      {
        breakpoint: "tablet" as const,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      },
      {
        breakpoint: "desktop" as const,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      },
    ];

    breakpoints.forEach((bp) => {
      vi.mocked(useBreakpoint).mockReturnValue(bp);

      const { unmount } = render(
        <Hide on={["mobile", "tablet", "desktop"]}>
          <div>Hidden on all breakpoints</div>
        </Hide>
      );

      expect(
        screen.queryByText("Hidden on all breakpoints")
      ).not.toBeInTheDocument();
      unmount();
    });
  });

  it("should handle complex children elements", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(
      <Hide on="mobile">
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </div>
      </Hide>
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("should handle JSX fragments as children", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(
      <Hide on="mobile">
        <>
          <div>First</div>
          <div>Second</div>
        </>
      </Hide>
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("should hide children on tablet and desktop when on=['tablet', 'desktop']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    render(
      <Hide on={["tablet", "desktop"]}>
        <div>Hidden on tablet and desktop</div>
      </Hide>
    );

    expect(
      screen.queryByText("Hidden on tablet and desktop")
    ).not.toBeInTheDocument();
  });

  it("should show children on mobile when on=['tablet', 'desktop']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(
      <Hide on={["tablet", "desktop"]}>
        <div>Hidden on tablet and desktop</div>
      </Hide>
    );

    expect(
      screen.getByText("Hidden on tablet and desktop")
    ).toBeInTheDocument();
  });

  it("should show children when hiding on different breakpoint", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(
      <Hide on="mobile">
        <div>Visible on desktop</div>
      </Hide>
    );

    expect(screen.getByText("Visible on desktop")).toBeInTheDocument();
  });
});
