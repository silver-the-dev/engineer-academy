// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', 'modules/*/android/*'],
  },
  {
    rules: {
      // React Compiler rules: the compiler is not enabled in this project (app.json has no
      // experiments.reactCompiler), and the flagged code uses standard React Native idioms
      // such as useRef(new Animated.Value(0)).current and Date.now() seeds inside useMemo.
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // TypeScript already checks namespace members (and this rule misreads expo-notifications).
      'import/namespace': 'off',
    },
  },
  {
    files: ['scripts/**/*.cjs', 'scripts/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
  },
]);
