import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': ['warn', { 
        vars: 'all', 
        args: 'after-used', 
        ignoreRestSiblings: true,
        varsIgnorePattern: 'React|^[A-Z]|motion' // Ignore React, component names, and motion
      }],
      'react-hooks/exhaustive-deps': 'warn',
      'no-empty': 'warn',
      'no-undef': 'error',
      'no-useless-escape': 'off', // Turning this off as well to avoid future headaches with these complex regexes
    },
  },
]
