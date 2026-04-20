# Nagare 流れ

> _nagare_ - stream, current, flow.

Self-hosted, cookieless, GDPR-native analytics. Nuxt 4 frontend on Cloudflare Workers, Convex backend, real-time dashboard, heatmaps, multi-site.

---

## Prerequisites

- **Node.js** ≥ 20 ([nodejs.org](https://nodejs.org))
- **npm** (ships with Node)
- **git**
- A free **[Convex](https://convex.dev/referral/FLORIA4123)** account - backend (you need to create a Convex account)
- A free **[Cloudflare](https://dash.cloudflare.com/sign-up)** account - frontend hosting

Both accounts take two clicks to create; the install script opens the OAuth popups for you.

---

## Installation

One-liner (no manual clone):

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/florianjs/nagare/main/bootstrap.sh)
```

Or manually:

```bash
git clone https://github.com/florianjs/nagare.git
cd nagare
./install.sh
```

The script handles everything:

1. Checks `node` / `npm` / `git`.
2. `npm install`.
3. Convex login (opens browser).
4. Provisions a new Convex project, writes `.env.local`.
5. Deploys schema + functions to Convex prod.
6. Cloudflare login (opens browser).
7. Pushes `NUXT_PUBLIC_CONVEX_URL` as a Worker secret.
8. Deploys the Nuxt Worker.

**Two browser popups, zero key copy-paste.**

When it finishes, the Worker URL is printed. Open it, complete `/setup` to create the operator account - from that point on, only this email + password unlock the dashboard.

---

## Local development

In two terminals:

```bash
npm run dev        # Nuxt → http://localhost:3000
npx convex dev     # Convex (watch mode, auto-push)
```

---

## Install the tracker on a site

After creating a site in the dashboard, paste the snippet it gives you:

```html
<script
  src="https://your-instance.workers.dev/t.js"
  data-site-id="XYZ"
  data-endpoint="https://xxx.convex.cloud"
  defer
></script>
```

Custom events:

```js
window.nagare.event('cta.click');
```

---

## Stack

- **Frontend**: Nuxt 4, TailwindCSS, Pinia, i18n (FR/EN)
- **Backend**: Convex (DB + functions + realtime subscriptions)
- **Hosting**: Cloudflare Workers (SSR) + Convex (backend)
- **Tracker**: vanilla JS, <3KB gzipped, zero deps

---

## GDPR

- No cookies, no localStorage on the visitor side.
- Fingerprint = `hash(IP + UA + daily rotating salt)`.
- Honors `DNT` and `Sec-GPC` (event silently dropped).
- No raw PII stored.

---

## Acknowledgements

Nagare stands on the shoulders of excellent open-source projects. Huge thanks to the maintainers of:

**Runtime**

- [Nuxt](https://nuxt.com) - the Vue meta-framework
- [Vue](https://vuejs.org) & [Vue Router](https://router.vuejs.org)
- [Convex](https://convex.dev) - reactive backend, DB, and functions
- [Pinia](https://pinia.vuejs.org) - Vue state management
- [TailwindCSS](https://tailwindcss.com) - utility-first CSS
- [Chart.js](https://www.chartjs.org) & [vue-chartjs](https://vue-chartjs.org) - dashboard charts
- [heatmap.js](https://www.patrick-wied.at/static/heatmapjs/) - heatmap rendering
- [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) - operator sessions
- [@nuxtjs/i18n](https://i18n.nuxtjs.org), [@nuxt/fonts](https://fonts.nuxt.com), [@nuxt/icon](https://github.com/nuxt/icon)

**Hosting**

- [Cloudflare Workers](https://workers.cloudflare.com) - edge SSR
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - Workers CLI

**Dev tooling**

- [Vitest](https://vitest.dev) - tests
- [ESLint](https://eslint.org) - linting
- [happy-dom](https://github.com/capricorn86/happy-dom) - DOM for tests
- [Husky](https://typicode.github.io/husky/) & [lint-staged](https://github.com/okonet/lint-staged) - git hooks

If Nagare is useful to you, please consider starring or sponsoring the projects above too.

---

## License

[MIT](./LICENSE) © Florian Argaud
