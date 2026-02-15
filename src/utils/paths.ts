import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Get the root directory of the package (where package.json lives)
// When running from src (ts-node), it's ../
// When running from dist (node), it's ../
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PACKAGE_ROOT = path.resolve(__dirname, '../../');
