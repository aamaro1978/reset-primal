const js = require('@eslint/js');

module.exports = [
  {
    ignores: ['node_modules/', 'coverage/', 'dist/', '.next/', 'build/']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        // Node.js globals
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        clearImmediate: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        global: 'readonly',
        process: 'readonly',
        setImmediate: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        // Web APIs available in Node.js 18+
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        // CommonJS
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'arrow-spacing': 'error',
      'no-trailing-spaces': 'error',
      'max-len': ['warn', { code: 100, ignoreUrls: true, ignoreStrings: true }],
      'no-multiple-empty-lines': ['error', { max: 2 }]
    }
  }
];
