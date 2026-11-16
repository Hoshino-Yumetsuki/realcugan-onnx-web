import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { basename, dirname, join } from "node:path"
import {
  Uint8ArrayReader,
  Uint8ArrayWriter,
  ZipWriter
} from "@zip.js/zip.js/lib/zip-core-native.js"
import { defineConfig, type Plugin } from "vite"
import vue from "@vitejs/plugin-vue"

const require = createRequire(import.meta.url)
const runtimeDir = dirname(require.resolve("onnxruntime-web"))
const codecDir = dirname(require.resolve("@imagemagick/magick-wasm"))
const runtimeFiles = [
  {
    fileName: "ort-runtime/ort-wasm-simd-threaded.asyncify.mjs",
    path: join(runtimeDir, "ort-wasm-simd-threaded.asyncify.mjs")
  },
  {
    fileName: "ort-runtime/ort-wasm-simd-threaded.asyncify.wasm.zip",
    path: join(runtimeDir, "ort-wasm-simd-threaded.asyncify.wasm")
  },
  {
    fileName: "image-codec/magick.wasm.zip",
    path: require.resolve("@imagemagick/magick-wasm/magick.wasm")
  },
  {
    fileName: "image-codec/LICENSE",
    path: join(codecDir, "..", "LICENSE")
  },
  {
    fileName: "image-codec/NOTICE",
    path: join(codecDir, "..", "NOTICE")
  }
]

async function ortRuntime(): Promise<Plugin> {
  const assets = await Promise.all(
    runtimeFiles.map(async ({ fileName, path }) => {
      if (!fileName.endsWith(".zip")) {
        return { fileName, source: readFileSync(path) }
      }
      const writer = new ZipWriter(new Uint8ArrayWriter(), { useWebWorkers: false })
      await writer.add(basename(path), new Uint8ArrayReader(readFileSync(path)))
      return { fileName, source: await writer.close() }
    })
  )
  return {
    name: "runtime-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname
        const asset = assets.find((entry) => entry.fileName === pathname.slice(1))
        if (!asset) return next()
        res.setHeader(
          "Content-Type",
          asset.fileName.endsWith(".zip")
            ? "application/zip"
            : asset.fileName.endsWith(".mjs")
              ? "text/javascript"
              : "text/plain"
        )
        res.end(asset.source)
      })
    },
    generateBundle() {
      for (const asset of assets) {
        this.emitFile({
          type: "asset",
          fileName: asset.fileName,
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
