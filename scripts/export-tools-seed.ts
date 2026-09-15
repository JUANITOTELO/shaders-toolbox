import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allTools } from '../src/tools/registry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../backend/data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetPath = path.join(targetDir, 'seed_tools.json');
fs.writeFileSync(targetPath, JSON.stringify(allTools, null, 2), 'utf-8');
console.log(`Successfully exported ${allTools.length} tools to ${targetPath}`);
