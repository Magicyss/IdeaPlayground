#!/usr/bin/env node

import { existsSync } from 'fs';

if (!existsSync('node_modules')) {
  console.error('\n❌ Dependencies not installed. Please run: npm install\n');
  process.exit(1);
}
