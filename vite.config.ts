import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { gzipSync } from "node:zlib"
import { defineConfig, type Plugin } from "vite"
import vue from "@vitejs/plugin-vue"

const require = createRequire(import.meta.url)
const runtimeDir = dirname(require.resolve("onnxruntime-web"))
const runtimeFiles = [
  "ort-wasm-simd-threaded.asyncify.mjs",
  "ort-wasm-simd-threaded.asyncify.wasm.gz"
]

function ortRuntime(): Plugin {
  const assets = runtimeFiles.map((fileName) => {
    const compressed = fileName.endsWith(".gz")
    const source = readFileSync(join(runtimeDir, compressed ? fileName.slice(0, -3) : fileName))
    return { fileName, source: compressed ? gzipSync(source, { level: 9 }) : source }
  })
  return {
    name: "ort-runtime",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname
        const name = pathname.startsWith("/ort-runtime/")
          ? pathname.slice("/ort-runtime/".length)
          : ""
        const asset = assets.find((entry) => entry.fileName === name)
        if (!asset) return next()
        res.setHeader("Content-Type", name.endsWith(".gz") ? "application/gzip" : "text/javascript")
        res.end(asset.source)
      })
    },
    generateBundle() {
      for (const asset of assets) {
        this.emitFile({
          type: "asset",
          fileName: `ort-runtime/${asset.fileName}`,
          source: asset.source
        })
      }
    }
  }
}

export default defineConfig({
  base: "./",
  // External WASM entry avoids bundling a second copy of the runtime alongside ort-runtime/.
  resolve: { alias: { "onnxruntime-web/webgpu": join(runtimeDir, "ort.webgpu.min.mjs") } },
  plugins: [vue(), ortRuntime()],
  worker: { format: "es" }
})
