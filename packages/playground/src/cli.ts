/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
import { createServer, ViteDevServer } from 'vite';
import { resolve, dirname } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { existsSync, watch, statSync, readdirSync } from 'fs';
import { playgroundPlugin } from './vite-plugin.js';
import type { PlaygroundConfig } from './types.js';

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

async function loadConfig(configPath: string): Promise<PlaygroundConfig> {
  // Add timestamp to bust ESM cache on reload
  const configUrl = `${pathToFileURL(configPath).href}?t=${Date.now()}`;
  const module = await import(configUrl);
  return module.default || module;
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

function validateConfig(config: unknown): asserts config is PlaygroundConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object');
  }

  const cfg = config as Record<string, unknown>;

  if (!cfg.table) {
    throw new Error('Config must include a "table" property (SingleTable instance)');
  }

  if (!cfg.entities || typeof cfg.entities !== 'object') {
    throw new Error('Config must include an "entities" object with named entity exports');
  }

  const entityCount = Object.keys(cfg.entities as object).length;
  if (entityCount === 0) {
    throw new Error('Config must include at least one entity');
  }
}

async function startServer(config: PlaygroundConfig, isRestart = false): Promise<ViteDevServer> {
  const port = config.port || 3030;
  const clientRoot = resolve(__dirname, 'client');

  const server = await createServer({
    configFile: false,
    root: clientRoot,
    server: {
      port,
      // Only auto-open on first start, not on restarts
      open: !isRestart && (config.autoOpen ?? true) === true,
    },
    plugins: [(await import('@vitejs/plugin-react')).default(), playgroundPlugin(config)],
    resolve: {
      alias: {
        '@': clientRoot,
      },
    },
    css: {
      postcss: {
        plugins: [
          (
            await import('tailwindcss')
          ).default({
            config: {
              darkMode: ['class'],
              content: [resolve(clientRoot, '**/*.{html,js,ts,jsx,tsx}')],
              theme: {
                extend: {
                  colors: {
                    border: 'hsl(var(--border))',
                    input: 'hsl(var(--input))',
                    ring: 'hsl(var(--ring))',
                    background: 'hsl(var(--background))',
                    foreground: 'hsl(var(--foreground))',
                    primary: {
                      DEFAULT: 'hsl(var(--primary))',
                      foreground: 'hsl(var(--primary-foreground))',
                    },
                    secondary: {
                      DEFAULT: 'hsl(var(--secondary))',
                      foreground: 'hsl(var(--secondary-foreground))',
                    },
                    destructive: {
                      DEFAULT: 'hsl(var(--destructive))',
                      foreground: 'hsl(var(--destructive-foreground))',
                    },
                    muted: {
                      DEFAULT: 'hsl(var(--muted))',
                      foreground: 'hsl(var(--muted-foreground))',
                    },
                    accent: {
                      DEFAULT: 'hsl(var(--accent))',
                      foreground: 'hsl(var(--accent-foreground))',
                    },
                    popover: {
                      DEFAULT: 'hsl(var(--accent))',
                      foreground: 'hsl(var(--accent-foreground))',
                    },
                    card: {
                      DEFAULT: 'hsl(var(--card))',
                      foreground: 'hsl(var(--card-foreground))',
                    },
                  },
                  borderRadius: {
                    lg: 'var(--radius)',
                    md: 'calc(var(--radius) - 2px)',
                    sm: 'calc(var(--radius) - 4px)',
                  },
                },
              },
              plugins: [(await import('tailwindcss-animate')).default],
            },
          }),
          (await import('autoprefixer')).default(),
        ],
      },
    },
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
    console.error(`   import { table } from './src/db'
   import { User, Product } from './src/entities'

   export default {
     table,
     entities: { User, Product },
   }`);
    process.exit(1);
  }

  console.log(`📁 Config: ${configPath}`);

  // Load and validate config
  let config: PlaygroundConfig;
  try {
    config = await loadConfig(configPath);
    validateConfig(config);
  } catch (err) {
    console.error(`❌ Failed to load config: ${(err as Error).message}`);
    process.exit(1);
  }

  const entityNames = Object.keys(config.entities);
  const collectionNames = Object.keys(config.collections || {});
  console.log(`📦 Entities: ${entityNames.join(', ')}`);
  if (collectionNames.length > 0) {
    console.log(`📚 Collections: ${collectionNames.join(', ')}`);
  }

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
      // Close current server
      await server.close();

      // Reload config
      const newConfig = await loadConfig(configPath);
      validateConfig(newConfig);

      const newEntityNames = Object.keys(newConfig.entities);
      const newCollectionNames = Object.keys(newConfig.collections || {});
      console.log(`📦 Entities: ${newEntityNames.join(', ')}`);
      if (newCollectionNames.length > 0) {
        console.log(`📚 Collections: ${newCollectionNames.join(', ')}`);
      }

      // Start new server
      server = await startServer(newConfig, true);

      console.log(`\n✨ Playground restarted at http://localhost:${newConfig.port || 3030}\n`);
    } catch (err) {
      console.error(`❌ Failed to restart: ${(err as Error).message}`);
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
