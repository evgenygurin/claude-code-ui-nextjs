const js = require('@eslint/js');
const globals = require('globals');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat();

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // Global ignores first
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/dist/**',
      '**/coverage/**',
      '*.config.js',
      '*.config.ts',
      '**/public/**',
      '**/__tests__/**',
      '**/*.test.{js,ts,tsx}',
      '**/jest.setup.js',
      '**/jest.config.js',
      '**/__mocks__/**',
    ]
  },
  
  // Next.js config
  ...compat.extends('next/core-web-vitals'),
  
  // JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        args: 'after-used',
      }],
      'prefer-const': 'error',
      'no-console': 'off', // Allow console statements in development
    },
  },
  
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        JSX: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      ...js.configs.recommended.rules,
      // Turn off JS rules covered by TS
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        args: 'after-used',
      }],
      'prefer-const': 'error',
      'no-console': 'off', // Allow console statements in development
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-case-declarations': 'off',
    },
  },
];