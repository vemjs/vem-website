# vem-website

[![CI](https://github.com/vemjs/vem-website/actions/workflows/ci.yml/badge.svg)](https://github.com/vemjs/vem-website/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

The source for **[vem.run](https://vem.run)** — Vem's live web playground and docs. A single-page
app that boots straight into the canvas-native editor; help/config/plugin docs open in-editor via
`:help`, `:docs`, `:config` (real Vim-style splits, not a separate marketing site).

## What this is

An [@vemjs/renderer-vecto](https://github.com/vemjs/vem) editor instance wired up with the
[official plugin set](https://github.com/vemjs/vem-plugins), running entirely client-side — no
backend, no build-time content pipeline. `src/main.ts` is the entry point; `src/help.ts` renders
the in-editor `:help`/`:docs` content; `src/plugins/officialPlugins.ts` registers the shipped
plugins in their default (some deferred/opt-in) state.

Loads a `.vemrc` from an opened project folder if present — see
[vem-desktop](https://github.com/vemjs/vem-desktop)'s `presets/` for ready-made examples (theme,
line numbers, clipboard integration), which work here too since a vemrc is just a plain
JSON `VemConfig` object.

## Development

```bash
bun install
bun run dev       # vite dev server with HMR
bun test src
```

## Deployment

Deploys to Cloudflare Pages (project `vem`) — **manual, not automatic on push**:

```bash
just deploy   # verify (test + lint + format:check) → build → deploy
```

`scripts/deploy-pages.sh` wraps `wrangler pages deploy` and reaps its never-exiting process once
the `Deployment complete!` marker appears. Always verify the live site afterward — check for the
specific new strings/behavior you just shipped, not just that the deploy command exited 0.

## Related repositories

- [**vem**](https://github.com/vemjs/vem) — the editor monorepo (`@vemjs/core`,
  `renderer-vecto`, `lsp-client`, `plugin-api`) this site's editor is built on
- [**vem-plugins**](https://github.com/vemjs/vem-plugins) — the official plugins loaded here
- [**vem-desktop**](https://github.com/vemjs/vem-desktop) — the native Tauri shell sharing this
  site's editor code

## License

MIT
