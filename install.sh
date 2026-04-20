#!/usr/bin/env bash
#
# nagare - one-command install
#
# Provisions Convex (backend), builds Nuxt, deploys to Cloudflare Workers.
# Two browser popups total: Convex login + Cloudflare login.
# After deploy, visit the worker URL and complete /setup in the browser.
#
# Re-running: safe - reuses existing Convex project, .env, and session secret.
#
set -euo pipefail

# ---------- cosmetics ----------
if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; RED=$'\033[31m'
  YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=""; DIM=""; GREEN=""; RED=""; YELLOW=""; RESET=""
fi

step()  { echo; echo "${BOLD}▸ $1${RESET}"; }
ok()    { echo "  ${GREEN}✓${RESET} $1"; }
warn()  { echo "  ${YELLOW}!${RESET} $1"; }
fail()  { echo "  ${RED}✗${RESET} $1" >&2; exit 1; }

cd "$(dirname "$0")"

# Portable sed in-place (GNU vs BSD)
if sed --version >/dev/null 2>&1; then
  sed_i() { sed -i "$@"; }
else
  sed_i() { sed -i '' "$@"; }
fi

# ---------- 0. header ----------
cat <<'BANNER'

  nagare - self-hosted analytics
  ─────────────────────────────
  Convex backend · Cloudflare Workers frontend · cookieless

BANNER

# ---------- 1. prerequisites ----------
step "Checking prerequisites"
for cmd in node npm git openssl; do
  command -v "$cmd" >/dev/null 2>&1 || fail "$cmd not found - install it first."
done
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
[[ "$NODE_MAJOR" -ge 20 ]] || fail "Node 20+ required (got $(node -v))"
ok "node $(node -v) · npm $(npm -v) · git $(git --version | awk '{print $3}')"

# ---------- 2. install deps ----------
step "Installing dependencies"
npm install --silent
ok "node_modules ready"

# ---------- 3. Convex: reuse or provision ----------
CONVEX_URL=""
CONVEX_SITE_URL=""
CONVEX_DEPLOYMENT=""

# Try to read from .env.local (written by Convex CLI)
if [[ -f .env.local ]]; then
  CONVEX_URL=$(grep '^CONVEX_URL=' .env.local 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)
  CONVEX_SITE_URL=$(grep '^CONVEX_SITE_URL=' .env.local 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)
  CONVEX_DEPLOYMENT=$(grep '^CONVEX_DEPLOYMENT=' .env.local 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)
fi

