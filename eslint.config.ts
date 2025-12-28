import js from '@eslint/js'
import json from '@eslint/json'
import markdown from '@eslint/markdown'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-plugin-prettier/recommended'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'

const strictMode = process.env.STRICT_MODE === 'true'

const warningInStrictMode = strictMode ? 'warn' : 0
const errorInStrictMode = strictMode ? 'error' : 0
const errorInStrictModeAndWarningOtherwise = strictMode ? 'error' : 'warn'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js, prettier },
    extends: ['js/recommended', prettierConfig],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    ignores: ['**/.*', 'dist/**'],
    rules: {
      'no-constant-condition': warningInStrictMode,
      'no-debugger': errorInStrictModeAndWarningOtherwise,
      'no-empty-pattern': 'off',
      'prettier/prettier': errorInStrictMode,
      'spaced-comment': [errorInStrictModeAndWarningOtherwise, 'always', { markers: ['/'] }],
    },
  },
  typescriptEslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended'],
    ignores: ['package-lock.json', 'dist/**'],
  },
  {
    files: ['**/*.json5'],
    plugins: { json },
    language: 'json/json5',
    extends: ['json/recommended'],
    ignores: ['dist/**'],
  },
  {
    files: ['**/*.md'],
    plugins: { markdown },
    language: 'markdown/gfm',
    extends: ['markdown/recommended'],
    ignores: ['**/*.md', 'dist/**'],
  },
])
