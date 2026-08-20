/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
import { createServer, ViteDevServer } from 'vite';
import { resolve, dirname } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { existsSync, watch, statSync, readdirSync } from 'fs';
import { playgroundPlugin } from './vite-plugin';
import { CONFIG_EXAMPLE, ConfigError, resolvePlaygroundConfig } from './config';
// @ts-expect-error -- plain JS module shared with tailwind.config.js, no types
import { darkMode, theme } from '../tailwind.theme.js';
import type { ResolvedPlaygroundConfig } from './types';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONFIG_NAMES = [
  'playground.config.ts',
  'playground.config.js',
  'playground.config.mjs',
];

async function findConfig(): Promise<string | null> {
  const cwd = process.cwd();

  for (const name of CONFIG_NAMES) {
    const configPath = resolve(cwd, name);

    if (existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

async function loadConfig(configPath: string): Promise<ResolvedPlaygroundConfig> {
  // Add timestamp to bust ESM cache on reload
  const configUrl = `${pathToFileURL(configPath).href}?t=${Date.now()}`;
  const module = await import(configUrl);
  return resolvePlaygroundConfig(module.default || module);
}

function getWatchPaths(configPath: string): string[] {
  const cwd = process.cwd();
  const paths = [configPath];

  // Watch common source directories that might contain imported files
  const srcDirs = ['src', 'lib', 'entities', 'db', 'models'];
  for (const dir of srcDirs) {
    const dirPath = resolve(cwd, dir);
    if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
      paths.push(dirPath);
    }
  }

  // Also watch any .ts/.js files in the project root that might be imported
  try {
    const rootFiles = readdirSync(cwd);
    for (const file of rootFiles) {
      if (/\.(ts|js|mjs)$/.test(file) && !file.startsWith('.')) {
        paths.push(resolve(cwd, file));
      }
    }
  } catch {
    // Ignore errors
  }

  return paths;
}

function reportConfigError(err: unknown): void {
  console.error(`❌ Failed to load config: ${(err as Error).message}`);

  if (err instanceof ConfigError && err.hint) {
    console.error(`\n${err.hint}\n`);
  }
}

function logConfigSummary({ entities, collections }: ResolvedPlaygroundConfig): void {
  console.log(`📦 Entities: ${entities.map(({ type }) => type).join(', ')}`);

  const collectionNames = Object.keys(collections);

  if (collectionNames.length) {
    console.log(`📚 Collections: ${collectionNames.join(', ')}`);
  }
}

async function startServer(
  config: ResolvedPlaygroundConfig,
  isRestart = false,
): Promise<ViteDevServer> {
  const port = config.port || 3030;

  // Check if we have a built client (production mode when installed as package)
  const builtClientPath = resolve(__dirname, '../dist/client');
  const devClientPath = resolve(__dirname, 'client');

  const isBuiltClient = existsSync(builtClientPath);
  const clientRoot = isBuiltClient ? builtClientPath : devClientPath;

  const server = await createServer({
    configFile: false,
    root: clientRoot,
    server: {
      port,
      // Only auto-open on first start, not on restarts
      open: !isRestart && (config.autoOpen ?? true) === true,
    },
    plugins: [
      // Only add React plugin in dev mode
      ...(!isBuiltClient ? [(await import('@vitejs/plugin-react')).default()] : []),
      playgroundPlugin(config),
    ],
    resolve: {
      alias: {
        '@': isBuiltClient ? resolve(__dirname, 'client') : clientRoot,
      },
    },
    ...(!isBuiltClient && {
      css: {
        postcss: {
          plugins: [
            (
              await import('tailwindcss')
            ).default({
              config: {
                darkMode,
                theme,
                content: [resolve(clientRoot, '**/*.{html,js,ts,jsx,tsx}')],
                plugins: [(await import('tailwindcss-animate')).default],
              },
            }),
            (await import('autoprefixer')).default(),
          ],
        },
      },
    }),
  });

  await server.listen();
  return server;
}

async function main() {
  console.log('\n🎮 DynamoDB Provider Playground\n');

  // Find config
  const configPath = await findConfig();
  if (!configPath) {
    console.error('❌ No config file found.');
    console.error('   Create a playground.config.ts file in your project root:\n');
    console.error(CONFIG_EXAMPLE);
    process.exit(1);
  }

  console.log(`📁 Config: ${configPath}`);

  let config: ResolvedPlaygroundConfig;
  try {
    config = await loadConfig(configPath);
  } catch (err) {
    reportConfigError(err);
    process.exit(1);
  }

  logConfigSummary(config);

  // Start the server
  const port = config.port || 3030;
  let server = await startServer(config);

  console.log(`\n✨ Playground ready at http://localhost:${port}`);
  console.log('👀 Watching for config changes...\n');

  // Set up file watching for hot-reload
  const watchPaths = getWatchPaths(configPath);
  const watchers: ReturnType<typeof watch>[] = [];
  let isRestarting = false;
  let restartTimeout: ReturnType<typeof setTimeout> | null = null;

  const restart = async () => {
    if (isRestarting) return;
    isRestarting = true;

    console.log('\n🔄 Config change detected, restarting...\n');

    try {
      await server.close();

      const newConfig = await loadConfig(configPath);

      logConfigSummary(newConfig);

      server = await startServer(newConfig, true);

      console.log(
        `\n✨ Playground restarted at http://localhost:${newConfig.port || 3030}\n`,
      );
    } catch (err) {
      reportConfigError(err);
      console.log('   Fix the error and save again to retry.\n');
    }

    isRestarting = false;
  };

  const scheduleRestart = () => {
    // Debounce restarts
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
    restartTimeout = setTimeout(restart, 300);
  };

  // Watch config file and directories
  for (const watchPath of watchPaths) {
    try {
      const watcher = watch(watchPath, { recursive: true }, (eventType, filename) => {
        // Only react to .ts, .js, .mjs files
        if (filename && /\.(ts|js|mjs)$/.test(filename)) {
          scheduleRestart();
        }
      });
      watchers.push(watcher);
    } catch {
      // Ignore watch errors for individual paths
    }
  }

  // Clean up on exit
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');
    for (const watcher of watchers) {
      watcher.close();
    }
    await server.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
