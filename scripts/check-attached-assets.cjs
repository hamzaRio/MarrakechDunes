const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'client', 'src');
const publicAssetsDir = path.join(projectRoot, 'client', 'public', 'assets');
const attachedDir = path.join(projectRoot, 'attached_assets');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(res, files);
    } else {
      files.push(res);
    }
  }
  return files;
}

function collectReferencedAssets() {
  const result = new Set();
  const files = walk(srcDir);
  const assetRegex = /["'`](?:\/assets\/|@assets\/)([^"'`$]+)["'`]/g;
  const attachedRegex = /["'`]\/attached_assets\/([^"'`]+)["'`]/g;
  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = assetRegex.exec(content))) {
      result.add(match[1]);
    }
    while ((match = attachedRegex.exec(content))) {
      result.add(match[1]);
    }
  }
  return Array.from(result).filter(a => !a.includes('placeholder') && !a.includes('$'));
}

function copyAttachedAssets() {
  if (!fs.existsSync(attachedDir)) {
    console.warn('No attached_assets directory found, skipping copy.');
    return;
  }
  if (!fs.existsSync(publicAssetsDir)) {
    fs.mkdirSync(publicAssetsDir, { recursive: true });
  }
  for (const file of fs.readdirSync(attachedDir)) {
    const src = path.join(attachedDir, file);
    const dest = path.join(publicAssetsDir, file);
    try {
      fs.copyFileSync(src, dest);
    } catch (err) {
      console.warn(`Failed to copy ${file}: ${err.message}`);
    }
  }
}

function checkMissingAssets(referenced) {
  const missing = [];
  for (const asset of referenced) {
    if (!fs.existsSync(path.join(publicAssetsDir, asset))) {
      missing.push(asset);
    }
  }
  if (missing.length) {
    console.warn('Missing assets: ' + missing.join(', '));
  }
}

const referenced = collectReferencedAssets();
copyAttachedAssets();
checkMissingAssets(referenced);