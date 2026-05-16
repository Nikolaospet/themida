import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComplianceScore } from "./ComplianceScore";

describe("ComplianceScore", () => {
  it("renders the score number", () => {
    render(<ComplianceScore score={86} />);
    expect(screen.getByText("86")).toBeInTheDocument();
  });

  it("renders the band label", () => {
    render(<ComplianceScore score={75} />);
    expect(screen.getByText(/good/i)).toBeInTheDocument();
  });

  it("clamps scores above 100", () => {
    render(<ComplianceScore score={150} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("clamps scores below 0", () => {
    render(<ComplianceScore score={-10} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("handles NaN by rendering 0", () => {
    render(<ComplianceScore score={NaN} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("exposes a descriptive aria-label", () => {
    render(<ComplianceScore score={92} />);
    expect(screen.getByLabelText(/92 out of 100/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/excellent/i)).toBeInTheDocument();
  });

  it("rounds fractional scores", () => {
    render(<ComplianceScore score={73.6} />);
    expect(screen.getByText("74")).toBeInTheDocument();
  });
});
