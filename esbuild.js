import * as esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['src/index.ts'],
  tsconfig: 'tsconfig.json',
  bundle: true,
  minify: true,
  sourcemap: false,
  format: "esm",
  charset: "utf8",
  target: ['node22'],
  platform: "node",
  legalComments: "none",
  outfile: 'dist/bundle.js',
  banner: {
    js: "import { createRequire as topLevelCreateRequire } from 'module'; const require = topLevelCreateRequire(import.meta.url);"
  },
})

await ctx.watch()
console.log('watching...')
