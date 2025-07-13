import fs from 'fs';
import path from 'path';

// Directory containing assets relative to this script
const assetsDir = path.join(__dirname, 'client', 'public', 'assets');

// List of images we want to keep
const keepFiles = new Set([
  'ourika-valley-1.jpg',
  'Ouzoud-Waterfalls_1750780266345.jpg',
  'agafay-2.jpg',
  'agafaypack1.jpeg',
  'essaouira-trip1.jpg',
  'essaouira-1.jpg',
  'hot-air-balloon1.jpg',
  'montgolfiere-1.jpg',
  'agafay-1.jpg',
  'Ouzoud-Waterfalls3_1750780266346.jpg',
  'ouzoud-1.jpg'
]);

function removeIfNotKept(entry: string) {
  const filePath = path.join(assetsDir, entry);
  const stat = fs.lstatSync(filePath);
  if (stat.isDirectory()) {
    if (!keepFiles.has(entry)) {
      fs.rmSync(filePath, { recursive: true, force: true });
      console.log(`Removed directory: ${entry}`);
    }
    return;
  }
  if (!keepFiles.has(entry)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted file: ${entry}`);
  }
}

function main() {
  if (!fs.existsSync(assetsDir)) {
    console.error(`Assets directory not found: ${assetsDir}`);
    process.exit(1);
  }
  const entries = fs.readdirSync(assetsDir);
  for (const entry of entries) {
    removeIfNotKept(entry);
  }
}

main();
