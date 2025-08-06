const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const attachedDir = path.join(projectRoot, 'attached_assets');
const publicDir = path.join(projectRoot, 'client', 'public', 'attached_assets');

function copyAttachedAssets() {
  if (!fs.existsSync(attachedDir)) {
    console.warn('No attached_assets directory found, skipping copy.');
    return;
  }

  fs.mkdirSync(publicDir, { recursive: true });
  for (const file of fs.readdirSync(attachedDir)) {
    fs.copyFileSync(path.join(attachedDir, file), path.join(publicDir, file));
  }
  console.log('Copied attached_assets to client/public/attached_assets');
}

copyAttachedAssets();
