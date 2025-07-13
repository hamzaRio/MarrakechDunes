/**
 * Script to safely delete unused duplicate images in /client/public/assets
 * Reference list of files to KEEP is from the asset usage report.
 */

const fs = require("fs");
const path = require("path");

const assetDir = path.join(__dirname, "../client/public/assets");

// Images to keep
const keepFiles = new Set([
  "ourika-valley-1.jpg",
  "Ouzoud-Waterfalls_1750780266345.jpg",
  "agafay-2.jpg",
  "agafaypack1.jpeg",
  "essaouira-trip1.jpg",
  "hot-air-balloon1.jpg",
  "montgolfiere-1.jpg",
  "essaouira-1.jpg",
  "agafay-1.jpg",
  "Ouzoud-Waterfalls3_1750780266346.jpg",
  "ouzoud-1.jpg",
]);

// Delete only image files that are NOT in keepFiles
fs.readdirSync(assetDir).forEach((file) => {
  const fullPath = path.join(assetDir, file);
  if (
    fs.statSync(fullPath).isFile() &&
    /\.(jpg|jpeg|png)$/i.test(file) &&
    !keepFiles.has(file)
  ) {
    console.log("\u{1F5D1}\uFE0F Deleting unused file:", file);
    fs.unlinkSync(fullPath);
  }
});
