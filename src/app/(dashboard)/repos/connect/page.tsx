import { startInstallFlow } from "./actions";

export default function ConnectRepoPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Connect a repository</h1>
        <p className="mt-2 text-neutral-400">
          Install the Themida GitHub App on a repository to scan it for GDPR and EU AI Act
          compliance issues.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-medium tracking-wide text-neutral-400 uppercase">
          What happens next
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-neutral-300">
          <li>
            <span className="text-neutral-500">1.</span> You&apos;ll be redirected to GitHub to
            install the App.
          </li>
          <li>
            <span className="text-neutral-500">2.</span> Pick the repositories Themida should be
            allowed to read.
          </li>
          <li>
            <span className="text-neutral-500">3.</span> GitHub will send you back here to start
            your first scan.
          </li>
        </ol>

        <form action={startInstallFlow} className="mt-8">
          <button
            type="submit"
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
          >
            Install on GitHub
          </button>
        </form>

        <p className="mt-6 text-xs text-neutral-500">
          Themida only requests <strong>read access</strong> to repository contents and metadata. We
          never write to your code.
        </p>
      </div>
    </div>
  );
}
