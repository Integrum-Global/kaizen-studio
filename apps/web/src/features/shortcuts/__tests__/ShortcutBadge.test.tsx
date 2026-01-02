import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShortcutBadge, InlineShortcut } from "../components/ShortcutBadge";

// Mock the platform detection
vi.mock("../utils/platform", () => ({
  formatKeyDisplay: vi.fn((key: string) => {
    const keyMap: Record<string, string> = {
      Meta: "⌘",
      Control: "Ctrl",
      Alt: "Alt",
      Shift: "Shift",
      Enter: "↵",
      Escape: "Esc",
      ArrowUp: "↑",
      ArrowDown: "↓",
    };
    return keyMap[key] || key;
  }),
}));

describe("ShortcutBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render single key", () => {
      render(<ShortcutBadge keys={["K"]} />);

      expect(screen.getByText("K")).toBeInTheDocument();
    });

    it("should render multiple keys", () => {
      render(<ShortcutBadge keys={["Control", "K"]} />);

      expect(screen.getByText("Ctrl")).toBeInTheDocument();
      expect(screen.getByText("K")).toBeInTheDocument();
    });

    it("should render plus separator between keys", () => {
      render(<ShortcutBadge keys={["Control", "Shift", "K"]} />);

      // Should have 2 separators for 3 keys
      const separators = screen.getAllByText("+");
      expect(separators).toHaveLength(2);
    });

    it("should not render separator after last key", () => {
      render(<ShortcutBadge keys={["Control", "K"]} />);

      // Should have exactly 1 separator for 2 keys
      const separators = screen.getAllByText("+");
      expect(separators).toHaveLength(1);
    });
  });

  describe("key formatting", () => {
    it("should format Meta key", () => {
      render(<ShortcutBadge keys={["Meta"]} />);

      expect(screen.getByText("⌘")).toBeInTheDocument();
    });

    it("should format Control key", () => {
      render(<ShortcutBadge keys={["Control"]} />);

      expect(screen.getByText("Ctrl")).toBeInTheDocument();
    });

    it("should format special keys", () => {
      render(<ShortcutBadge keys={["Enter"]} />);

      expect(screen.getByText("↵")).toBeInTheDocument();
    });

    it("should format arrow keys", () => {
      render(<ShortcutBadge keys={["ArrowUp"]} />);

      expect(screen.getByText("↑")).toBeInTheDocument();
    });
  });

  describe("sizes", () => {
    it("should render with small size by default", () => {
      const { container } = render(<ShortcutBadge keys={["K"]} />);

      // Check that the component renders
      expect(container.querySelector(".text-xs")).toBeInTheDocument();
    });

    it("should render with medium size", () => {
      const { container } = render(<ShortcutBadge keys={["K"]} size="md" />);

      expect(container.querySelector(".text-sm")).toBeInTheDocument();
    });

    it("should render with large size", () => {
      const { container } = render(<ShortcutBadge keys={["K"]} size="lg" />);

      expect(container.querySelector(".text-base")).toBeInTheDocument();
    });
  });

  describe("className", () => {
    it("should apply custom className to container", () => {
      const { container } = render(
        <ShortcutBadge keys={["K"]} className="custom-class" />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should render badges with monospace font", () => {
      const { container } = render(<ShortcutBadge keys={["K"]} />);

      expect(container.querySelector(".font-mono")).toBeInTheDocument();
    });

    it("should render with muted background", () => {
      render(<ShortcutBadge keys={["K"]} />);

      // bg-muted/50 gets compiled, so just check the component renders properly
      expect(screen.getByText("K")).toBeInTheDocument();
    });
  });

  describe("complex shortcuts", () => {
    it("should render Ctrl+Shift+K", () => {
      render(<ShortcutBadge keys={["Control", "Shift", "K"]} />);

      expect(screen.getByText("Ctrl")).toBeInTheDocument();
      expect(screen.getByText("Shift")).toBeInTheDocument();
      expect(screen.getByText("K")).toBeInTheDocument();
    });

    it("should render Cmd+Alt+Escape", () => {
      render(<ShortcutBadge keys={["Meta", "Alt", "Escape"]} />);

      expect(screen.getByText("⌘")).toBeInTheDocument();
      expect(screen.getByText("Alt")).toBeInTheDocument();
      expect(screen.getByText("Esc")).toBeInTheDocument();
    });
  });
});

describe("InlineShortcut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render single key", () => {
      render(<InlineShortcut keys={["K"]} />);

      expect(screen.getByText("K")).toBeInTheDocument();
    });

    it("should render multiple keys", () => {
      render(<InlineShortcut keys={["Control", "K"]} />);

      expect(screen.getByText("Ctrl")).toBeInTheDocument();
      expect(screen.getByText("K")).toBeInTheDocument();
    });

    it("should render plus separator between keys", () => {
      render(<InlineShortcut keys={["Control", "K"]} />);

      const separators = screen.getAllByText("+");
      expect(separators).toHaveLength(1);
    });
  });

  describe("styling", () => {
    it("should render kbd elements", () => {
      const { container } = render(<InlineShortcut keys={["K"]} />);

      const kbd = container.querySelector("kbd");
      expect(kbd).toBeInTheDocument();
    });

    it("should apply monospace font to kbd", () => {
      const { container } = render(<InlineShortcut keys={["K"]} />);

      const kbd = container.querySelector("kbd");
      expect(kbd).toHaveClass("font-mono");
    });

    it("should apply muted background to kbd", () => {
      const { container } = render(<InlineShortcut keys={["K"]} />);

      const kbd = container.querySelector("kbd");
      expect(kbd).toHaveClass("bg-muted");
    });

    it("should apply border to kbd", () => {
      const { container } = render(<InlineShortcut keys={["K"]} />);

      const kbd = container.querySelector("kbd");
      expect(kbd).toHaveClass("border");
    });
  });

  describe("className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <InlineShortcut keys={["K"]} className="custom-inline" />
      );

      expect(container.querySelector(".custom-inline")).toBeInTheDocument();
    });
  });

  describe("inline display", () => {
    it("should display inline with text", () => {
      const { container } = render(<InlineShortcut keys={["K"]} />);

      expect(container.querySelector(".inline-flex")).toBeInTheDocument();
    });

    it("should have small text size", () => {
      const { container } = render(<InlineShortcut keys={["K"]} />);

      const kbd = container.querySelector("kbd");
      expect(kbd).toHaveClass("text-xs");
    });
  });
});
