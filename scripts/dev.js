import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import esbuild from 'esbuild'
import { createRequire } from 'node:module'

/**
 * 解析命令行参数
 */
const {
  values: { format },
  positionals,
} = parseArgs({
  allowPositionals: true,
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'esm',
    },
  },
})

// 创建 esm 的 __filename
const __filename = fileURLToPath(import.meta.url)
// 创建 esm 的 __dirname
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

const target = positionals?.[0] ?? 'vue' // 打包的模块
const pkg = require(`../packages/${target}/package.json`) // 打包模块的 package.json
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`) // 打包入口文件
/**
 * 打包输出文件
 * esm ==> ${target}.esm.js
 * cjs ==> ${target}.cjs.js
 * iife ==> ${target}.iife.js
 */
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`,
)

esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile, // 输出文件
    format, // 打包格式
    platform: format === 'cjs' ? 'node' : 'browser', // 打包平台
    bundle: true, // 把所有的依赖打包到一个文件中
    sourcemap: true, // 生成 source map
    globalName: pkg.buildOptions.name, // iife 格式导出的全局变量名
  })
  .then(ctx => {
    ctx.watch() // 监听文件变化重新打包
  })
