# WordPress Agent Kit

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/Written%20in-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Version](https://img.shields.io/badge/version-0.2.0-blue?style=flat-square)](package.json)

**WordPress-focused AI agent starter kit** for GitHub Copilot, Claude, and other LLM coding agents. Includes instructions, specialized WordPress skills, and workflow automation aligned with industry standards.

Maintained by [Kyle Brodeur](https://brodeur.me).

## Quick Start

### Option 1: CLI (Recommended)

Run the interactive setup wizard:

```bash
npx wp-agent-kit setup
# or
pnpm dlx wp-agent-kit setup
```

This will:
- Detect your WordPress project type
- Install `AGENTS.md` and skills into your project
- Configure for your tech stack

### Option 2: Pre-built Bundles

Download a bundle from the [latest release](https://github.com/kylebrodeur/wordpress-agent-kit/releases):

- **`wordpress-agent-kit-github.tar.gz`** - For GitHub Copilot
- **`wordpress-agent-kit-claude.tar.gz`** - For Claude
- **`wordpress-agent-kit-agent.tar.gz`** - For generic `.agent` workflows
- **`wordpress-agent-kit-cursor.tar.gz`** - For Cursor IDE

Extract into your WordPress project root:

```bash
cd /path/to/your-wordpress-project
tar -xzf wordpress-agent-kit-github.tar.gz
```

This interactive setup helps you:
- **Automatically detect** your project type and technologies.
- Customize `AGENTS.md` for your tech stack.
- Configure workflow instructions.
- Set up prompt templates.

Use the `--reset` flag if you need to re-run the setup on an existing project:

```bash
pnpm setup -- /path/to/your-wp-project --reset
```

The setup will analyze your project first and either:
- Auto-configure if confident.
- Pre-fill smart defaults if partially detected.
- Ask questions if detection is unclear.

## Who This Is For

- **WordPress plugin/theme developers** who want AI agents to understand WordPress conventions (hooks, sanitization, Settings API, block registration, etc.).
- **Teams adopting GitHub Copilot or Claude** for WordPress codebases.
- **Anyone building custom WordPress workflows** who needs agents to follow WordPress Coding Standards, security best practices, and core APIs.

## What You Get

- **Agent Skills**: WordPress-specific knowledge modules (blocks, Interactivity API, REST API, WP-CLI, performance, security, theme.json, Playground, PHPStan, etc.).
- **Instructions & Workflows**: Pre-built guidance for common WordPress dev cycles.
- **AGENTS.md**: Single-file agent onboarding that loads skills on demand.
- **Sync Scripts**: Pull latest skills from official [WordPress/agent-skills](https://github.com/WordPress/agent-skills) repository.

## Development

This project uses a TypeScript-based CLI for all operations.

### Build CLI

```bash
pnpm build
```

### Build Release Bundles

```bash
pnpm sync:skills  # Sync latest WordPress skills first
pnpm build:bundles
```

This generates four platform-specific bundles in `dist/bundles/`:
- `wordpress-agent-kit-github.tar.gz`
- `wordpress-agent-kit-claude.tar.gz`
- `wordpress-agent-kit-agent.tar.gz`
- `wordpress-agent-kit-cursor.tar.gz`

### Run Tests

```bash
pnpm test
```

## Customization

**Quick method:** Run the interactive setup.

**Manual method:** Edit files directly:

1. Edit `AGENTS.md` to match your project's tech stack and conventions.
2. Run WordPress project triage (via `wp-project-triage` skill) to generate tailored instructions.
3. Update `.github/instructions/wordpress-workflow.instructions.md` with your workflow.
4. Keep prompts in `.github/prompts/` accurate for your plugin/theme.
