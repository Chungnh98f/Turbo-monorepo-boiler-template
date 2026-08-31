#!/usr/bin/env tsx

import fs from 'node:fs';
import path from 'node:path';

const VALID_FOLDERS = ['apps', 'packages'] as const;
const VALID_TEMPLATES = ['node', 'react', 'lib'] as const;

type Folder = (typeof VALID_FOLDERS)[number];
type Template = (typeof VALID_TEMPLATES)[number];

const name = process.argv[2];
const folder = (process.argv[3] || 'packages') as Folder;
const template = (process.argv[4] || (folder === 'apps' ? 'node' : 'lib')) as Template;

// ── Validation ──────────────────────────────────────────────────────────────

if (!name) {
  console.error(
    'Usage: tsx tools/cli/src/createPackage.ts <name> [apps|packages] [node|react|lib]',
  );
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error(
    'Name must start with a lowercase letter and contain only lowercase letters, digits, and hyphens.',
  );
  process.exit(1);
}

if (!VALID_FOLDERS.includes(folder)) {
  console.error(`Folder must be one of: ${VALID_FOLDERS.join(', ')}`);
  process.exit(1);
}

if (!VALID_TEMPLATES.includes(template)) {
  console.error(`Template must be one of: ${VALID_TEMPLATES.join(', ')}`);
  process.exit(1);
}

const root = process.cwd();
const targetDir = path.join(root, folder, name);

if (fs.existsSync(targetDir)) {
  console.error(`"${folder}/${name}" already exists.`);
  process.exit(1);
}

// ── Templates ───────────────────────────────────────────────────────────────

function nodePackageJson(): string {
  return JSON.stringify(
    {
      name: `@repo/${name}`,
      version: '0.0.0',
      private: true,
      type: 'module',
      main: './dist/index.js',
      scripts: {
        build: 'tsc -p tsconfig.build.json',
        dev: 'tsx watch src/index.ts',
        start: 'node dist/index.js',
        lint: 'eslint .',
        typecheck: 'tsc --noEmit',
        test: 'vitest run',
        clean: 'rm -rf dist .turbo',
      },
      dependencies: {},
      devDependencies: {
        '@repo/config': 'workspace:*',
        '@types/node': 'catalog:',
        eslint: 'catalog:',
        tsx: 'catalog:',
        typescript: 'catalog:',
        vitest: 'catalog:',
      },
    },
    null,
    2,
  );
}

function reactPackageJson(): string {
  return JSON.stringify(
    {
      name: `@repo/${name}`,
      version: '0.0.0',
      private: true,
      type: 'module',
      scripts: {
        build: 'vite build',
        dev: 'vite',
        preview: 'vite preview',
        lint: 'eslint .',
        typecheck: 'tsc --noEmit',
        test: 'vitest run',
        clean: 'rm -rf dist .turbo',
      },
      dependencies: {
        react: 'catalog:',
        'react-dom': 'catalog:',
      },
      devDependencies: {
        '@repo/config': 'workspace:*',
        '@types/react': 'catalog:',
        '@types/react-dom': 'catalog:',
        '@vitejs/plugin-react': 'catalog:',
        eslint: 'catalog:',
        jsdom: 'catalog:',
        typescript: 'catalog:',
        vite: 'catalog:',
        vitest: 'catalog:',
      },
    },
    null,
    2,
  );
}

function libPackageJson(): string {
  return JSON.stringify(
    {
      name: `@repo/${name}`,
      version: '0.0.0',
      private: true,
      type: 'module',
      main: './src/index.ts',
      types: './src/index.ts',
      scripts: {
        lint: 'eslint .',
        typecheck: 'tsc --noEmit',
        test: 'vitest run',
        clean: 'rm -rf dist .turbo',
      },
      devDependencies: {
        '@repo/config': 'workspace:*',
        eslint: 'catalog:',
        typescript: 'catalog:',
        vitest: 'catalog:',
      },
    },
    null,
    2,
  );
}

function tsconfigContent(): string {
  const base = template === 'react' ? '@repo/config/tsconfig/react' : '@repo/config/tsconfig/node';

  return JSON.stringify(
    {
      extends: base,
      compilerOptions: { noEmit: true },
      include: ['src', 'eslint.config.js'],
    },
    null,
    2,
  );
}

function tsconfigBuildContent(): string {
  return JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: {
        outDir: 'dist',
        noEmit: false,
      },
      include: ['src'],
    },
    null,
    2,
  );
}

function eslintContent(): string {
  if (template === 'react') {
    return `import react from '@repo/config/eslint/react';\n\nexport default react;\n`;
  }
  return `import base from '@repo/config/eslint';\n\nexport default base;\n`;
}

function vitestConfigContent(): string {
  if (template === 'react') {
    return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});
`;
  }
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
`;
}

function viteConfigContent(): string {
  return `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
});
`;
}

function indexTsContent(): string {
  if (template === 'node') {
    return `console.log('Hello from @repo/${name}');\n`;
  }
  return `export {};\n`;
}

// ── Scaffold ────────────────────────────────────────────────────────────────

const packageJsonFn =
  template === 'node' ? nodePackageJson : template === 'react' ? reactPackageJson : libPackageJson;

fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

const files: Array<[string, string]> = [
  ['package.json', packageJsonFn()],
  ['tsconfig.json', tsconfigContent()],
  ['eslint.config.js', eslintContent()],
  ['vitest.config.ts', vitestConfigContent()],
  ['src/index.ts', indexTsContent()],
];

if (template === 'node') {
  files.push(['tsconfig.build.json', tsconfigBuildContent()]);
}

if (template === 'react') {
  files.push(['vite.config.ts', viteConfigContent()]);
}

for (const [filename, content] of files) {
  fs.writeFileSync(path.join(targetDir, filename), content);
}

console.log(`✔ Created ${folder}/${name} (template: ${template})`);
console.log('');
console.log('Next steps:');
console.log(`  pnpm install`);
console.log(`  pnpm --filter @repo/${name} dev`);
