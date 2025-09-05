#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const distDir = './dist';

// Function to fix imports in a file
function fixImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Replace relative imports without .js extension
  const fixedContent = content.replace(
    /from "\.\/([^"]+)";/g,
    'from "./$1.js";'
  );
  
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent);
    console.log(`Fixed imports in: ${filePath}`);
  }
}

// Function to recursively process files
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      fixImports(filePath);
    }
  }
}

// Process the dist directory
if (fs.existsSync(distDir)) {
  processDirectory(distDir);
  console.log('Import fixing complete!');
} else {
  console.error('Dist directory not found!');
  process.exit(1);
}
