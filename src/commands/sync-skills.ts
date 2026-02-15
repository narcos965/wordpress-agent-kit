import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { run } from '../utils/run';

const OFFICIAL_SKILLS_REPO_URL = 'https://github.com/WordPress/agent-skills.git';
const DEFAULT_SKILLS_REF = 'trunk';

export const syncSkillsCommand = new Command('sync-skills')
  .description('Sync skills from the official WordPress agent-skills repository')
  .argument('[ref]', 'Branch or tag to checkout', DEFAULT_SKILLS_REF)
  .action((refPassed) => {
    // Check for custom URL args - simplistic check
    if (/^(https?:\/\/|git@)/i.test(refPassed)) {
      console.error('Custom skills repository URLs are not supported. This script syncs from the official WordPress/agent-skills repo only.');
      process.exit(2);
    }
    
    // Check if refPassed might contain URL (same check as above) or empty string
    const ref = refPassed || DEFAULT_SKILLS_REF;

    const repoRoot = process.cwd();
    const submodulePath = path.join('vendor', 'wp-agent-skills');
    const vendorSkillsDir = path.join(repoRoot, submodulePath);
    const submoduleGitDir = path.join(vendorSkillsDir, '.git');

    // Clone or update the skills repo (not as a submodule since it's gitignored)
    if (!fs.existsSync(submoduleGitDir)) {
      fs.mkdirSync(path.join(repoRoot, 'vendor'), { recursive: true });
      console.log(`Cloning ${OFFICIAL_SKILLS_REPO_URL} into ${submodulePath}...`);
      run('git', ['clone', OFFICIAL_SKILLS_REPO_URL, submodulePath], repoRoot);
    } else {
      console.log(`Updating existing skills repo at ${submodulePath}...`);
      run('git', ['fetch', '--all', '--tags'], vendorSkillsDir);
    }

    // Checkout the specified ref
    if (ref) {
      run('git', ['checkout', ref], vendorSkillsDir);
      run('git', ['pull', 'origin', ref], vendorSkillsDir);
    }

    const targetSkills = path.join(repoRoot, '.github', 'skills');
    const upstreamBuildScript = path.join(vendorSkillsDir, 'shared', 'scripts', 'skillpack-build.mjs');
    const upstreamInstallScript = path.join(vendorSkillsDir, 'shared', 'scripts', 'skillpack-install.mjs');

    if (fs.existsSync(upstreamBuildScript) && fs.existsSync(upstreamInstallScript)) {
      if (fs.existsSync(targetSkills)) {
        fs.rmSync(targetSkills, { recursive: true, force: true });
      }
      fs.mkdirSync(path.join(repoRoot, '.github'), { recursive: true });

      run('node', ['shared/scripts/skillpack-build.mjs', '--clean', '--targets=vscode'], vendorSkillsDir);
      run(
        'node',
        ['shared/scripts/skillpack-install.mjs', `--dest=${repoRoot}`, '--targets=vscode', '--from=dist', '--mode=replace'],
        vendorSkillsDir
      );

      console.log(`Synced skills into: ${targetSkills}`);
      console.log(`Skills source: ${OFFICIAL_SKILLS_REPO_URL}${ref ? ` @ ${ref}` : ''}`);
      console.log('Sync method: upstream skillpack-build.mjs + skillpack-install.mjs');
      // No process.exit here, let commander handle exit or fallthrough unless explicit stop
      return;
    }

    const sourceSkills = path.join(vendorSkillsDir, '.github', 'skills');
    if (!fs.existsSync(sourceSkills)) {
      console.error(`Could not find upstream skills directory at: ${sourceSkills}`);
      process.exit(1);
    }

    if (fs.existsSync(targetSkills)) {
      fs.rmSync(targetSkills, { recursive: true, force: true });
    }

    fs.mkdirSync(path.join(repoRoot, '.github'), { recursive: true });
    fs.cpSync(sourceSkills, targetSkills, { recursive: true });

    console.log(`Synced skills into: ${targetSkills}`);
    console.log(`Skills source: ${OFFICIAL_SKILLS_REPO_URL}${ref ? ` @ ${ref}` : ''}`);
    console.log('Sync method: fallback direct copy from .github/skills');
  });
