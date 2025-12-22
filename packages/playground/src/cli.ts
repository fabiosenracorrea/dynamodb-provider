import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { existsSync } from 'fs';
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
  const configUrl = pathToFileURL(configPath).href;
  const module = await import(configUrl);
  return module.default || module;
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

  // Start Vite dev server with our plugin
  const port = config.port || 3030;
  const clientRoot = resolve(__dirname, 'client');
  const packageRoot = resolve(__dirname, '..');

  const server = await createServer({
    configFile: false,
    root: clientRoot,
    server: {
      port,
      open: true,
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
          (await import('tailwindcss')).default({
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

  console.log(`\n✨ Playground ready at http://localhost:${port}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
