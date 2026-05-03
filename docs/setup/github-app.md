# Setting up the Themida GitHub App

Themida uses a **GitHub App** (not an OAuth App) to read repository
contents on behalf of users. Each environment (local development,
preview, production) needs its **own** App — never reuse a single
App across environments.

## 1. Register the App

1. Sign in to GitHub as the account that will own the App.
2. Navigate to <https://github.com/settings/apps/new>.
3. Fill in:
   - **GitHub App name:** `Themida (Local)` (use `Themida (Preview)`
     or `Themida (Production)` for other environments — names must
     be globally unique on GitHub).
   - **Homepage URL:** the app URL (e.g. `http://localhost:3000`).
   - **Callback URL:** `<APP_URL>/api/github/setup/callback`.
   - **Setup URL (post-install):** same as Callback URL.
   - **Redirect on update of authorization:** ✅ checked.
   - **Webhook → Active:** **unchecked** (webhooks land in a later phase).
4. **Repository permissions:**
   - **Contents:** Read-only.
   - **Metadata:** Read-only.
5. **Account permissions:** none.
6. **Where can this GitHub App be installed?** "Any account".
7. Click **Create GitHub App**.

## 2. Capture credentials

On the App detail page:

- Copy the numeric **App ID**.
- Copy the App **slug** from the URL (e.g. `themida-local` from
  `https://github.com/settings/apps/themida-local`).
- Click **Generate a private key**. Save the `.pem` file — losing it
  forces a rotation.

## 3. Configure the project env

Edit `.env.local` (or your deployment provider's secrets):

```
GITHUB_APP_ID=123456
GITHUB_APP_SLUG=themida-local
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GITHUB_APP_INSTALL_STATE_SECRET=$(openssl rand -hex 32)
```

> The private key value must preserve newlines. Wrap the entire
> multi-line PEM string in double quotes and use literal `\n` if the
> store doesn't accept newlines.

## 4. Test the install flow

1. Boot local dev: `pnpm db:start`, `pnpm dev`.
2. Sign in with GitHub.
3. From the dashboard, click **Connect a repository**.
4. You'll be redirected to GitHub to install the App.
5. Pick the repo(s) and confirm.
6. GitHub redirects back to `/api/github/setup/callback?installation_id=...`,
   which persists the installation and shows the repo picker.

## 5. Production registration

Repeat steps 1–3 with a separate App named `Themida (Production)` and
the production callback URL (e.g.
`https://themida.io/api/github/setup/callback`). Do **not** copy the
local App's credentials to production.
