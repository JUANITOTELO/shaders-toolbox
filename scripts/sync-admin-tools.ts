import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceRoot = path.resolve(__dirname, '..');
const targetRoot = path.resolve('/home/hto/GitHub/experiments/admin-tools/shaders-toolbox');

function log(msg: string) {
  console.log(`[sync-admin-tools] ${msg}`);
}

function copyDirRecursive(src: string, dest: string, exclude: string[] = []) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function runSync() {
  log(`Starting synchronization to ${targetRoot}...`);

  // 1. Ensure target directory structure exists
  log('Creating target directory layout...');
  const dirs = [
    targetRoot,
    path.join(targetRoot, 'dist'),
    path.join(targetRoot, 'api'),
    path.join(targetRoot, 'api', 'config'),
    path.join(targetRoot, 'api', 'data'),
    path.join(targetRoot, 'src')
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 2. Build production frontend with base /admin-tools/shaders-toolbox/
  log('Building production bundle with base /admin-tools/shaders-toolbox/...');
  execSync('npx vite build --mode production', {
    cwd: sourceRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      BUILD_FOR_ADMIN: 'true',
      VITE_BASE_PATH: '/admin-tools/shaders-toolbox/'
    }
  });

  // Verify dist was created
  const distHtml = path.join(sourceRoot, 'dist', 'index.html');
  if (!fs.existsSync(distHtml)) {
    throw new Error(`Build failed: ${distHtml} does not exist`);
  }
  const htmlContent = fs.readFileSync(distHtml, 'utf-8');
  if (!htmlContent.includes('/admin-tools/shaders-toolbox/assets/')) {
    console.warn('Warning: dist/index.html does not appear to contain base /admin-tools/shaders-toolbox/assets/');
  }

  // 3. Sync dist/ to target
  log('Syncing dist/ to admin-tools/shaders-toolbox/dist/...');
  copyDirRecursive(path.join(sourceRoot, 'dist'), path.join(targetRoot, 'dist'));

  // 4. Sync backend API & SQLite database
  log('Packaging and syncing PHP backend and SQLite database to api/...');
  const backendApiDir = path.join(sourceRoot, 'backend', 'api');
  const targetApiDir = path.join(targetRoot, 'api');

  // Copy PHP endpoints: tools.php, categories.php, presets.php
  const endpoints = ['tools.php', 'categories.php', 'presets.php'];
  for (const file of endpoints) {
    const src = path.join(backendApiDir, file);
    const dest = path.join(targetApiDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // Copy config/database.php
  const dbConfigSrc = path.join(sourceRoot, 'backend', 'config', 'database.php');
  const dbConfigDest = path.join(targetApiDir, 'config', 'database.php');
  if (fs.existsSync(dbConfigSrc)) {
    fs.copyFileSync(dbConfigSrc, dbConfigDest);
  }

  // Copy data/seed_tools.json
  const seedSrc = path.join(sourceRoot, 'backend', 'data', 'seed_tools.json');
  const seedDest = path.join(targetApiDir, 'data', 'seed_tools.json');
  if (fs.existsSync(seedSrc)) {
    fs.copyFileSync(seedSrc, seedDest);
  }

  // Copy database.sqlite
  const dbSrc = path.join(sourceRoot, 'backend', 'database.sqlite');
  if (fs.existsSync(dbSrc)) {
    // Copy to both api/database.sqlite and api/data/database.sqlite for maximum compatibility
    const dest1 = path.join(targetApiDir, 'database.sqlite');
    const dest2 = path.join(targetApiDir, 'data', 'database.sqlite');
    fs.copyFileSync(dbSrc, dest1);
    fs.copyFileSync(dbSrc, dest2);
    try {
      fs.chmodSync(dest1, 0o666);
      fs.chmodSync(dest2, 0o666);
    } catch {}
  }

  // Copy or generate api/.htaccess
  const apiHtaccessSrc = path.join(sourceRoot, 'backend', '.htaccess');
  const apiHtaccessDest = path.join(targetApiDir, '.htaccess');
  if (fs.existsSync(apiHtaccessSrc)) {
    fs.copyFileSync(apiHtaccessSrc, apiHtaccessDest);
  } else {
    fs.writeFileSync(
      apiHtaccessDest,
      `<FilesMatch "\\.(sqlite|db|sql|ini|env)$">\n  Order deny,allow\n  Deny from all\n</FilesMatch>\n<Files "database.php">\n  Order deny,allow\n  Deny from all\n</Files>\n`,
      'utf-8'
    );
  }

  // 5. Copy source and config so target can be built independently by deploy-admin-tools.sh
  log('Syncing project files and dependencies for independent builds...');
  const rootFiles = ['package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'index.html'];
  for (const f of rootFiles) {
    const src = path.join(sourceRoot, f);
    const dest = path.join(targetRoot, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
  copyDirRecursive(path.join(sourceRoot, 'src'), path.join(targetRoot, 'src'));

  // 6. Generate root .htaccess for SPA fallback
  log('Writing root .htaccess for SPA routing...');
  const rootHtaccess = path.join(targetRoot, '.htaccess');
  const rootHtaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin-tools/shaders-toolbox/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /admin-tools/shaders-toolbox/index.html [L]
</IfModule>
`;
  fs.writeFileSync(rootHtaccess, rootHtaccessContent, 'utf-8');

  // 7. Generate metadata.json
  log('Writing metadata.json...');
  const metadata = {
    name: 'ShaderStudio: GPU Shader Toolbox',
    description: 'Interactive WebGL & GLSL shader development environment with real-time compilation, mathematical documentation, and algorithmic challenge runners.',
    requestFramePermissions: [],
    majorCapabilities: []
  };
  fs.writeFileSync(path.join(targetRoot, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');

  // 8. Validate output
  log('Validating synchronized files...');
  const checks = [
    { path: path.join(targetRoot, 'dist', 'index.html'), name: 'Frontend HTML' },
    { path: path.join(targetRoot, 'api', 'tools.php'), name: 'API: tools.php' },
    { path: path.join(targetRoot, 'api', 'categories.php'), name: 'API: categories.php' },
    { path: path.join(targetRoot, 'api', 'presets.php'), name: 'API: presets.php' },
    { path: path.join(targetRoot, 'api', 'config', 'database.php'), name: 'API Database Config' },
    { path: path.join(targetRoot, 'api', 'database.sqlite'), name: 'SQLite Database' },
    { path: path.join(targetRoot, 'api', '.htaccess'), name: 'API Security .htaccess' },
    { path: path.join(targetRoot, 'metadata.json'), name: 'Catalog metadata.json' },
    { path: path.join(targetRoot, '.htaccess'), name: 'Root SPA .htaccess' }
  ];

  let allOk = true;
  for (const check of checks) {
    if (!fs.existsSync(check.path) || fs.statSync(check.path).size === 0) {
      console.error(`❌ Validation failed: ${check.name} missing or empty at ${check.path}`);
      allOk = false;
    } else {
      log(`  ✓ ${check.name} (${fs.statSync(check.path).size} bytes)`);
    }
  }

  if (allOk) {
    log('✨ Synchronization successfully completed! Shaders Toolbox is ready in admin-tools.');
  } else {
    throw new Error('Sync finished with errors');
  }
}

try {
  runSync();
} catch (err: any) {
  console.error('[sync-admin-tools] Error:', err.message);
  process.exit(1);
}
