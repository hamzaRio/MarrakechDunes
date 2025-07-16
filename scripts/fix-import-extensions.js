// scripts/fix-import-extensions.js
const fs = require('fs');
const path = require('path');

const CORE_MODULES = new Set([
  'path', 'fs', 'url', 'os', 'util', 'http', 'https', 'stream', 'events', 'buffer', 'crypto', 'zlib'
]);

function fixImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      fixImports(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      content = content.replace(/from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
        const isRelative = importPath.startsWith('./') || importPath.startsWith('../');
        if (
          !isRelative ||
          CORE_MODULES.has(importPath) ||
          importPath.endsWith('.js') ||
          importPath.startsWith('http')
        ) {
          return match; // do not touch
        }
        return `from "${importPath}.js"`;
      });

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

const distDir = path.resolve(__dirname, '../server/dist');
fixImports(distDir);
console.log('✅ All .js extensions fixed in dist directory.');
