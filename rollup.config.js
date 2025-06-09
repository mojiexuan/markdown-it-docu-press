import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default defineConfig([
  // ESM构建
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      preserveModules: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.esm.json',
        declaration: true,
        declarationDir: 'dist/esm'
      }),
      terser()
    ],
    external: [/node_modules/]
  },
  // CommonJS构建
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      sourcemap: true,
      preserveModules: true
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.cjs.json',
        declaration: false
      }),
      terser()
    ],
    external: [/node_modules/]
  }
]);