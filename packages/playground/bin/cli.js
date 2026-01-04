#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve tsx binary from node_modules
let tsxBin;
try {
  // Find tsx package location
  const tsxPkgPath = require.resolve('tsx/package.json');
  const tsxPkgDir = dirname(tsxPkgPath);
  // tsx's bin is at tsx/dist/cli.mjs
  tsxBin = resolve(tsxPkgDir, 'dist/cli.mjs');
} catch (err) {
  console.error('Error: tsx is not installed. This should not happen.');
  console.error('Please report this issue.');
  process.exit(1);
}

const cliPath = resolve(__dirname, '../src/cli.ts');

// Run the TypeScript CLI directly with tsx
const child = spawn('node', [tsxBin, cliPath], {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
