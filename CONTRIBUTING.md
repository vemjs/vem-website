# Contributing to vem-website

This repo is the source for [vem.run](https://vem.run). For changes to the editor engine itself
(motions, operators, buffer logic, rendering), see [vem](https://github.com/vemjs/vem) instead —
this repo only wires that engine up into a page.

## Process

`Issue → Branch → PR → Review → Merge`, same as every other `vemjs` repo:

1. Open an issue, unless one already covers it.
2. Branch from `main`.
3. Make the change with tests where behavior changes.
4. Open a PR against `main`. CI (typecheck, build, test, lint, format) must pass.
5. A maintainer reviews and merges.

**Deploying is a separate, manual step from merging** — merging to `main` does not push to
vem.run. See the README's Deployment section.

## Local development

```bash
git clone https://github.com/vemjs/vem-website.git
cd vem-website
bun install
bun run dev
```

Before opening a PR:

```bash
bun test src
bun run lint
bun run format
```

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). If the bug is about editor
behavior rather than the site itself (a motion doesn't work, a plugin misbehaves), please check
whether it reproduces in a fresh [vem](https://github.com/vemjs/vem) checkout too — that tells us
which repo actually needs the fix.

## Security

Please don't file public issues for security vulnerabilities — see [SECURITY.md](SECURITY.md).
