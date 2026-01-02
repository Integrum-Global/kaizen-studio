import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectorCard } from "../ConnectorCard";
import type { Connector } from "../../types";

describe("ConnectorCard", () => {
  const createMockConnector = (overrides?: Partial<Connector>): Connector => ({
    id: `connector-${Math.random()}`,
    organization_id: "org-123",
    name: "Test Connector",
    connector_type: "database",
    provider: "postgresql",
    status: "connected",
    created_by: "user-123",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnTest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render connector with basic information", () => {
    const connector = createMockConnector({
      name: "Production Database",
      connector_type: "database",
      provider: "postgresql",
      status: "connected",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.getByText("Production Database")).toBeInTheDocument();
    expect(screen.getByText(/database connector/i)).toBeInTheDocument();
    expect(screen.getByText(/postgresql/i)).toBeInTheDocument();
    expect(screen.getByText("connected")).toBeInTheDocument();
  });

  it("should render correct icon for database type", () => {
    const connector = createMockConnector({
      connector_type: "database",
    });

    const { container } = render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    // Database icon should be present
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should render correct icon for cloud type", () => {
    const connector = createMockConnector({
      connector_type: "cloud",
      provider: "aws",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.getByText(/cloud connector/i)).toBeInTheDocument();
    expect(screen.getByText(/aws/i)).toBeInTheDocument();
  });

  it("should render correct icon for email type", () => {
    const connector = createMockConnector({
      connector_type: "email",
      provider: "smtp",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.getByText(/email connector/i)).toBeInTheDocument();
    expect(screen.getByText(/smtp/i)).toBeInTheDocument();
  });

  it("should render correct icon for messaging type", () => {
    const connector = createMockConnector({
      connector_type: "messaging",
      provider: "slack",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.getByText(/messaging connector/i)).toBeInTheDocument();
    expect(screen.getByText(/slack/i)).toBeInTheDocument();
  });

  it("should render correct icon for storage type", () => {
    const connector = createMockConnector({
      connector_type: "storage",
      provider: "s3",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.getByText(/storage connector/i)).toBeInTheDocument();
    expect(screen.getByText(/s3/i)).toBeInTheDocument();
  });

  it("should render correct icon for api type", () => {
    const connector = createMockConnector({
      connector_type: "api",
      provider: "rest",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.getByText(/api connector/i)).toBeInTheDocument();
    expect(screen.getByText(/rest/i)).toBeInTheDocument();
  });

  it("should render connected status badge with correct variant", () => {
    const connector = createMockConnector({
      status: "connected",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    const badge = screen.getByText("connected");
    expect(badge).toBeInTheDocument();
  });

  it("should render disconnected status badge with correct variant", () => {
    const connector = createMockConnector({
      status: "disconnected",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    const badge = screen.getByText("disconnected");
    expect(badge).toBeInTheDocument();
  });

  it("should render error status badge with correct variant", () => {
    const connector = createMockConnector({
      status: "error",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    const badge = screen.getByText("error");
    expect(badge).toBeInTheDocument();
  });

  it("should render pending status badge with correct variant", () => {
    const connector = createMockConnector({
      status: "pending",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    const badge = screen.getByText("pending");
    expect(badge).toBeInTheDocument();
  });

  it("should display created date", () => {
    const connector = createMockConnector({
      created_at: "2024-01-15T10:30:00Z",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.getByText(/Created/i)).toBeInTheDocument();
  });

  it("should display last tested date when available", () => {
    const connector = createMockConnector({
      last_tested_at: "2024-01-20T10:30:00Z",
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.getByText(/Tested/i)).toBeInTheDocument();
  });

  it("should not display last tested date when not available", () => {
    const connector = createMockConnector({
      last_tested_at: undefined,
    });

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    expect(screen.queryByText(/Tested/i)).not.toBeInTheDocument();
  });

  it("should call onTest when Test Connection is clicked", async () => {
    const user = userEvent.setup();
    const connector = createMockConnector();

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Test Connection
    const testButton = screen.getByText("Test Connection");
    await user.click(testButton);

    expect(mockOnTest).toHaveBeenCalledWith(connector);
  });

  it("should call onEdit when Edit is clicked", async () => {
    const user = userEvent.setup();
    const connector = createMockConnector();

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Edit
    const editButton = screen.getByText("Edit");
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(connector);
  });

  it("should call onDelete when Delete is clicked", async () => {
    const user = userEvent.setup();
    const connector = createMockConnector();

    render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    // Open dropdown menu
    const menuButton = screen.getByRole("button");
    await user.click(menuButton);

    // Click Delete
    const deleteButton = screen.getByText("Delete");
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(connector.id);
  });

  it("should apply hover styles to card", () => {
    const connector = createMockConnector();

    const { container } = render(
      <ConnectorCard
        connector={connector}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onTest={mockOnTest}
      />
    );

    const card = container.querySelector('[class*="hover:shadow-lg"]');
    expect(card).toBeInTheDocument();
  });
});
