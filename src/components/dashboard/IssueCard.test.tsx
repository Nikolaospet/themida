import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { IssueCard, type IssueCardData } from "./IssueCard";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockIssue: IssueCardData = {
  id: "issue-1",
  severity: "CRITICAL",
  rule_id: "GDPR-001",
  title: "Password hashed with broken MD5 algorithm",
  file_path: "src/auth/login.ts",
  line_number: 47,
  code_snippet: "const hash = md5(password)",
  explanation: "The code uses md5(password) which is broken.",
  legal_reference: "GDPR Article 5(1)(f)",
  legal_risk: "Up to €20M or 4% of global revenue",
  fix_description: "Replace with bcrypt.",
  fix_code: "const hash = await bcrypt.hash(password, 12)",
  fix_time_estimate: "~30 minutes",
};

describe("IssueCard", () => {
  it("renders title and rule_id when collapsed", () => {
    render(<IssueCard issue={mockIssue} repoFullName="acme/x" defaultBranch="main" />);
    expect(screen.getByText(mockIssue.title)).toBeInTheDocument();
    expect(screen.getByText("GDPR-001")).toBeInTheDocument();
  });

  it("hides expanded content by default", () => {
    render(<IssueCard issue={mockIssue} repoFullName="acme/x" defaultBranch="main" />);
    // Code-in-question label only appears expanded
    expect(screen.queryByText(/code in question/i)).not.toBeInTheDocument();
  });

  it("expands on click", async () => {
    const user = userEvent.setup();
    render(<IssueCard issue={mockIssue} repoFullName="acme/x" defaultBranch="main" />);
    await user.click(screen.getByRole("button", { name: /password hashed/i }));
    expect(screen.getByText(/code in question/i)).toBeInTheDocument();
    expect(screen.getByText(/suggested fix/i)).toBeInTheDocument();
  });

  it("builds github blob link with line anchor", () => {
    render(<IssueCard issue={mockIssue} repoFullName="acme/x" defaultBranch="main" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/acme/x/blob/main/src/auth/login.ts#L47",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("prefers commitSha over defaultBranch in blob link", () => {
    render(
      <IssueCard issue={mockIssue} repoFullName="acme/x" defaultBranch="main" commitSha="abc123" />,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://github.com/acme/x/blob/abc123/src/auth/login.ts#L47",
    );
  });

  it("omits line anchor when line_number is null", () => {
    render(
      <IssueCard
        issue={{ ...mockIssue, line_number: null }}
        repoFullName="acme/x"
        defaultBranch="main"
      />,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://github.com/acme/x/blob/main/src/auth/login.ts",
    );
  });

  it("copies the suggested fix to the clipboard", async () => {
    // userEvent.setup() installs a working clipboard stub on navigator.
    const user = userEvent.setup();
    render(<IssueCard issue={mockIssue} repoFullName="acme/x" defaultBranch="main" />);
    await user.click(screen.getByRole("button", { name: /password hashed/i }));
    await user.click(screen.getByRole("button", { name: /copy fix/i }));
    expect(await navigator.clipboard.readText()).toBe(mockIssue.fix_code);
    expect(toast.success).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
  });

  it("shows no copy button when there is no fix", async () => {
    const user = userEvent.setup();
    render(
      <IssueCard
        issue={{ ...mockIssue, fix_code: null }}
        repoFullName="acme/x"
        defaultBranch="main"
      />,
    );
    await user.click(screen.getByRole("button", { name: /password hashed/i }));
    expect(screen.queryByRole("button", { name: /copy fix/i })).not.toBeInTheDocument();
  });

  it("hides optional sections when data missing", async () => {
    const user = userEvent.setup();
    render(
      <IssueCard
        issue={{
          ...mockIssue,
          code_snippet: null,
          legal_reference: null,
          legal_risk: null,
          fix_code: null,
          fix_description: null,
          fix_time_estimate: null,
        }}
        repoFullName="acme/x"
        defaultBranch="main"
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(screen.queryByText(/code in question/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/suggested fix/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/legal/i)).not.toBeInTheDocument();
    // explanation always rendered
    expect(screen.getByText(mockIssue.explanation)).toBeInTheDocument();
  });
});
