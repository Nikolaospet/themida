import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { IssueCardData } from "@/components/dashboard/IssueCard";
import type { Database } from "@/types/database";

type ScanRow = Database["public"]["Tables"]["scans"]["Row"];

interface ReportPDFProps {
  repoFullName: string;
  blurb?: string;
  defaultBranch: string;
  commitSha?: string;
  scan: ScanRow;
  issues: IssueCardData[];
  generatedAt?: Date;
}

const COLORS = {
  bg: "#ffffff",
  text: "#0a0a0a",
  muted: "#525252",
  border: "#e5e5e5",
  surface: "#f5f5f5",
  critical: "#b91c1c",
  high: "#c2410c",
  medium: "#a16207",
  low: "#0369a1",
  accent: "#0a0a0a",
} as const;

const SEVERITY_COLOR: Record<IssueCardData["severity"], string> = {
  CRITICAL: COLORS.critical,
  HIGH: COLORS.high,
  MEDIUM: COLORS.medium,
  LOW: COLORS.low,
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  // Header
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: "solid",
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  brandTag: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Cover meta
  reportLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  repoName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  blurb: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 18,
  },
  // Summary card
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  summaryCell: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  summaryHint: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 2,
  },
  // Severity tally row
  tallyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  tallyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: COLORS.border,
  },
  tallyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  tallyLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  tallyCount: {
    fontSize: 9,
    color: COLORS.muted,
    marginLeft: 4,
  },
  // Sections
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    marginTop: 4,
  },
  // Issue
  issue: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  severityBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.bg,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filePath: {
    fontSize: 9,
    color: COLORS.muted,
    fontFamily: "Courier",
  },
  issueTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    marginBottom: 6,
  },
  issueExplanation: {
    fontSize: 9,
    color: COLORS.text,
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: "#1f2937",
    color: "#e5e7eb",
    padding: 8,
    borderRadius: 3,
    fontFamily: "Courier",
    fontSize: 8,
    marginBottom: 8,
  },
  fixBlock: {
    backgroundColor: "#ecfdf5",
    color: "#064e3b",
    padding: 8,
    borderRadius: 3,
    fontFamily: "Courier",
    fontSize: 8,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: "row",
    gap: 4,
  },
  metaLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 8,
    color: COLORS.text,
    fontFamily: "Helvetica-Bold",
  },
  fixCallout: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopStyle: "solid",
  },
  fixLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.muted,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopStyle: "solid",
  },
});

function scoreBand(score: number | null): { label: string; hint: string } {
  if (score === null || score === undefined) return { label: "—", hint: "no data" };
  if (score >= 90) return { label: `${score}/100`, hint: "Excellent" };
  if (score >= 70) return { label: `${score}/100`, hint: "Good" };
  if (score >= 50) return { label: `${score}/100`, hint: "Needs work" };
  return { label: `${score}/100`, hint: "Critical" };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function ReportPDF({
  repoFullName,
  blurb,
  defaultBranch,
  commitSha,
  scan,
  issues,
  generatedAt = new Date(),
}: ReportPDFProps) {
  const score = scoreBand(scan.compliance_score);
  const frameworks =
    (scan.frameworks ?? []).map((f) => f.toUpperCase().replace(/_/g, " ")).join(", ") || "—";

  return (
    <Document
      title={`Themida compliance report — ${repoFullName}`}
      author="Themida"
      subject="Compliance audit"
    >
      <Page size="A4" style={styles.page}>
        {/* Brand strip */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Themida</Text>
          <Text style={styles.brandTag}>Compliance audit report</Text>
        </View>

        {/* Cover */}
        <Text style={styles.reportLabel}>Repository</Text>
        <Text style={styles.repoName}>{repoFullName}</Text>
        {blurb ? <Text style={styles.blurb}>{blurb}</Text> : null}

        {/* Summary grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Compliance score</Text>
            <Text style={styles.summaryValue}>{score.label}</Text>
            <Text style={styles.summaryHint}>{score.hint}</Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Total findings</Text>
            <Text style={styles.summaryValue}>{scan.total_issues ?? 0}</Text>
            <Text style={styles.summaryHint}>
              {scan.files_scanned ?? 0} of {scan.files_total ?? 0} files scanned
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Estimated fix time</Text>
            <Text style={styles.summaryValue}>{scan.estimated_fix_time ?? "—"}</Text>
            <Text style={styles.summaryHint}>Frameworks: {frameworks}</Text>
          </View>
        </View>

        {/* Severity tally */}
        <View style={styles.tallyRow}>
          {(
            [
              ["CRITICAL", scan.critical_count ?? 0],
              ["HIGH", scan.high_count ?? 0],
              ["MEDIUM", scan.medium_count ?? 0],
              ["LOW", scan.low_count ?? 0],
            ] as const
          ).map(([level, count]) => (
            <View key={level} style={styles.tallyChip}>
              <View
                style={[
                  styles.tallyDot,
                  { backgroundColor: SEVERITY_COLOR[level as keyof typeof SEVERITY_COLOR] },
                ]}
              />
              <Text style={styles.tallyLabel}>{level}</Text>
              <Text style={styles.tallyCount}>{count}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Findings</Text>

        {issues.length === 0 ? (
          <Text style={styles.issueExplanation}>
            No issues found across the selected frameworks. Clean run.
          </Text>
        ) : null}

        {issues.map((issue, idx) => (
          <View key={issue.id} style={styles.issue} wrap={false}>
            <View style={styles.issueHeader}>
              <Text
                style={[styles.severityBadge, { backgroundColor: SEVERITY_COLOR[issue.severity] }]}
              >
                {issue.severity}
              </Text>
              <Text style={styles.filePath}>
                {issue.file_path}
                {issue.line_number !== null && issue.line_number !== undefined
                  ? `:${issue.line_number}`
                  : ""}
              </Text>
            </View>

            <Text style={styles.issueTitle}>
              {idx + 1}. {issue.title}
            </Text>

            <Text style={styles.issueExplanation}>{issue.explanation}</Text>

            {issue.code_snippet ? <Text style={styles.codeBlock}>{issue.code_snippet}</Text> : null}

            <View style={styles.metaRow}>
              {issue.legal_reference ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Legal:</Text>
                  <Text style={styles.metaValue}>{issue.legal_reference}</Text>
                </View>
              ) : null}
              {issue.legal_risk ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Risk:</Text>
                  <Text style={styles.metaValue}>{issue.legal_risk}</Text>
                </View>
              ) : null}
              {issue.fix_time_estimate ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Fix time:</Text>
                  <Text style={styles.metaValue}>{issue.fix_time_estimate}</Text>
                </View>
              ) : null}
            </View>

            {issue.fix_description || issue.fix_code ? (
              <View style={styles.fixCallout}>
                <Text style={styles.fixLabel}>Suggested fix</Text>
                {issue.fix_description ? (
                  <Text style={styles.issueExplanation}>{issue.fix_description}</Text>
                ) : null}
                {issue.fix_code ? <Text style={styles.fixBlock}>{issue.fix_code}</Text> : null}
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>
            Themida — {repoFullName} @ {commitSha ? commitSha.slice(0, 7) : defaultBranch}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${formatDate(generatedAt)} · Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
