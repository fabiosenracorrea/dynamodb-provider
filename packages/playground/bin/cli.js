#!/usr/bin/env node

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cliPath = resolve(__dirname, '../src/cli.ts')

// Use tsx to run the TypeScript CLI
const child = spawn('npx', ['tsx', cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
