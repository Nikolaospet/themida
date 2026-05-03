export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Welcome to Themida</h1>
        <p className="mt-2 text-neutral-400">
          Connect a repository to run your first compliance scan.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium tracking-wide text-neutral-400 uppercase">
          Getting started
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-neutral-300">
          <li>
            <span className="text-neutral-500">1.</span> Connect a GitHub repository
          </li>
          <li>
            <span className="text-neutral-500">2.</span> Pick the compliance frameworks you care
            about
          </li>
          <li>
            <span className="text-neutral-500">3.</span> Run a scan and review the findings
          </li>
        </ol>
        <p className="mt-6 text-xs text-neutral-500">Repository connection ships in Phase 2.</p>
      </div>
    </div>
  );
}
