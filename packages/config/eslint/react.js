import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import base from './index.js';

/**
 * Base config plus React rules, for browser-targeted workspaces.
 *
 * @type {import('typescript-eslint').ConfigArray}
 */
export default [
  ...base,
  // v7 keeps the eslintrc-shaped configs at the top level; the flat ones live under `flat`.
  reactHooks.configs.flat['recommended-latest'],
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
];
