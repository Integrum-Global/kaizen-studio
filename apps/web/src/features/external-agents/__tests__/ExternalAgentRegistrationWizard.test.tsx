import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExternalAgentRegistrationWizard } from "../components/ExternalAgentRegistrationWizard";

// Test Wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("ExternalAgentRegistrationWizard", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockOnOpenChange.mockClear();
  });

  it("renders with correct initial step", () => {
    render(
      <ExternalAgentRegistrationWizard
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Step 1 of 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider Selection/i)).toBeInTheDocument();
  });

  it("navigates forward when Next button is clicked", async () => {
    render(
      <ExternalAgentRegistrationWizard
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    // Select a provider
    const teamsRadio = screen.getByLabelText(/Microsoft Teams/i);
    fireEvent.click(teamsRadio);

    // Click Next
    const nextButton = screen.getByRole("button", { name: /Go to next step/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 6/i)).toBeInTheDocument();
      expect(screen.getByText(/Basic Information/i)).toBeInTheDocument();
    });
  });

  it("navigates backward when Back button is clicked", async () => {
    render(
      <ExternalAgentRegistrationWizard
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    // Navigate to step 2
    fireEvent.click(screen.getByLabelText(/Microsoft Teams/i));
    fireEvent.click(screen.getByRole("button", { name: /Go to next step/i }));

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 6/i)).toBeInTheDocument();
    });

    // Navigate back
    const backButton = screen.getByRole("button", { name: /Go to previous step/i });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 6/i)).toBeInTheDocument();
    });
  });

  it("disables Next button when required fields are not filled", () => {
    render(
      <ExternalAgentRegistrationWizard
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    // Next button should be disabled when no provider is selected
    const nextButton = screen.getByRole("button", { name: /Go to next step/i });
    expect(nextButton).toBeDisabled();
  });

  it("enables Next button when provider is selected", async () => {
    render(
      <ExternalAgentRegistrationWizard
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    const nextButton = screen.getByRole("button", { name: /Go to next step/i });
    expect(nextButton).toBeDisabled();

    // Select Teams provider
    fireEvent.click(screen.getByLabelText(/Microsoft Teams/i));

    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
  });

  it("validates name field on step 2", async () => {
    render(
      <ExternalAgentRegistrationWizard
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    // Navigate to step 2
    fireEvent.click(screen.getByLabelText(/Microsoft Teams/i));
    fireEvent.click(screen.getByRole("button", { name: /Go to next step/i }));

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 6/i)).toBeInTheDocument();
    });

    // Next button should be disabled with empty name
    const nextButton = screen.getByRole("button", { name: /Go to next step/i });
    expect(nextButton).toBeDisabled();

    // Enter a name with less than 3 characters
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: "ab" } });

    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 3 characters/i)).toBeInTheDocument();
      expect(nextButton).toBeDisabled();
    });

    // Enter valid name
    fireEvent.change(nameInput, { target: { value: "Test Agent" } });

    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
  });

  it("displays progress stepper correctly", () => {
    render(
      <ExternalAgentRegistrationWizard
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    // Check that all 6 steps are displayed in stepper
    expect(screen.getByText(/Provider/i)).toBeInTheDocument();
    expect(screen.getByText(/Info/i)).toBeInTheDocument();
    expect(screen.getByText(/Auth/i)).toBeInTheDocument();
    expect(screen.getByText(/Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Governance/i)).toBeInTheDocument();
    expect(screen.getByText(/Review/i)).toBeInTheDocument();
  });

  it("persists form data across steps", async () => {
    render(
      <ExternalAgentRegistrationWizard
        open={true}
        onOpenChange={mockOnOpenChange}
      />,
      { wrapper: createWrapper() }
    );

    // Step 1: Select provider
    fireEvent.click(screen.getByLabelText(/Microsoft Teams/i));
    expect(screen.getByText(/Selected:/i)).toBeInTheDocument();
    expect(screen.getByText(/Microsoft Teams/i)).toBeInTheDocument();

    // Navigate to step 2
    fireEvent.click(screen.getByRole("button", { name: /Go to next step/i }));

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 6/i)).toBeInTheDocument();
    });

    // Navigate back to step 1
    fireEvent.click(screen.getByRole("button", { name: /Go to previous step/i }));

    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 6/i)).toBeInTheDocument();
    });

    // Verify provider is still selected
    expect(screen.getByText(/Selected:/i)).toBeInTheDocument();
    expect(screen.getByText(/Microsoft Teams/i)).toBeInTheDocument();
  });
});
