#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..');
const destDir = path.resolve(process.argv[2] || process.cwd());

fs.mkdirSync(destDir, { recursive: true });

const destGithub = path.join(destDir, '.github');
if (fs.existsSync(destGithub)) {
  fs.rmSync(destGithub, { recursive: true, force: true });
}
fs.cpSync(path.join(srcDir, '.github'), destGithub, { recursive: true });

const templatePath = path.join(srcDir, 'AGENTS.template.md');
if (fs.existsSync(templatePath)) {
  fs.copyFileSync(templatePath, path.join(destDir, 'AGENTS.template.md'));
}

const destAgents = path.join(destDir, 'AGENTS.md');
if (!fs.existsSync(destAgents)) {
  if (fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, destAgents);
  } else {
    fs.copyFileSync(path.join(srcDir, 'AGENTS.md'), destAgents);
  }
}

console.log(`Installed WordPress Agent Kit into: ${destDir}`);