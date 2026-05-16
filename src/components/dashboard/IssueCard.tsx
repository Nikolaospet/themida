"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";

import type { Severity } from "@/lib/rules/types";

import { SeverityBadge } from "./SeverityBadge";

export interface IssueCardData {
  id: string;
  severity: Severity;
  rule_id: string;
  title: string;
  file_path: string;
  line_number: number | null;
  code_snippet: string | null;
  explanation: string;
  legal_reference: string | null;
  legal_risk: string | null;
  fix_description: string | null;
  fix_code: string | null;
  fix_time_estimate: string | null;
}

interface Props {
  issue: IssueCardData;
  repoFullName: string;
  commitSha?: string | null;
  defaultBranch: string;
}

function blobUrl(repoFullName: string, ref: string, path: string, line: number | null): string {
  const base = `https://github.com/${repoFullName}/blob/${ref}/${path}`;
  return line !== null ? `${base}#L${line}` : base;
}

export function IssueCard({ issue, repoFullName, commitSha, defaultBranch }: Props) {
  const [open, setOpen] = useState(false);
  const ref = commitSha ?? defaultBranch;
  const fileLink = blobUrl(repoFullName, ref, issue.file_path, issue.line_number);
  const fileLabel =
    issue.line_number !== null ? `${issue.file_path}:${issue.line_number}` : issue.file_path;

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="flex w-full items-start justify-between gap-4 p-4 text-left transition hover:bg-neutral-800/50 focus-visible:bg-neutral-800/50 focus-visible:outline-none"
          >
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={issue.severity} />
                <span className="font-mono text-xs text-neutral-500">{issue.rule_id}</span>
                <span className="text-sm font-medium text-neutral-100">{issue.title}</span>
              </div>
              <a
                href={fileLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex w-fit items-center gap-1 font-mono text-xs text-neutral-400 hover:text-neutral-200"
              >
                {fileLabel}
                <span aria-hidden>↗</span>
              </a>
            </div>
            <span
              aria-hidden
              className={`mt-1 text-neutral-500 transition-transform ${open ? "rotate-180" : ""}`}
            >
              ⌄
            </span>
          </button>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <div className="space-y-4 border-t border-neutral-800 p-4 text-sm">
            {issue.code_snippet && (
              <section>
                <p className="mb-2 text-xs font-medium tracking-wider text-neutral-500 uppercase">
                  Code in question
                </p>
                <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-200">
                  {issue.code_snippet}
                </pre>
              </section>
            )}

            <p className="text-neutral-300">{issue.explanation}</p>

            {(issue.legal_reference || issue.legal_risk) && (
              <dl className="grid gap-2 text-xs sm:grid-cols-2">
                {issue.legal_reference && (
                  <div>
                    <dt className="text-neutral-500">Legal</dt>
                    <dd className="text-neutral-200">{issue.legal_reference}</dd>
                  </div>
                )}
                {issue.legal_risk && (
                  <div>
                    <dt className="text-neutral-500">Risk</dt>
                    <dd className="text-neutral-200">{issue.legal_risk}</dd>
                  </div>
                )}
              </dl>
            )}

            {issue.fix_code && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium tracking-wider text-neutral-500 uppercase">
                    Suggested fix
                  </p>
                  {issue.fix_time_estimate && (
                    <p className="text-xs text-neutral-500">{issue.fix_time_estimate}</p>
                  )}
                </div>
                {issue.fix_description && (
                  <p className="mb-2 text-neutral-300">{issue.fix_description}</p>
                )}
                <pre className="overflow-x-auto rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-3 font-mono text-xs text-emerald-100">
                  {issue.fix_code}
                </pre>
              </section>
            )}
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
}
