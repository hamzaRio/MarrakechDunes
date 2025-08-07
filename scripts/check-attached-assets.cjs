const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'client', 'public');

/**
 * Copy a directory into client/public preserving all sub-directories
 * @param {string} dir name of source directory at repo root
 */
function copyDir(dir) {
  const source = path.join(projectRoot, dir);
  const target = path.join(publicRoot, dir);

  if (!fs.existsSync(source)) {
    console.warn(`No ${dir} directory found, skipping copy.`);
    return;
  }

  fs.mkdirSync(target, { recursive: true });
  // fs.cpSync is available in Node 16+ and copies recursively
  fs.cpSync(source, target, { recursive: true });
  console.log(`Copied ${dir} to client/public/${dir}`);
}

// Ensure both assets directories are available to the client build
for (const dir of ['assets', 'attached_assets']) {
  copyDir(dir);
}
