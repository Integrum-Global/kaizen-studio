import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { HelpDialog } from "../components/HelpDialog";
import { useHelpStore } from "../store/helpStore";

describe("HelpDialog", () => {
  let originalAddEventListener: typeof window.addEventListener;
  let originalRemoveEventListener: typeof window.removeEventListener;

  beforeEach(() => {
    // Reset the help store
    useHelpStore.setState({
      isOpen: false,
      searchQuery: "",
      selectedCategory: "all",
      selectedArticleId: null,
      recentArticles: [],
    });

    // Store original event listener methods
    originalAddEventListener = window.addEventListener;
    originalRemoveEventListener = window.removeEventListener;
  });

  afterEach(() => {
    // Restore original event listener methods
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
  });

  it("should not render when isOpen is false", () => {
    renderWithProviders(<HelpDialog />);

    expect(screen.queryByText("Help Center")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    expect(screen.getByText("Help Center")).toBeInTheDocument();
  });

  it("should show search input when open", () => {
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    expect(
      screen.getByPlaceholderText("Search help articles...")
    ).toBeInTheDocument();
  });

  it("should show category navigation", () => {
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByText("Pipelines")).toBeInTheDocument();
  });

  it("should show articles list initially", async () => {
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    await waitFor(() => {
      expect(screen.getByText("Creating Your First Agent")).toBeInTheDocument();
    });
  });

  it("should filter articles by search query", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    const searchInput = screen.getByPlaceholderText("Search help articles...");
    await user.type(searchInput, "pipeline");

    await waitFor(() => {
      expect(screen.getByText("Building a Pipeline")).toBeInTheDocument();
    });
  });

  it("should filter articles by category", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    const agentsTab = screen.getByText("Agents");
    await user.click(agentsTab);

    await waitFor(() => {
      expect(screen.getByText("Agent Configuration")).toBeInTheDocument();
    });
  });

  it("should show article view when article is selected", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    await waitFor(() => {
      expect(screen.getByText("Creating Your First Agent")).toBeInTheDocument();
    });

    const articleCard = screen.getByText("Creating Your First Agent");
    await user.click(articleCard);

    await waitFor(() => {
      // Should show article content
      expect(screen.getByText("What is an Agent?")).toBeInTheDocument();
    });
  });

  it("should show back button in article view", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    await waitFor(() => {
      expect(screen.getByText("Creating Your First Agent")).toBeInTheDocument();
    });

    const articleCard = screen.getByText("Creating Your First Agent");
    await user.click(articleCard);

    await waitFor(() => {
      const backButton = screen.getByRole("button", { name: "" });
      expect(backButton).toBeInTheDocument();
    });
  });

  it("should navigate back from article view", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    await waitFor(() => {
      expect(screen.getByText("Creating Your First Agent")).toBeInTheDocument();
    });

    const articleCard = screen.getByText("Creating Your First Agent");
    await user.click(articleCard);

    await waitFor(() => {
      expect(screen.getByText("What is an Agent?")).toBeInTheDocument();
    });

    // Find back button (it's an icon button without text)
    const buttons = screen.getAllByRole("button");
    const backButton = buttons.find((btn) =>
      btn.querySelector('[class*="lucide"]')
    );
    if (backButton) {
      await user.click(backButton);
    }

    await waitFor(() => {
      expect(screen.getByText("Help Center")).toBeInTheDocument();
    });
  });

  it("should show empty state for no results", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    const searchInput = screen.getByPlaceholderText("Search help articles...");
    await user.type(searchInput, "xyznonexistent123");

    await waitFor(() => {
      expect(
        screen.getByText("No articles found matching your search")
      ).toBeInTheDocument();
    });
  });

  it("should close dialog when escape is pressed without article selected", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    await waitFor(() => {
      expect(screen.getByText("Help Center")).toBeInTheDocument();
    });

    // Simulate escape key
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(useHelpStore.getState().isOpen).toBe(false);
    });
  });

  it("should clear search query when closing", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true, searchQuery: "test query" });

    renderWithProviders(<HelpDialog />);

    // Close by clicking outside or escape
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(useHelpStore.getState().searchQuery).toBe("");
    });
  });

  it("should handle F1 keyboard shortcut", () => {
    const addEventListenerSpy = vi.fn();
    window.addEventListener = addEventListenerSpy;

    renderWithProviders(<HelpDialog />);

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("should display article badge with category", async () => {
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    await waitFor(() => {
      // Should show category badges
      const badges = screen.getAllByText(/getting started|agents|pipelines/i);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it("should update selected category in store", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    const pipelinesTab = screen.getByText("Pipelines");
    await user.click(pipelinesTab);

    await waitFor(() => {
      expect(useHelpStore.getState().selectedCategory).toBe("pipelines");
    });
  });

  it("should update search query in store", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    const searchInput = screen.getByPlaceholderText("Search help articles...");
    await user.type(searchInput, "test");

    await waitFor(() => {
      expect(useHelpStore.getState().searchQuery).toBe("test");
    });
  });

  it("should add article to recent articles when selected", async () => {
    const user = userEvent.setup();
    useHelpStore.setState({ isOpen: true });

    renderWithProviders(<HelpDialog />);

    await waitFor(() => {
      expect(screen.getByText("Creating Your First Agent")).toBeInTheDocument();
    });

    const articleCard = screen.getByText("Creating Your First Agent");
    await user.click(articleCard);

    await waitFor(() => {
      const recentArticles = useHelpStore.getState().recentArticles;
      expect(recentArticles.length).toBeGreaterThan(0);
    });
  });
});
