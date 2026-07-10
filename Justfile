default:
    @just --list

verify:
    @echo "=== Running quality gates ==="
    @bun test src
    @bun run lint
    @bun run format:check

build:
    @echo "=== Building site ==="
    @bun run build

deploy: verify build
    @echo "=== Deploying to Cloudflare Pages (project: vem) ==="
    @./scripts/deploy-pages.sh dist vem main
