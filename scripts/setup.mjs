#!/usr/bin/env node

/**
 * Interactive setup script for WordPress Agent Kit
 * Guides users through customizing the kit for their project
 */

import * as p from '@clack/prompts';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse arguments manually to support --dir flag and positional argument
const argv = process.argv.slice(2);
let targetPath = null;

for (let i = 0; i < argv.length; i++) {
	const arg = argv[i];
	if (arg.startsWith('--dir=')) {
		targetPath = arg.slice(6);
	} else if (arg === '--dir') {
		if (argv[i + 1]) {
			targetPath = argv[i + 1];
			i++;
		}
	} else if (!arg.startsWith('-') && !targetPath) {
		targetPath = arg;
	}
}

targetPath = targetPath || process.cwd();
const targetDir = resolve(targetPath);

function detectProject(target) {
	const scriptPath = resolve(__dirname, '../vendor/wp-agent-skills/skills/wp-project-triage/scripts/detect_wp_project.mjs');
	if (!existsSync(scriptPath)) return null;

	try {
		const result = spawnSync('node', [scriptPath, target], { encoding: 'utf-8' });
		if (result.status === 0 && result.stdout) {
			const json = result.stdout.trim().split('\n').pop(); // JSON is last line
			return JSON.parse(json);
		}
	} catch (e) {
		// console.error(e);
	}
	return null;
}

