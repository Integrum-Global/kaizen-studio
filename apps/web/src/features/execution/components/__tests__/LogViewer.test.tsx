import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { LogViewer } from "../LogViewer";
import type { ExecutionLog } from "../../types";

describe("LogViewer", () => {
  const createMockLog = (overrides?: Partial<ExecutionLog>): ExecutionLog => ({
    id: `log-${Math.random()}`,
    timestamp: new Date(),
    level: "info",
    message: "Test log message",
    ...overrides,
  });

  it("should render empty state when no logs", () => {
    renderWithProviders(<LogViewer logs={[]} />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("No logs yet")).toBeInTheDocument();
  });

  it("should render logs correctly", () => {
    const logs = [
      createMockLog({ message: "First log", level: "info" }),
      createMockLog({ message: "Second log", level: "warn" }),
      createMockLog({ message: "Third log", level: "error" }),
    ];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("First log")).toBeInTheDocument();
    expect(screen.getByText("Second log")).toBeInTheDocument();
    expect(screen.getByText("Third log")).toBeInTheDocument();
  });

  it("should display log level badges", () => {
    const logs = [
      createMockLog({ level: "info" }),
      createMockLog({ level: "warn" }),
      createMockLog({ level: "error" }),
      createMockLog({ level: "debug" }),
    ];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("INFO")).toBeInTheDocument();
    expect(screen.getByText("WARN")).toBeInTheDocument();
    expect(screen.getByText("ERROR")).toBeInTheDocument();
    expect(screen.getByText("DEBUG")).toBeInTheDocument();
  });

  it("should display node ID when present", () => {
    const logs = [createMockLog({ message: "Node log", nodeId: "node-123" })];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("node-123")).toBeInTheDocument();
  });

  it("should display log data when present", () => {
    const logs = [
      createMockLog({
        message: "Log with data",
        data: { key: "value", count: 42 },
      }),
    ];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();
    expect(screen.getByText(/"count": 42/)).toBeInTheDocument();
  });

  it("should filter logs by search query", async () => {
    const user = userEvent.setup();
    const logs = [
      createMockLog({ message: "First message" }),
      createMockLog({ message: "Second message" }),
      createMockLog({ message: "Third message" }),
    ];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    const searchInput = screen.getByPlaceholderText("Search logs...");
    await user.type(searchInput, "Second");

    expect(screen.getByText("Second message")).toBeInTheDocument();
    expect(screen.queryByText("First message")).not.toBeInTheDocument();
    expect(screen.queryByText("Third message")).not.toBeInTheDocument();

    // Check filtered count
    expect(screen.getByText("1 of 3 logs")).toBeInTheDocument();
  });

  it("should filter logs by level", async () => {
    const user = userEvent.setup();
    const logs = [
      createMockLog({ message: "Info log", level: "info" }),
      createMockLog({ message: "Error log", level: "error" }),
      createMockLog({ message: "Another error", level: "error" }),
    ];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    // Click error filter
    await user.click(screen.getByRole("button", { name: /error/i }));

    expect(screen.getByText("Error log")).toBeInTheDocument();
    expect(screen.getByText("Another error")).toBeInTheDocument();
    expect(screen.queryByText("Info log")).not.toBeInTheDocument();

    expect(screen.getByText("2 of 3 logs")).toBeInTheDocument();
  });

  it("should allow multiple level filters", async () => {
    const user = userEvent.setup();
    const logs = [
      createMockLog({ message: "Info log", level: "info" }),
      createMockLog({ message: "Warn log", level: "warn" }),
      createMockLog({ message: "Error log", level: "error" }),
      createMockLog({ message: "Debug log", level: "debug" }),
    ];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    // Select info and warn
    await user.click(screen.getByRole("button", { name: /^info$/i }));
    await user.click(screen.getByRole("button", { name: /^warn$/i }));

    expect(screen.getByText("Info log")).toBeInTheDocument();
    expect(screen.getByText("Warn log")).toBeInTheDocument();
    expect(screen.queryByText("Error log")).not.toBeInTheDocument();
    expect(screen.queryByText("Debug log")).not.toBeInTheDocument();

    expect(screen.getByText("2 of 4 logs")).toBeInTheDocument();
  });

  it("should toggle level filter on/off", async () => {
    const user = userEvent.setup();
    const logs = [
      createMockLog({ message: "Info log", level: "info" }),
      createMockLog({ message: "Error log", level: "error" }),
    ];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    // Enable error filter
    await user.click(screen.getByRole("button", { name: /error/i }));
    expect(screen.queryByText("Info log")).not.toBeInTheDocument();

    // Disable error filter
    await user.click(screen.getByRole("button", { name: /error/i }));
    expect(screen.getByText("Info log")).toBeInTheDocument();
  });

  it("should clear all filters", async () => {
    const user = userEvent.setup();
    const logs = [
      createMockLog({ message: "Info log", level: "info" }),
      createMockLog({ message: "Error log", level: "error" }),
    ];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    // Apply search
    await user.type(screen.getByPlaceholderText("Search logs..."), "Error");

    // Apply level filter
    await user.click(screen.getByRole("button", { name: /error/i }));

    // Clear all filters
    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(screen.getByText("Info log")).toBeInTheDocument();
    expect(screen.getByText("Error log")).toBeInTheDocument();
    expect(screen.getByText("2 of 2 logs")).toBeInTheDocument();
  });

  it("should show 'no logs match filters' when filtered to empty", async () => {
    const user = userEvent.setup();
    const logs = [createMockLog({ message: "Info log", level: "info" })];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    await user.type(
      screen.getByPlaceholderText("Search logs..."),
      "nonexistent"
    );

    expect(screen.getByText("No logs match your filters")).toBeInTheDocument();
  });

  it("should call onLogClick when log is clicked", async () => {
    const user = userEvent.setup();
    const onLogClick = vi.fn();
    const logs = [createMockLog({ message: "Clickable log" })];

    renderWithProviders(<LogViewer logs={logs} onLogClick={onLogClick} />, {
      queryClient: createTestQueryClient(),
    });

    await user.click(screen.getByText("Clickable log"));

    expect(onLogClick).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Clickable log",
      })
    );
  });

  it("should format timestamp correctly", () => {
    const timestamp = new Date("2024-01-01T12:34:56.789Z");
    const logs = [createMockLog({ timestamp })];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    // Check for time format (HH:mm:ss.SSS)
    expect(screen.getByText(/\d{2}:\d{2}:\d{2}\.\d{3}/)).toBeInTheDocument();
  });

  it("should toggle auto-scroll", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogViewer logs={[]} />, {
      queryClient: createTestQueryClient(),
    });

    const autoScrollButton = screen.getByRole("button", { name: /on/i });
    expect(autoScrollButton).toBeInTheDocument();

    await user.click(autoScrollButton);

    expect(screen.getByRole("button", { name: /off/i })).toBeInTheDocument();
  });

  it("should show clear filters button only when filters active", async () => {
    const user = userEvent.setup();
    const logs = [createMockLog({ level: "info" })];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    // No clear button initially
    expect(
      screen.queryByRole("button", { name: /clear/i })
    ).not.toBeInTheDocument();

    // Apply filter
    await user.click(screen.getByRole("button", { name: /info/i }));

    // Clear button appears
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("should apply combined search and level filters", async () => {
    const user = userEvent.setup();
    const logs = [
      createMockLog({ message: "Info message", level: "info" }),
      createMockLog({ message: "Error message", level: "error" }),
      createMockLog({ message: "Another error", level: "error" }),
    ];

    renderWithProviders(<LogViewer logs={logs} />, {
      queryClient: createTestQueryClient(),
    });

    // Apply level filter
    await user.click(screen.getByRole("button", { name: /error/i }));

    // Apply search
    await user.type(screen.getByPlaceholderText("Search logs..."), "message");

    // Should only show "Error message"
    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(screen.queryByText("Info message")).not.toBeInTheDocument();
    expect(screen.queryByText("Another error")).not.toBeInTheDocument();

    expect(screen.getByText("1 of 3 logs")).toBeInTheDocument();
  });
});
