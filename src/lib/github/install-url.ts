type Args = { slug: string; state: string };

/**
 * Builds the URL the user is redirected to for installing the
 * Themida GitHub App. GitHub will redirect back to the App's
 * configured Setup URL with `installation_id`, `setup_action` and
 * the `state` parameter we send here.
 */
export function buildInstallUrl({ slug, state }: Args): string {
  const url = new URL(`https://github.com/apps/${encodeURIComponent(slug)}/installations/new`);
  url.searchParams.set("state", state);
  return url.toString();
}