async function main() {
	console.clear();

	p.intro('WordPress Agent Kit Setup');

	// Check if target directory exists
	if (!existsSync(targetDir)) {
		const shouldCreate = await p.confirm({
			message: `Target directory doesn't exist: ${targetDir}\nCreate it?`,
			initialValue: true,
		});

		if (p.isCancel(shouldCreate) || !shouldCreate) {
			p.cancel('Setup cancelled.');
			process.exit(0);
		}

		try {
			mkdirSync(targetDir, { recursive: true });
			p.log.success(`Created directory: ${targetDir}`);
		} catch (err) {
			p.log.error(`Failed to create directory: ${err.message}`);
			process.exit(1);
		}
	}

	p.log.info(`Setting up kit in: ${targetDir}`);

	// Check if kit is already installed
	const agentsPath = join(targetDir, 'AGENTS.md');
	const workflowPath = join(targetDir, '.github/instructions/wordpress-workflow.instructions.md');
	
	if (!existsSync(agentsPath)) {
		const shouldInstall = await p.confirm({
			message: 'Kit not found in target repo. Install it first?',
			initialValue: true,
		});

		if (p.isCancel(shouldInstall) || !shouldInstall) {
			p.cancel('Setup cancelled.');
			process.exit(0);
		}

		const s = p.spinner();
		s.start('Installing kit files...');
		
		try {
			execSync(`node ${join(process.cwd(), 'scripts/install.mjs')} "${targetDir}"`, {
				stdio: 'pipe',
			});
			s.stop('Kit installed successfully.');
		} catch (err) {
			s.stop('Installation failed.');
			console.error(err.message);
			process.exit(1);
		}
	}

	// Project info
	const projectInfo = await p.group(
		{
			projectType: () =>
				p.select({
					message: 'What type of WordPress project is this?',
					options: [
						{ value: 'plugin', label: 'Plugin' },
						{ value: 'theme', label: 'Theme' },
						{ value: 'block-theme', label: 'Block Theme' },
						{ value: 'site', label: 'Full Site / Multisite' },
						{ value: 'blocks', label: 'Gutenberg Blocks' },
						{ value: 'other', label: 'Other / Mixed' },
					],
				}),
			techStack: () =>
				p.multiselect({
					message: 'Select technologies used in your project:',
					options: [
						{ value: 'not-sure', label: 'Not sure (Auto-detect)', hint: 'Analyzes project files' },
						{ value: 'gutenberg', label: 'Gutenberg Blocks', hint: 'block.json, @wordpress/blocks' },
						{ value: 'interactivity', label: 'Interactivity API', hint: 'data-wp-* directives' },
						{ value: 'rest-api', label: 'REST API', hint: 'Custom endpoints' },
						{ value: 'wpcli', label: 'WP-CLI', hint: 'Custom commands' },
						{ value: 'composer', label: 'Composer', hint: 'PHP dependencies' },
						{ value: 'npm', label: 'npm/pnpm', hint: 'JS build process' },
						{ value: 'phpstan', label: 'PHPStan', hint: 'Static analysis' },
						{ value: 'playground', label: 'WordPress Playground', hint: 'Testing/demo' },
					],
					required: false,
				}),
			runTriage: () =>
				p.confirm({
					message: 'Run project triage to detect WordPress setup?',
					initialValue: true,
				}),
		},
		{
			onCancel: () => {
				p.cancel('Setup cancelled.');
				process.exit(0);
			},
		}
	);

	// Run triage if requested
	let detectedPackageManager = 'npm/pnpm';

	if (projectInfo.runTriage || projectInfo.techStack.includes('not-sure')) {
		const s = p.spinner();
		s.start('Analyzing project structure...');
		
		const report = detectProject(targetDir);
		s.stop('Project analyzed.');
		
		if (report) {
			const { signals = {}, tooling = {} } = report;
			if (tooling.node?.packageManager) detectedPackageManager = tooling.node.packageManager;

			const detectedStack = [];

			if (signals.isBlockPlugin || signals.isBlockTheme || tooling.node?.usesWordpressScripts || signals.blockJsonFiles?.length) detectedStack.push('gutenberg');
			if (signals.usesInteractivityApi) detectedStack.push('interactivity');
			if (signals.usesWpCli) detectedStack.push('wpcli');
			if (tooling.php?.hasComposerJson) detectedStack.push('composer');
			if (tooling.node?.hasPackageJson) detectedStack.push('npm');
			
			// REST API and PHPStan signals aren't explicit in triage output yet, implying manual selection
			
			// Merge detected
			const userStack = projectInfo.techStack.filter(v => v !== 'not-sure');
			projectInfo.techStack = [...new Set([...userStack, ...detectedStack])];

			p.note(
				`Detected:\n` +
				`- Type: ${report.project?.primary || 'unknown'}\n` +
				`- Stack: ${detectedStack.join(', ') || 'None specific'}\n` +
				`- Package Manager: ${tooling.node?.packageManager || 'npm'}`,
				'Project Triage Results'
			);

            // Refine project type if detected
            if (report.project?.primary && projectInfo.projectType === 'other') {
                // If user said 'other' or maybe we strictly override? 
                // Let's just note it for now as the prompt is already done.
            }
		} else {
             p.log.warn('Could not run detection tool.');
        }
	}

	// Customize AGENTS.md
	const customizeAgents = await p.confirm({
		message: 'Customize AGENTS.md with project details?',
		initialValue: true,
	});

	if (p.isCancel(customizeAgents)) {
		p.cancel('Setup cancelled.');
		process.exit(0);
	}

	if (customizeAgents) {
		try {
			let agentsContent = readFileSync(agentsPath, 'utf-8');
			
			// Replace placeholder tech stack
			const techStackList = projectInfo.techStack
				.map(tech => {
					const labels = {
						gutenberg: 'Gutenberg Blocks (@wordpress/blocks)',
						interactivity: 'Interactivity API (data-wp-* directives)',
						'rest-api': 'WordPress REST API (custom endpoints)',
						wpcli: 'WP-CLI (custom commands)',
						composer: 'Composer (PHP dependencies)',
						npm: 'npm/pnpm (JavaScript build process)',
						phpstan: 'PHPStan (static analysis)',
						playground: 'WordPress Playground (testing)',
					};
					return `- ${labels[tech] || tech}`;
				})
				.join('\n');

			// Update AGENTS.md tech stack section (basic replacement)
			agentsContent = agentsContent.replace(
				/\*\*Tooling\*\*: .*/,
				`**Tooling**: ${projectInfo.techStack.includes('composer') ? 'Composer for PHP' : ''}${projectInfo.techStack.includes('npm') ? `, ${detectedPackageManager} for JS` : ''}.`
			);

			writeFileSync(agentsPath, agentsContent, 'utf-8');
			p.log.success('Updated AGENTS.md');
		} catch (err) {
			p.log.warn(`Could not update AGENTS.md: ${err.message}`);
		}
	}

	// Workflow instructions
	if (existsSync(workflowPath)) {
		const customizeWorkflow = await p.confirm({
			message: 'Open workflow instructions for manual editing?',
			initialValue: false,
		});

		if (!p.isCancel(customizeWorkflow) && customizeWorkflow) {
			p.note(
				`Edit: ${workflowPath}\n\nAdd your project-specific:\n- Coding standards\n- Git workflow\n- Testing procedures\n- Deployment steps`,
				'Workflow Instructions'
			);
		}
	}

	// Next steps
	p.note(
		`✓ Kit installed and configured\n\n` +
		`Next steps:\n` +
		`1. Review ${agentsPath}\n` +
		`2. Customize .github/prompts/ for your domain\n` +
		`3. Test with: ${projectInfo.projectType === 'plugin' ? '"Create a new settings page"' : '"Generate a block variation"'}\n` +
		`4. Adjust skills loading in AGENTS.md as needed`,
		'Setup Complete'
	);

	p.outro('Your WordPress project is now AI-ready!');
}

main().catch((err) => {
	console.error('Setup failed:', err);
	process.exit(1);
});
