# Project: WordPress Agent Kit (CLI)

This is a Node.js CLI tool (`wp-agent-kit`) designed to scaffold AI agent configuration for WordPress projects. It helps developers quickly set up `AGENTS.md` and `.github` skills/instructions in their repositories.

## Tech Stack
- **Language**: TypeScript (Node.js)
- **Framework**: Commander.js
- **Prompting**: `@clack/prompts`
- **Build**: `tsc` (TypeScript Compiler)
- **Test**: `vitest`

## Architecture
- **Entry Point**: `src/cli.ts`
- **Commands**: `src/commands/*.ts` (e.g., `install`, `setup`, `sync-skills`, `playground`)
- **Core Logic**: `src/lib/*.ts` (e.g., `installer.ts` for file copying, `triage-mapper.ts` for project detection)
- **Utilities**: `src/utils/*.ts` (e.g., `paths.ts`, `run.ts`)
- **Assets**: 
  - `AGENTS.template.md`: The template file copied to user projects.
  - `.github/`: The source of skills and instructions copied to user projects.
  - `vendor/wp-agent-skills/`: Submodule containing upstream skills.

## Development Workflow
- **Run locally**: `npm run dev` (uses `tsx src/cli.ts`)
- **Build**: `npm run build` (outputs to `dist/`)
- **Test**: `npm test` (runs Vitest)
- **Lint**: `npm run lint`

## Key Commands
- `install`: Copies `.github` and `AGENTS.md` template to a target directory.
- `setup`: Interactive wizard that detects project type and configures the kit.
- `sync-skills`: Pulls skills from `WordPress/agent-skills` into `.github/skills`.
- `playground`: Launches a local WordPress Playground instance using a blueprint.
- `build-release`: Packages the CLI for release.

## Notes for Agents
- When modifying commands, ensure you update the corresponding JSDoc comments.
- The `src/lib/installer.ts` file is critical as it handles the file copying logic.
- The `src/lib/triage-mapper.ts` file contains logic for mapping project detection results to configuration options.
- The `vendor` directory is gitignored and populated via submodule or script.