import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Themida
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/showcase" className="text-neutral-400 hover:text-neutral-100">
              Showcase
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-white px-3 py-1.5 font-medium text-neutral-900 hover:bg-neutral-100"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>

      <footer className="border-t border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-neutral-500">
          <span>© {new Date().getFullYear()} Themida</span>
          <nav className="flex gap-4">
            <Link href="/showcase" className="hover:text-neutral-300">
              Showcase
            </Link>
            <Link href="/sample/nodegoat" className="hover:text-neutral-300">
              Sample report
            </Link>
            <Link href="/login" className="hover:text-neutral-300">
              Sign in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
