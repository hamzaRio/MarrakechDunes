import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, '../attached_assets');
const dest = path.join(__dirname, '../dist/attached_assets');

if (fs.existsSync(src)) {
  // Create destination directory if it doesn't exist
  fs.mkdirSync(dest, { recursive: true });
  
  // Get all files from source directory
  const files = fs.readdirSync(src);
  
  // Copy each file
  files.forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
    }
  });
  
  console.log('Assets copied to dist/attached_assets');
} else {
  console.log('No attached_assets found');
}
