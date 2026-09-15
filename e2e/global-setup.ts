import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function globalSetup() {
  const resetScript = path.resolve(__dirname, '../scripts/reset-db.php');
  try {
    execSync(`php "${resetScript}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error('Failed to reset database in global setup:', err);
  }
}
