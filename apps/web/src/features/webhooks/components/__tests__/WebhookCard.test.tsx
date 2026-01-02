import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WebhookCard } from "../WebhookCard";
import type { Webhook } from "../../types";

describe("WebhookCard", () => {
  const createMockWebhook = (overrides?: Partial<Webhook>): Webhook => ({
    id: `webhook-${Math.random()}`,
    organization_id: "org-123",
    name: "Test Webhook",
    url: "https://example.com/webhook",
    events: ["agent.created", "agent.updated"],
    status: "active",
    failure_count: 0,
    created_by: "user-123",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnTest = vi.fn();
  const mockOnViewDeliveries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render webhook with basic information", () => {
    const webhook = createMockWebhook({
      name: "Production Webhook",
      url: "https://prod.example.com/webhook",
      status: "active",
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    expect(screen.getByText("Production Webhook")).toBeInTheDocument();
    expect(
      screen.getByText("https://prod.example.com/webhook")
    ).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("should render webhook icon", () => {
    const webhook = createMockWebhook();

    const { container } = render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should render active status badge with correct variant", () => {
    const webhook = createMockWebhook({
      status: "active",
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    const badge = screen.getByText("active");
    expect(badge).toBeInTheDocument();
  });

  it("should render inactive status badge with correct variant", () => {
    const webhook = createMockWebhook({
      status: "inactive",
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    const badge = screen.getByText("inactive");
    expect(badge).toBeInTheDocument();
  });

  it("should display failure count badge when failures exist", () => {
    const webhook = createMockWebhook({
      failure_count: 5,
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    expect(screen.getByText("5 failures")).toBeInTheDocument();
  });

  it("should not display failure count badge when no failures", () => {
    const webhook = createMockWebhook({
      failure_count: 0,
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    expect(screen.queryByText(/failures/)).not.toBeInTheDocument();
  });

  it("should display subscribed events", () => {
    const webhook = createMockWebhook({
      events: ["agent.created", "agent.updated", "agent.deleted"],
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    expect(screen.getByText("agent.created")).toBeInTheDocument();
    expect(screen.getByText("agent.updated")).toBeInTheDocument();
    expect(screen.getByText("agent.deleted")).toBeInTheDocument();
  });

  it("should not display events section when no events", () => {
    const webhook = createMockWebhook({
      events: [],
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    expect(screen.queryByText("Subscribed Events:")).not.toBeInTheDocument();
  });

  it("should display created date", () => {
    const webhook = createMockWebhook({
      created_at: "2024-01-15T10:30:00Z",
      events: [], // No events to avoid "agent.created" badge
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    expect(screen.getByText(/^Created/)).toBeInTheDocument();
  });

  it("should display last triggered date when available", () => {
    const webhook = createMockWebhook({
      last_triggered_at: "2024-01-20T10:30:00Z",
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    expect(screen.getByText(/Last triggered/i)).toBeInTheDocument();
  });

  it("should not display last triggered date when not available", () => {
    const webhook = createMockWebhook({
      last_triggered_at: undefined,
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    expect(screen.queryByText(/Last triggered/i)).not.toBeInTheDocument();
  });

  it("should call onTest when Test Webhook is clicked", async () => {
    const user = userEvent.setup();
    const webhook = createMockWebhook();

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Test Webhook (use getByRole for menu item)
    const testButton = screen.getByRole("menuitem", { name: /Test Webhook/i });
    await user.click(testButton);

    expect(mockOnTest).toHaveBeenCalledWith(webhook);
  });

  it("should call onViewDeliveries when View Deliveries is clicked", async () => {
    const user = userEvent.setup();
    const webhook = createMockWebhook();

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click View Deliveries
    const viewButton = screen.getByText("View Deliveries");
    await user.click(viewButton);

    expect(mockOnViewDeliveries).toHaveBeenCalledWith(webhook);
  });

  it("should call onEdit when Edit is clicked", async () => {
    const user = userEvent.setup();
    const webhook = createMockWebhook();

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Edit
    const editButton = screen.getByText("Edit");
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(webhook);
  });

  it("should call onDelete when Delete is clicked", async () => {
    const user = userEvent.setup();
    const webhook = createMockWebhook();

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Delete
    const deleteButton = screen.getByText("Delete");
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(webhook.id);
  });

  it("should apply hover styles to card", () => {
    const webhook = createMockWebhook();

    const { container } = render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    const card = container.querySelector('[class*="hover:shadow-lg"]');
    expect(card).toBeInTheDocument();
  });

  it("should render multiple events as badges", () => {
    const webhook = createMockWebhook({
      events: [
        "agent.created",
        "agent.updated",
        "agent.deleted",
        "deployment.created",
        "deployment.updated",
      ],
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    // All 5 events should be rendered as badges
    expect(screen.getByText("agent.created")).toBeInTheDocument();
    expect(screen.getByText("agent.updated")).toBeInTheDocument();
    expect(screen.getByText("agent.deleted")).toBeInTheDocument();
    expect(screen.getByText("deployment.created")).toBeInTheDocument();
    expect(screen.getByText("deployment.updated")).toBeInTheDocument();
  });

  it("should render webhook URL with break-all class", () => {
    const webhook = createMockWebhook({
      url: "https://very-long-url.example.com/webhooks/with/a/very/long/path",
    });

    const { container } = render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    const urlElement = container.querySelector('[class*="break-all"]');
    expect(urlElement).toBeInTheDocument();
  });

  it("should display both status and failure count badges together", () => {
    const webhook = createMockWebhook({
      status: "active",
      failure_count: 3,
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("3 failures")).toBeInTheDocument();
  });

  it("should show AlertCircle icon with failure count", () => {
    const webhook = createMockWebhook({
      failure_count: 2,
    });

    render(
      <WebhookCard
        webhook={webhook}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
        onViewDeliveries={mockOnViewDeliveries}
      />
    );

    // Check for alert icon in failure badge
    const failureBadge = screen.getByText("2 failures").closest("div");
    expect(failureBadge?.querySelector("svg")).toBeInTheDocument();
  });
});
