# WordPress Agent Kit

**WordPress-focused AI agent starter kit** for GitHub Copilot, Claude, and other LLM coding agents. Includes instructions, specialized WordPress skills, and workflow automation aligned with industry standards.

Maintained by [Kyle Brodeur](https://brodeur.me).

## Quick Start

**1. Clone or fork this repository:**

```bash
# Clone
git clone https://github.com/kylebrodeur/wordpress-agent-kit.git
cd wordpress-agent-kit
```

**2. Sync the latest WordPress skills:**

```bash
pnpm install
pnpm sync:skills
```

**3. Install into your WordPress project:**

```bash
pnpm install:kit -- /path/to/your-wp-project
```

**4. Personalize for your project:**

```bash
pnpm setup -- /path/to/your-wp-project
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

### Clean Build

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

### Build Release

To create a distribution archive:

```bash
pnpm build:release
```

## Customization

**Quick method:** Run the interactive setup.

**Manual method:** Edit files directly:

1. Edit `AGENTS.md` to match your project's tech stack and conventions.
2. Run WordPress project triage (via `wp-project-triage` skill) to generate tailored instructions.
3. Update `.github/instructions/wordpress-workflow.instructions.md` with your workflow.
4. Keep prompts in `.github/prompts/` accurate for your plugin/theme.
