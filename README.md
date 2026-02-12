# WordPress Agent Kit

This folder is the source of truth for the public WordPress Agent Kit.

## Install into another repo

Run:

- `node scripts/install.mjs /path/to/target-repo`

Or copy these into the root of another repository:

- `.github/`
- `AGENTS.md`

## Customize

- Start with `AGENTS.template.md` and adjust it for the target repo.
- Update `.github/instructions/wordpress-workflow.instructions.md` after running triage/router.
- Keep prompts in `.github/prompts/` accurate for the target plugin/theme.

## Optional skill sync (submodule + copy)

- `node scripts/sync-skills.mjs <skills_repo_url> [ref]`

This adds a submodule under `vendor/wp-agent-skills` and copies `.github/skills/` from it into the current repo.

## Playground

- Quick start: `node scripts/run-playground.mjs`
- Blueprint: `playground/blueprint.json`
- Fallback guidance (if no skill handles Playground): `playground/PLAYGROUND.md`

## Build release artifact

- `node scripts/build-release.mjs`

Outputs:

- `dist/wordpress-agent-kit.tar.gz`

## Node scripts

- `npm run install:kit -- /path/to/target-repo`
- `npm run sync:skills -- <skills_repo_url> [ref]`
- `npm run playground`
- `npm run build:release`

