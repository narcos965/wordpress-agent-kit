# Project: WordPress Codebase

This repository is WordPress-centric (plugin, theme, or site). Agents should prioritize local skills and official WordPress standards.

## Onboarding

- Core agent: `.github/agents/wp-architect.agent.md`
- Workflow: `.github/instructions/wordpress-workflow.instructions.md`
- Skills live in: `.github/skills/`

## Project Discovery (required before changes)

1. Run project triage:
   - `node .github/skills/wp-project-triage/scripts/detect_wp_project.mjs`
2. If routing is unclear, use the router decision tree:
   - `.github/skills/wordpress-router/references/decision-tree.md`
3. Update repo-specific guidance:
   - Choose the project prefix based on existing code (functions/classes/constants).
   - Confirm folder structure (single-file plugin vs `includes/`, blocks, theme, full site).
   - Confirm target WordPress/PHP versions if relevant.

## Security Baseline

- Sanitize input early, escape output late.
- Use nonces for state-changing requests.
- Enforce capabilities for privileged actions.

## Output Requirements

- Prefer minimal, standards-compliant changes.
- Follow existing conventions in the codebase.
