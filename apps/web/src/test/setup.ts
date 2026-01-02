import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
});

// Mock ResizeObserver as a proper class
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
  takeRecords: vi.fn(),
}));

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock Element.hasPointerCapture (needed for Radix UI)
Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();

// Mock recharts - recharts doesn't render SVG in jsdom
vi.mock("recharts", () => {
  const React = require("react");
  return {
    ResponsiveContainer: ({ children }: any) =>
      React.createElement("div", { className: "recharts-wrapper" }, children),
    LineChart: ({ children }: any) =>
      React.createElement(
        "div",
        { className: "recharts-line-chart" },
        children
      ),
    BarChart: ({ children }: any) =>
      React.createElement("div", { className: "recharts-bar-chart" }, children),
    PieChart: ({ children }: any) =>
      React.createElement("div", { className: "recharts-pie-chart" }, children),
    Line: () => React.createElement("div", { className: "recharts-line" }),
    Bar: () => React.createElement("div", { className: "recharts-bar" }),
    Pie: () =>
      React.createElement(
        "div",
        { className: "recharts-pie" },
        React.createElement("div", { className: "recharts-pie-sector" })
      ),
    Cell: () => null,
    XAxis: () => React.createElement("div", { className: "recharts-xaxis" }),
    YAxis: () => React.createElement("div", { className: "recharts-yaxis" }),
    CartesianGrid: () =>
      React.createElement("div", { className: "recharts-cartesian-grid" }),
    Tooltip: () =>
      React.createElement("div", { className: "recharts-tooltip" }),
    Legend: () =>
      React.createElement("div", { className: "recharts-legend-wrapper" }),
    ReferenceLine: () =>
      React.createElement("div", { className: "recharts-reference-line" }),
    AreaChart: ({ children }: any) =>
      React.createElement("div", { className: "recharts-area-chart" }, children),
    Area: () => React.createElement("div", { className: "recharts-area" }),
    ComposedChart: ({ children }: any) =>
      React.createElement("div", { className: "recharts-composed-chart" }, children),
    RadarChart: ({ children }: any) =>
      React.createElement("div", { className: "recharts-radar-chart" }, children),
    Radar: () => React.createElement("div", { className: "recharts-radar" }),
    PolarGrid: () => React.createElement("div", { className: "recharts-polar-grid" }),
    PolarAngleAxis: () => React.createElement("div", { className: "recharts-polar-angle-axis" }),
    PolarRadiusAxis: () => React.createElement("div", { className: "recharts-polar-radius-axis" }),
  };
});

// Suppress console errors in tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   error: vi.fn(),
//   warn: vi.fn(),
// };
