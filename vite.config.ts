import { createReadStream, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { defineConfig, type Plugin } from "vite"
import vue from "@vitejs/plugin-vue"

const require = createRequire(import.meta.url)
const runtimeDir = dirname(require.resolve("onnxruntime-web"))
const runtimeFiles = ["ort-wasm-simd-threaded.asyncify.mjs", "ort-wasm-simd-threaded.asyncify.wasm"]

function ortRuntime(): Plugin {
  return {
    name: "ort-runtime",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname
        const name = pathname.startsWith("/ort-runtime/")
          ? pathname.slice("/ort-runtime/".length)
          : ""
        if (!runtimeFiles.includes(name)) return next()
        res.setHeader(
          "Content-Type",
          name.endsWith(".wasm") ? "application/wasm" : "text/javascript"
        )
        createReadStream(join(runtimeDir, name)).pipe(res)
      })
    },
    generateBundle() {
      for (const name of runtimeFiles) {
        this.emitFile({
          type: "asset",
          fileName: `ort-runtime/${name}`,
          source: readFileSync(join(runtimeDir, name))
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
