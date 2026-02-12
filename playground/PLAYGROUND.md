# Playground Guide

Use this guide to run a minimal WordPress Playground for this kit.

## Quick run

From the kit root:

- `node scripts/run-playground.mjs`

This starts Playground with:

- blueprint: `playground/blueprint.json`
- port: `9400`
- auto-mount enabled

Open:

- `http://127.0.0.1:9400/playground-ready/`

## If no skill handles Playground

If no `wp-playground` skill is available, use the direct CLI command:

- `npx @wp-playground/cli@latest server --auto-mount --port=9400 --blueprint=playground/blueprint.json`

## Optional checks

- Verify service is up:
  - `curl -I -s http://127.0.0.1:9400/ | head -n 5`
- If port 9400 is busy, use another port:
  - `PORT=9500 node scripts/run-playground.mjs`

## Notes

- Node.js 20.18+ is required.
- Playground is disposable and uses SQLite.
- Default local admin credentials in the blueprint are `admin` / `password`.
