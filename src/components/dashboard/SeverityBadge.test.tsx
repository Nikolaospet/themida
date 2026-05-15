import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeverityBadge } from "./SeverityBadge";

describe("SeverityBadge", () => {
  it("renders each severity label", () => {
    (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).forEach((s) => {
      const { unmount, getByText } = render(<SeverityBadge severity={s} />);
      expect(getByText(/^(Critical|High|Medium|Low)$/)).toBeInTheDocument();
      unmount();
    });
  });

  it("renders count when variant=count", () => {
    render(<SeverityBadge severity="HIGH" variant="count" count={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not render count when variant=default", () => {
    render(<SeverityBadge severity="HIGH" count={5} />);
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("dot variant exposes aria-label and no text", () => {
    render(<SeverityBadge severity="CRITICAL" variant="dot" />);
    expect(screen.getByLabelText("Critical")).toBeInTheDocument();
    expect(screen.queryByText("Critical")).not.toBeInTheDocument();
  });

  it("respects custom className", () => {
    const { container } = render(<SeverityBadge severity="LOW" className="my-test-class" />);
    expect(container.firstChild).toHaveClass("my-test-class");
  });
});
