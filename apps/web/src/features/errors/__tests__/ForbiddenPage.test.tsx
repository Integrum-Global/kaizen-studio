import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent } from "@/test/utils";
import { ForbiddenPage } from "../components/ForbiddenPage";

describe("ForbiddenPage", () => {
  const consoleLogSpy = vi.spyOn(console, "log");

  beforeEach(() => {
    consoleLogSpy.mockClear();
  });

  describe("rendering", () => {
    it("should render access denied message", () => {
      render(<ForbiddenPage />);

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    it("should render descriptive text", () => {
      render(<ForbiddenPage />);

      expect(
        screen.getByText(/you do not have permission to access this resource/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /contact your administrator if you believe this is a mistake/i
        )
      ).toBeInTheDocument();
    });

    it("should render request access and go home buttons", () => {
      render(<ForbiddenPage />);

      expect(
        screen.getByRole("button", { name: /request access/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /go home/i })
      ).toBeInTheDocument();
    });

    it("should render within a card component", () => {
      const { container } = render(<ForbiddenPage />);

      const card = container.querySelector(".rounded-lg.border.bg-card");
      expect(card).toBeInTheDocument();
    });
  });

  describe("visual elements", () => {
    it("should render shield X icon with destructive styling", () => {
      const { container } = render(<ForbiddenPage />);

      const iconContainer = container.querySelector(".bg-destructive\\/10");
      expect(iconContainer).toBeInTheDocument();
    });

    it("should have centered layout with full height", () => {
      const { container } = render(<ForbiddenPage />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass(
        "flex",
        "items-center",
        "justify-center",
        "min-h-screen"
      );
    });

    it("should have centered text content", () => {
      const { container } = render(<ForbiddenPage />);

      const header = container.querySelector(".text-center");
      expect(header).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should handle request access button click", async () => {
      const user = userEvent.setup();
      render(<ForbiddenPage />);

      const requestButton = screen.getByRole("button", {
        name: /request access/i,
      });
      await user.click(requestButton);

      expect(consoleLogSpy).toHaveBeenCalledWith("Request access clicked");
    });

    it("should have clickable go home button", async () => {
      render(<ForbiddenPage />);

      const goHomeButton = screen.getByRole("button", { name: /go home/i });
      expect(goHomeButton).toBeEnabled();
    });

    it("should support keyboard interaction on request access button", async () => {
      const user = userEvent.setup();
      render(<ForbiddenPage />);

      const requestButton = screen.getByRole("button", {
        name: /request access/i,
      });
      requestButton.focus();

      expect(requestButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(consoleLogSpy).toHaveBeenCalledWith("Request access clicked");
    });
  });

  describe("accessibility", () => {
    it("should have proper heading structure", () => {
      render(<ForbiddenPage />);

      const heading = screen.getByText("Access Denied");
      expect(heading.tagName).toBe("H3");
    });

    it("should have accessible buttons", () => {
      render(<ForbiddenPage />);

      const requestButton = screen.getByRole("button", {
        name: /request access/i,
      });
      const goHomeButton = screen.getByRole("button", { name: /go home/i });

      expect(requestButton).toHaveAccessibleName();
      expect(goHomeButton).toHaveAccessibleName();
    });

    it("should support keyboard navigation between buttons", async () => {
      const user = userEvent.setup();
      render(<ForbiddenPage />);

      const requestButton = screen.getByRole("button", {
        name: /request access/i,
      });
      const goHomeButton = screen.getByRole("button", { name: /go home/i });

      requestButton.focus();
      expect(requestButton).toHaveFocus();

      await user.tab();
      expect(goHomeButton).toHaveFocus();
    });
  });

  describe("button styling", () => {
    it("should have mail icon in request access button", () => {
      render(<ForbiddenPage />);

      const requestButton = screen.getByRole("button", {
        name: /request access/i,
      });
      expect(requestButton.querySelector("svg")).toBeInTheDocument();
    });

    it("should have home icon in go home button", () => {
      render(<ForbiddenPage />);

      const goHomeButton = screen.getByRole("button", { name: /go home/i });
      expect(goHomeButton.querySelector("svg")).toBeInTheDocument();
    });

    it("should have outline variant for request access button", () => {
      render(<ForbiddenPage />);

      const requestButton = screen.getByRole("button", {
        name: /request access/i,
      });
      expect(requestButton).toHaveClass("border");
    });

    it("should have default variant for go home button", () => {
      render(<ForbiddenPage />);

      const goHomeButton = screen.getByRole("button", { name: /go home/i });
      expect(goHomeButton).toHaveClass("bg-primary");
    });
  });

  describe("responsive design", () => {
    it("should have responsive padding", () => {
      const { container } = render(<ForbiddenPage />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("p-4");
    });

    it("should have max-width constraint on card", () => {
      const { container } = render(<ForbiddenPage />);

      const card = container.querySelector(".max-w-md");
      expect(card).toBeInTheDocument();
    });

    it("should have button gap spacing", () => {
      const { container } = render(<ForbiddenPage />);

      const footer = container.querySelector(".gap-2");
      expect(footer).toBeInTheDocument();
    });
  });

  describe("messaging", () => {
    it("should provide clear permission error message", () => {
      render(<ForbiddenPage />);

      expect(
        screen.getByText(/you do not have permission/i)
      ).toBeInTheDocument();
    });

    it("should suggest contacting administrator", () => {
      render(<ForbiddenPage />);

      expect(
        screen.getByText(/contact your administrator/i)
      ).toBeInTheDocument();
    });

    it("should have two separate help messages", () => {
      render(<ForbiddenPage />);

      const messages = screen
        .getAllByText(/./i)
        .filter((el) => el.classList.contains("text-muted-foreground"));

      expect(messages.length).toBeGreaterThanOrEqual(2);
    });
  });
});
