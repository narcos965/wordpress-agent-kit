import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT } from '../utils/paths.js';

export async function installKit(targetDir: string) {
    console.log(`Installing WordPress Agent Kit into: ${targetDir}`);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const templatePath = path.join(PACKAGE_ROOT, 'AGENTS.template.md');
    const agentsPath = path.join(PACKAGE_ROOT, 'AGENTS.md');
    const githubPath = path.join(PACKAGE_ROOT, '.github');

    // Copy .github folder
    const targetGithub = path.join(targetDir, '.github');
    if (fs.existsSync(targetGithub)) {
      fs.rmSync(targetGithub, { recursive: true, force: true });
    }
    if (fs.existsSync(githubPath)) {
        fs.cpSync(githubPath, targetGithub, { recursive: true });
    } else {
        throw new Error('Could not find source .github directory.');
    }

    // Copy AGENTS.md
    const targetAgentsTemplate = path.join(targetDir, 'AGENTS.template.md');
    if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, targetAgentsTemplate);
    }

    const targetAgents = path.join(targetDir, 'AGENTS.md');
    if (!fs.existsSync(targetAgents)) {
        if (fs.existsSync(templatePath)) {
            fs.copyFileSync(templatePath, targetAgents);
        } else if (fs.existsSync(agentsPath)) {
             fs.copyFileSync(agentsPath, targetAgents);
        }
    }
}
