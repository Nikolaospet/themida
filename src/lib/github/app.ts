import "server-only";

import { App } from "octokit";

import { serverEnv } from "@/env";

let cached: App | undefined;

/**
 * Returns the singleton App instance. Created lazily so module load
 * does not require credentials (matters for tests + Storybook).
 */
export function getApp(): App {
  if (!cached) {
    // Private keys are stored in env with literal \n so they survive
    // single-line secret stores. Convert back to real newlines.
    const privateKey = serverEnv.GITHUB_APP_PRIVATE_KEY.replace(/\\n/gu, "\n");
    cached = new App({
      appId: serverEnv.GITHUB_APP_ID,
      privateKey,
    });
  }
  return cached;
}

/**
 * Octokit instance authenticated *as the App itself*. Useful for
 * App-level operations (listing installations, suspending, etc.).
 */
export function getAppOctokit() {
  return getApp().octokit;
}

/**
 * Octokit instance authenticated *as a specific installation*.
 * Use this for any per-user repo access.
 */
export async function getInstallationOctokit(installationId: number) {
  return getApp().getInstallationOctokit(installationId);
}
