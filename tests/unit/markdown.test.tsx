import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Markdown, renderInline } from "@/components/markdown";

describe("Unit Tests: Markdown renderer", () => {
  it("renders plain text paragraphs as-is", () => {
    const { container } = render(<Markdown content={"Hello world.\nSecond line."} />);
    expect(container.querySelector("p")?.textContent).toBe("Hello world. Second line.");
  });

  it("renders headings", () => {
    const { container } = render(<Markdown content={"# Big\n\n## Sub"} />);
    expect(container.querySelector("h1")?.textContent).toBe("Big");
    expect(container.querySelector("h2")?.textContent).toBe("Sub");
  });

  it("renders bullet and numbered lists", () => {
    const { container } = render(<Markdown content={"- one\n- two\n\n1. first\n2. second"} />);
    expect(container.querySelectorAll("ul li").length).toBe(2);
    expect(container.querySelectorAll("ol li").length).toBe(2);
  });

  it("renders inline bold, code, and links", () => {
    const { container } = render(<Markdown content={"Use **npm** and `pnpm` — see [docs](https://example.com)"} />);
    expect(container.querySelector("strong")?.textContent).toBe("npm");
    expect(container.querySelector("code")?.textContent).toBe("pnpm");
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe("https://example.com");
    expect(a?.getAttribute("target")).toBe("_blank");
  });

  it("renders fenced code blocks", () => {
    const { container } = render(<Markdown content={"Before:\n\n```js\nconst x = 1;\n```\n\nAfter"} />);
    expect(container.querySelector("pre code")?.textContent).toContain("const x = 1;");
  });

  it("is XSS-safe — script tags are escaped, never rendered", () => {
    render(<Markdown content={'<script>alert("x")</script>'} />);
    expect(document.querySelector("script")).toBeNull();
  });

  it("renders empty content as null", () => {
    const { container } = render(<Markdown content={""} />);
    expect(container.firstChild).toBeNull();
  });

  it("exposes renderInline for standalone use", () => {
    const nodes = renderInline("**bold**");
    expect(nodes.length).toBeGreaterThan(0);
  });
});
