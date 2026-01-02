import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/utils";
import { Button } from "../button";

describe("Button", () => {
  describe("rendering", () => {
    it("should render correctly with children", () => {
      render(<Button>Click me</Button>);

      expect(
        screen.getByRole("button", { name: "Click me" })
      ).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      render(<Button className="custom-class">Click me</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("should forward ref correctly", () => {
      const ref = { current: null };
      render(<Button ref={ref}>Click me</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("variants", () => {
    it("should apply default variant classes", () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");
      expect(button).toHaveClass("text-primary-foreground");
    });

    it("should apply destructive variant classes", () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive");
      expect(button).toHaveClass("text-destructive-foreground");
    });

    it("should apply outline variant classes", () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("border-input");
      expect(button).toHaveClass("bg-background");
    });

    it("should apply secondary variant classes", () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary");
      expect(button).toHaveClass("text-secondary-foreground");
    });

    it("should apply ghost variant classes", () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("should apply link variant classes", () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-primary");
      expect(button).toHaveClass("underline-offset-4");
    });
  });

  describe("sizes", () => {
    it("should apply default size classes", () => {
      render(<Button>Default size</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
    });

    it("should apply sm size classes", () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
      expect(button).toHaveClass("px-3");
    });

    it("should apply lg size classes", () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-11");
      expect(button).toHaveClass("px-8");
    });

    it("should apply icon size classes", () => {
      render(<Button size="icon">+</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("w-10");
    });
  });

  describe("interactions", () => {
    it("should call onClick handler when clicked", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole("button");
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should be keyboard accessible", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Press me</Button>);

      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(" ");
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("disabled state", () => {
    it("should render with disabled attribute", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should apply disabled opacity classes", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:opacity-50");
    });

    it("should prevent pointer events when disabled", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:pointer-events-none");
    });
  });

  describe("accessibility", () => {
    it("should have correct role", () => {
      render(<Button>Button</Button>);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should support aria-label", () => {
      render(<Button aria-label="Close dialog">X</Button>);

      expect(screen.getByLabelText("Close dialog")).toBeInTheDocument();
    });

    it("should support aria-disabled", () => {
      render(<Button aria-disabled="true">Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-disabled", "true");
    });

    it("should have focus-visible outline", () => {
      render(<Button>Focus me</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:outline-none");
      expect(button).toHaveClass("focus-visible:ring-2");
      expect(button).toHaveClass("focus-visible:ring-ring");
    });
  });

  describe("type attribute", () => {
    it("should render as button element", () => {
      render(<Button>Button</Button>);

      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("should support submit type", () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should support reset type", () => {
      render(<Button type="reset">Reset</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "reset");
    });
  });

  describe("combination of props", () => {
    it("should handle multiple variants and sizes correctly", () => {
      render(
        <Button variant="outline" size="lg">
          Large Outline
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("h-11");
      expect(button).toHaveClass("px-8");
    });

    it("should combine variant, size, and custom className", () => {
      render(
        <Button variant="destructive" size="sm" className="custom-class">
          Delete
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive");
      expect(button).toHaveClass("h-9");
      expect(button).toHaveClass("custom-class");
    });
  });
});
