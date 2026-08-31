import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Base flat config for every workspace in the monorepo.
 *
 * `projectService: true` turns on type-aware linting, which is why this repo
 * stays on TypeScript 5.x — typescript-eslint 8.x peer-requires <6.1.0.
 * See README before bumping TypeScript.
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', '**/.turbo/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Config files are not covered by the app tsconfigs; lint them without type info.
  {
    files: ['**/*.config.{js,ts,mjs,cjs}', '**/eslint.config.js', 'packages/config/**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  // Must stay last: turns off stylistic rules that fight Prettier.
  prettier,
);