# Fallback: try .env
if [[ -z "$CONVEX_URL" ]] && [[ -f .env ]]; then
  CONVEX_URL=$(grep '^CONVEX_URL=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)
  CONVEX_SITE_URL=$(grep '^CONVEX_SITE_URL=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)
  CONVEX_DEPLOYMENT=$(grep '^CONVEX_DEPLOYMENT=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)
fi

if [[ -n "$CONVEX_URL" ]]; then
  step "Convex project detected"
  ok "CONVEX_URL = $CONVEX_URL"
  ok "CONVEX_SITE_URL = $CONVEX_SITE_URL"
else
  step "Provisioning Convex"
  echo "  Browser will open for Convex login (if not already signed in)…"
  echo "  You'll be prompted for a project name."
  echo
  npx convex dev --once --configure=new
  ok "Convex project ready"

  [[ -f .env.local ]] || fail ".env.local missing - Convex provisioning failed."
  CONVEX_URL=$(grep '^CONVEX_URL=' .env.local | head -1 | cut -d= -f2- | tr -d '"')
  CONVEX_SITE_URL=$(grep '^CONVEX_SITE_URL=' .env.local | head -1 | cut -d= -f2- | tr -d '"')
  CONVEX_DEPLOYMENT=$(grep '^CONVEX_DEPLOYMENT=' .env.local | head -1 | cut -d= -f2- | tr -d '"')
  [[ -n "$CONVEX_URL" ]] || fail "Could not read CONVEX_URL from .env.local"
fi

# ---------- 4. Convex env: CONVEX_AUTH_DOMAIN (for JWT auth) ----------
# Pre-populate from existing APP_URL if already set; otherwise leave unset and
# let the post-deploy step (12) patch it after the Worker URL is known.
EXISTING_APP_URL=$(grep '^NUXT_PUBLIC_APP_URL=' .env 2>/dev/null | head -1 | cut -d= -f2- || true)
if [[ -n "$EXISTING_APP_URL" ]]; then
  step "Setting CONVEX_AUTH_DOMAIN on Convex"
  npx convex env set CONVEX_AUTH_DOMAIN "$EXISTING_APP_URL" --prod >/dev/null
  ok "CONVEX_AUTH_DOMAIN = $EXISTING_APP_URL"
fi

# ---------- 4b. Deploy Convex prod ----------
step "Pushing Convex schema + functions to production"
npx convex deploy --yes
ok "Convex prod live"

# ---------- 5. Session secret: reuse or generate ----------
SESSION_SECRET=""

if [[ -f .env ]]; then
  SESSION_SECRET=$(grep '^NUXT_SESSION_PASSWORD=' .env 2>/dev/null | head -1 | cut -d= -f2- || true)
fi

if [[ -n "$SESSION_SECRET" ]]; then
  step "Session secret"
  ok "reusing existing NUXT_SESSION_PASSWORD (${#SESSION_SECRET} chars)"
else
  step "Generating session secret"
  SESSION_SECRET=$(openssl rand -hex 32)
  ok "generated new 64-char session secret"
fi

# ---------- 5b. JWT signing key (Convex ctx.auth) ----------
JWT_PRIVATE_KEY=""
if [[ -f .env ]]; then
  JWT_PRIVATE_KEY=$(grep '^NUXT_JWT_PRIVATE_KEY=' .env 2>/dev/null | head -1 | cut -d= -f2- || true)
fi

if [[ -n "$JWT_PRIVATE_KEY" ]]; then
  step "JWT signing key"
  ok "reusing existing NUXT_JWT_PRIVATE_KEY"
else
  step "Generating JWT signing key (RS256)"
  JWT_PRIVATE_KEY=$(node scripts/generate-jwt-keys.mjs | grep '^NUXT_JWT_PRIVATE_KEY=' | cut -d= -f2-)
  [[ -n "$JWT_PRIVATE_KEY" ]] || fail "generate-jwt-keys.mjs produced no key"
  ok "RSA 2048 keypair generated"
fi

# ---------- 6. Write .env (preserve unknown keys) ----------
step "Writing .env"

# Keep any keys we don't manage
MANAGED_KEYS="NUXT_SESSION_PASSWORD|NUXT_JWT_PRIVATE_KEY|CONVEX_URL|CONVEX_SITE_URL|CONVEX_DEPLOYMENT|NUXT_PUBLIC_APP_URL"
if [[ -f .env ]]; then
  grep -vE "^($MANAGED_KEYS)=" .env > .env.new 2>/dev/null || true
else
  touch .env.new
fi

# Read existing APP_URL if set
EXISTING_APP_URL=$(grep '^NUXT_PUBLIC_APP_URL=' .env 2>/dev/null | head -1 | cut -d= -f2- || true)

{
  echo "NUXT_SESSION_PASSWORD=$SESSION_SECRET"
  echo "NUXT_JWT_PRIVATE_KEY=$JWT_PRIVATE_KEY"
  echo "CONVEX_URL=$CONVEX_URL"
  echo "CONVEX_SITE_URL=$CONVEX_SITE_URL"
  echo "CONVEX_DEPLOYMENT=$CONVEX_DEPLOYMENT"
  [[ -n "$EXISTING_APP_URL" ]] && echo "NUXT_PUBLIC_APP_URL=$EXISTING_APP_URL"
} >> .env.new
mv .env.new .env
ok ".env written (existing values preserved)"

# ---------- 7. Cloudflare login ----------
step "Signing in to Cloudflare"
npx wrangler whoami >/dev/null 2>&1 || {
  echo "  Browser will open for Cloudflare login…"
  npx wrangler login
}
ok "Cloudflare account linked"

# ---------- 8. Push Convex URLs as CF secrets ----------
step "Uploading Convex URLs as Cloudflare secrets"
[[ -f wrangler.toml ]] || fail "wrangler.toml missing at repo root."
printf '%s' "$CONVEX_URL" | npx wrangler secret put NUXT_CONVEX_URL
ok "NUXT_CONVEX_URL secret set"
printf '%s' "$CONVEX_SITE_URL" | npx wrangler secret put NUXT_PUBLIC_CONVEX_SITE_URL
ok "NUXT_PUBLIC_CONVEX_SITE_URL secret set"

# APP_URL: reuse existing from .env if known, else placeholder until post-deploy
EXISTING_APP_URL=$(grep '^NUXT_PUBLIC_APP_URL=' .env 2>/dev/null | head -1 | cut -d= -f2- || true)
if [[ -n "$EXISTING_APP_URL" ]]; then
  printf '%s' "$EXISTING_APP_URL" | npx wrangler secret put NUXT_PUBLIC_APP_URL
  ok "NUXT_PUBLIC_APP_URL secret set ($EXISTING_APP_URL)"
fi

# ---------- 9. Build ----------
step "Building Nuxt for cloudflare_module preset"
NITRO_PRESET=cloudflare_module npm run build
ok "build complete"

# ---------- 10. Push secrets to CF ----------
step "Uploading secrets to Cloudflare"
printf '%s' "$SESSION_SECRET" | npx wrangler secret put NUXT_SESSION_PASSWORD
ok "NUXT_SESSION_PASSWORD secret set"
printf '%s' "$JWT_PRIVATE_KEY" | npx wrangler secret put NUXT_JWT_PRIVATE_KEY
ok "NUXT_JWT_PRIVATE_KEY secret set"

# ---------- 11. Deploy worker ----------
step "Deploying worker"
DEPLOY_OUT=$(npx wrangler deploy 2>&1 | tee /dev/tty)
WORKER_URL=$(echo "$DEPLOY_OUT" | grep -oE 'https://[^[:space:]]+\.workers\.dev' | head -1 || true)

# ---------- 12. Set APP_URL secret if first deploy ----------
if [[ -n "${WORKER_URL:-}" ]]; then
  EXISTING_APP_URL=$(grep '^NUXT_PUBLIC_APP_URL=' .env 2>/dev/null | head -1 | cut -d= -f2- || true)
  if [[ -z "$EXISTING_APP_URL" ]]; then
    step "Setting NUXT_PUBLIC_APP_URL secret with deployed worker URL"
    printf '%s' "$WORKER_URL" | npx wrangler secret put NUXT_PUBLIC_APP_URL
    echo "NUXT_PUBLIC_APP_URL=$WORKER_URL" >> .env
    npx wrangler deploy >/dev/null 2>&1
    ok "redeployed with APP_URL = $WORKER_URL"

    step "Setting CONVEX_AUTH_DOMAIN on Convex"
    npx convex env set CONVEX_AUTH_DOMAIN "$WORKER_URL" --prod >/dev/null
    npx convex deploy --yes >/dev/null
    ok "Convex redeployed with auth domain = $WORKER_URL"
  fi
fi

# ---------- 13. Done ----------
echo
echo "${BOLD}${GREEN}━━━ deployed ━━━${RESET}"
echo
if [[ -n "${WORKER_URL:-}" ]]; then
  echo "  Your instance:  ${BOLD}$WORKER_URL${RESET}"
  echo "  Complete setup: ${BOLD}$WORKER_URL/setup${RESET}"
else
  echo "  Open the worker URL printed above, then visit /setup"
fi
echo
echo "  ${DIM}• First visit goes to /setup - create the operator account${RESET}"
echo "  ${DIM}• After that, /setup is blocked (backend-enforced 403)${RESET}"
echo "  ${DIM}• Local dev:   npm run dev     (http://localhost:3000)${RESET}"
echo "  ${DIM}• Redeploy:    npm run deploy${RESET}"
echo
