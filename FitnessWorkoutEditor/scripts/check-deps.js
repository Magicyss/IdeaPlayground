#!/usr/bin/env node

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the project root directory (parent of scripts directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Check if node_modules exists in the project root
if (!existsSync(join(projectRoot, 'node_modules'))) {
  console.error('\n❌ Dependencies not installed. Please run: npm install\n');
  process.exit(1);
}
