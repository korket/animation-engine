import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', 'out/**', '.cache/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/consistent-type-imports': 'error' },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': hooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: [
      'packages/{engine,scene-schema,assets,animation,characters}/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react-dom',
                'react-dom/*',
                'remotion',
                'remotion/*',
                '@remotion/*',
                '@animation-engine/dashboard',
                '@animation-engine/renderer',
                '**/apps/**',
              ],
              message:
                'Core scene semantics must remain independent of UI and rendering.',
            },
          ],
        },
      ],
    },
  },
];
