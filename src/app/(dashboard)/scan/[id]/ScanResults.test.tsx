import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { IssueCardData } from "@/components/dashboard/IssueCard";
import type { Database } from "@/types/database";

import { ScanResults } from "./ScanResults";

// next/navigation mocks for client components
const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/scan/abc",
  useSearchParams: () => new URLSearchParams(),
}));

type ScanRow = Database["public"]["Tables"]["scans"]["Row"];

const baseScan: ScanRow = {
  id: "scan-1",
  repo_id: "repo-1",
  user_id: "user-1",
  status: "completed",
  frameworks: ["gdpr"],
  progress: {},
  compliance_score: 86,
  total_issues: 2,
  critical_count: 1,
  high_count: 1,
  medium_count: 0,
  low_count: 0,
  files_scanned: 47,
  files_total: 47,
  credits_used: 10,
  error_message: null,
  estimated_fix_time: null,
  started_at: "2026-05-15T14:00:00Z",
  completed_at: "2026-05-15T14:00:38Z",
  created_at: "2026-05-15T13:59:55Z",
};

const issue1: IssueCardData = {
  id: "i1",
  severity: "CRITICAL",
  rule_id: "GDPR-001",
  title: "MD5 password",
  file_path: "src/auth/login.ts",
  line_number: 47,
  code_snippet: "md5(password)",
  explanation: "Broken hash.",
  legal_reference: null,
  legal_risk: null,
  fix_description: null,
  fix_code: null,
  fix_time_estimate: null,
};

const issue2: IssueCardData = {
  ...issue1,
  id: "i2",
  severity: "HIGH",
  rule_id: "GDPR-002",
  title: "Plaintext token",
  file_path: "src/auth/token.ts",
  line_number: 12,
};

describe("ScanResults", () => {
  it("renders empty celebration when zero issues", () => {
    render(<ScanResults scan={baseScan} issues={[]} repoFullName="acme/x" defaultBranch="main" />);
    expect(screen.getByText(/no compliance issues found/i)).toBeInTheDocument();
    expect(screen.getByText(/top 5%/i)).toBeInTheDocument();
    expect(screen.getByText(/checked: gdpr/i)).toBeInTheDocument();
  });

  it("renders compliance score and severity counts", () => {
    render(
      <ScanResults
        scan={baseScan}
        issues={[issue1, issue2]}
        repoFullName="acme/x"
        defaultBranch="main"
      />,
    );
    expect(screen.getByText("86")).toBeInTheDocument();
    expect(screen.getByText(/47 files/i)).toBeInTheDocument();
    // count badges show 1 / 1 / 0 / 0
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
  });

  it("shows token and cost metadata when usage is provided", () => {
    const { container } = render(
      <ScanResults
        scan={baseScan}
        issues={[issue1, issue2]}
        repoFullName="acme/x"
        defaultBranch="main"
        usage={{ tokens: 123456, costCents: 42 }}
      />,
    );
    expect(container.textContent).toContain("123,456 tokens");
    expect(container.textContent).toContain("~$0.42 est.");
  });

  it("hides usage metadata when token count is zero", () => {
    render(
      <ScanResults
        scan={baseScan}
        issues={[issue1, issue2]}
        repoFullName="acme/x"
        defaultBranch="main"
        usage={{ tokens: 0, costCents: 0 }}
      />,
    );
    expect(screen.queryByText(/tokens/i)).not.toBeInTheDocument();
  });

  it("issue count message uses singular/plural correctly", () => {
    render(
      <ScanResults scan={baseScan} issues={[issue1]} repoFullName="acme/x" defaultBranch="main" />,
    );
    expect(screen.getByText("1 issue")).toBeInTheDocument();
  });

  it("hides file search until issues > 20", () => {
    render(
      <ScanResults
        scan={baseScan}
        issues={[issue1, issue2]}
        repoFullName="acme/x"
        defaultBranch="main"
      />,
    );
    expect(screen.queryByPlaceholderText(/filter by file/i)).not.toBeInTheDocument();
  });

  it("toggles severity filter via clickable pill", async () => {
    const user = userEvent.setup();
    render(
      <ScanResults
        scan={baseScan}
        issues={[issue1, issue2]}
        repoFullName="acme/x"
        defaultBranch="main"
      />,
    );
    // The filter pill is a button with aria-pressed; the IssueCard
    // trigger does not have aria-pressed.
    const criticalPill = screen
      .getAllByRole("button")
      .find(
        (b) => b.getAttribute("aria-pressed") !== null && /critical/i.test(b.textContent ?? ""),
      );
    expect(criticalPill).toBeDefined();
    await user.click(criticalPill!);
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("severity=HIGH%2CMEDIUM%2CLOW"),
      expect.objectContaining({ scroll: false }),
    );
  });
});
