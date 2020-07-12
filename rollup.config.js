import typescript from '@rollup/plugin-typescript';

export default {
  input: 'index.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node\n',
  },
  plugins: [typescript()],
  external: [
    'commander',
    'fs',
    'node-fetch',
  ]
};