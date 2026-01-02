import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ResponsiveContainer } from "../components/ResponsiveContainer";

describe("ResponsiveContainer", () => {
  it("should render children", () => {
    render(
      <ResponsiveContainer>
        <div>Test content</div>
      </ResponsiveContainer>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should apply default medium padding when no padding prop provided", () => {
    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("p-4");
    expect(wrapper.className).toContain("sm:p-6");
    expect(wrapper.className).toContain("lg:p-8");
  });

  it("should apply no padding when padding='none'", () => {
    const { container } = render(
      <ResponsiveContainer padding="none">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    // Should only have custom className if provided, no padding classes
    expect(wrapper.className).not.toContain("p-");
  });

  it("should apply small padding when padding='sm'", () => {
    const { container } = render(
      <ResponsiveContainer padding="sm">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("p-2");
    expect(wrapper.className).toContain("sm:p-3");
    expect(wrapper.className).toContain("lg:p-4");
  });

  it("should apply medium padding when padding='md'", () => {
    const { container } = render(
      <ResponsiveContainer padding="md">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("p-4");
    expect(wrapper.className).toContain("sm:p-6");
    expect(wrapper.className).toContain("lg:p-8");
  });

  it("should apply large padding when padding='lg'", () => {
    const { container } = render(
      <ResponsiveContainer padding="lg">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("p-6");
    expect(wrapper.className).toContain("sm:p-8");
    expect(wrapper.className).toContain("lg:p-12");
  });

  it("should apply extra large padding when padding='xl'", () => {
    const { container } = render(
      <ResponsiveContainer padding="xl">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("p-8");
    expect(wrapper.className).toContain("sm:p-12");
    expect(wrapper.className).toContain("lg:p-16");
  });

  it("should merge custom className with padding classes", () => {
    const { container } = render(
      <ResponsiveContainer padding="md" className="custom-class bg-red-500">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-class");
    expect(wrapper.className).toContain("bg-red-500");
    expect(wrapper.className).toContain("p-4");
    expect(wrapper.className).toContain("sm:p-6");
  });

  it("should handle complex children with multiple elements", () => {
    render(
      <ResponsiveContainer>
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </div>
      </ResponsiveContainer>
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("should handle JSX fragments as children", () => {
    render(
      <ResponsiveContainer>
        <>
          <div>First</div>
          <div>Second</div>
        </>
      </ResponsiveContainer>
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("should render as a div element", () => {
    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    );

    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("should apply className when padding is none", () => {
    const { container } = render(
      <ResponsiveContainer padding="none" className="custom-wrapper">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-wrapper");
  });

  it("should handle empty className gracefully", () => {
    const { container } = render(
      <ResponsiveContainer padding="md" className="">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("p-4");
  });
});
