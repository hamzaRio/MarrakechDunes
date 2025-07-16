// scripts/fix-import-extensions.js
const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      fixImports(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const updated = content.replace(/(from\s+['"][^'"]+?)(?<!\.js)(['"])/g, '$1.js$2');
      fs.writeFileSync(fullPath, updated, 'utf8');
    }
  }
}

const distDir = path.resolve(__dirname, '../server/dist');
fixImports(distDir);
console.log('✅ All .js extensions fixed in dist directory.');
