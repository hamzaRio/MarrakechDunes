const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../server/dist');

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (entry.endsWith('.js')) {
      fixFile(full);
    }
  }
}

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Replace static imports
  content = content.replace(/(from\s+['"])(\.\.?(?:\/[^'";]+)+?)(?:(?:\.ts)?)(['"])/g, (m, p1, p2, p3) => {
    if (p2.endsWith('.js') || p2.endsWith('.json')) return m;
    return `${p1}${p2}.js${p3}`;
  });
  // Replace dynamic imports
  content = content.replace(/(import\(\s*['"])(\.\.?(?:\/[^'";]+)+?)(?:(?:\.ts)?)(['"]\s*\))/g, (m, p1, p2, p3) => {
    if (p2.endsWith('.js') || p2.endsWith('.json')) return m;
    return `${p1}${p2}.js${p3}`;
  });
  fs.writeFileSync(file, content);
}

walk(distDir);

