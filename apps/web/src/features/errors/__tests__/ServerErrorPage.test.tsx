import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import { render, screen, userEvent } from "@/test/utils";
import { ServerErrorPage } from "../components/ServerErrorPage";

describe("ServerErrorPage", () => {
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: { reload: vi.fn(), href: "/" },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render server error message", () => {
      render(<ServerErrorPage />);

      expect(screen.getByText("Server Error")).toBeInTheDocument();
    });

    it("should render descriptive text", () => {
      render(<ServerErrorPage />);

      expect(
        screen.getByText(/something went wrong on our end/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/please try again in a few moments/i)
      ).toBeInTheDocument();
    });

    it("should render retry and go home buttons", () => {
      render(<ServerErrorPage />);

      expect(
        screen.getByRole("button", { name: /retry/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /go home/i })
      ).toBeInTheDocument();
    });

    it("should render within a card component", () => {
      const { container } = render(<ServerErrorPage />);

      const card = container.querySelector(".rounded-lg.border.bg-card");
      expect(card).toBeInTheDocument();
    });
  });

  describe("visual elements", () => {
    it("should render alert triangle icon with destructive styling", () => {
      const { container } = render(<ServerErrorPage />);

      const iconContainer = container.querySelector(".bg-destructive\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should have centered layout with full height", () => {
      const { container } = render(<ServerErrorPage />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass(
        "flex",
        "items-center",
        "justify-center",
        "min-h-screen"
      );
    });

    it("should have centered text content", () => {
      const { container } = render(<ServerErrorPage />);

      const header = container.querySelector(".text-center");
      expect(header).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should reload page when retry button is clicked", async () => {
      const user = userEvent.setup();
      render(<ServerErrorPage />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });

    it("should have clickable go home button", async () => {
      render(<ServerErrorPage />);

      const goHomeButton = screen.getByRole("button", { name: /go home/i });
      expect(goHomeButton).toBeEnabled();
    });

    it("should support keyboard interaction on retry button", async () => {
      const user = userEvent.setup();
      render(<ServerErrorPage />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      retryButton.focus();

      expect(retryButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("should have proper heading structure", () => {
      render(<ServerErrorPage />);

      const heading = screen.getByText("Server Error");
      expect(heading.tagName).toBe("H3");
    });

    it("should have accessible buttons", () => {
      render(<ServerErrorPage />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      const goHomeButton = screen.getByRole("button", { name: /go home/i });

      expect(retryButton).toHaveAccessibleName();
      expect(goHomeButton).toHaveAccessibleName();
    });

    it("should support keyboard navigation between buttons", async () => {
      const user = userEvent.setup();
      render(<ServerErrorPage />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      const goHomeButton = screen.getByRole("button", { name: /go home/i });

      retryButton.focus();
      expect(retryButton).toHaveFocus();

      await user.tab();
      expect(goHomeButton).toHaveFocus();
    });
  });

  describe("button styling", () => {
    it("should have refresh icon in retry button", () => {
      render(<ServerErrorPage />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton.querySelector("svg")).toBeInTheDocument();
    });

    it("should have home icon in go home button", () => {
      render(<ServerErrorPage />);

      const goHomeButton = screen.getByRole("button", { name: /go home/i });
      expect(goHomeButton.querySelector("svg")).toBeInTheDocument();
    });

    it("should have outline variant for go home button", () => {
      render(<ServerErrorPage />);

      const goHomeButton = screen.getByRole("button", { name: /go home/i });
      expect(goHomeButton).toHaveClass("border");
    });
  });

  describe("responsive design", () => {
    it("should have responsive padding", () => {
      const { container } = render(<ServerErrorPage />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("p-4");
    });

    it("should have max-width constraint on card", () => {
      const { container } = render(<ServerErrorPage />);

      const card = container.querySelector(".max-w-md");
      expect(card).toBeInTheDocument();
    });

    it("should have button gap spacing", () => {
      const { container } = render(<ServerErrorPage />);

      const footer = container.querySelector(".gap-2");
      expect(footer).toBeInTheDocument();
    });
  });

  describe("messaging", () => {
    it("should inform user that team has been notified", () => {
      render(<ServerErrorPage />);

      expect(
        screen.getByText(/our team has been notified/i)
      ).toBeInTheDocument();
    });

    it("should provide helpful retry instruction", () => {
      render(<ServerErrorPage />);

      expect(
        screen.getByText(/please try again in a few moments/i)
      ).toBeInTheDocument();
    });
  });
});
