/// <reference lib="webworker" />
import * as ort from "onnxruntime-web/webgpu"
import { ImageMagick, MagickColors } from "@imagemagick/magick-wasm"
import { MODELS, type Model } from "./models"
import { alphaSampler, rgbTensor, tileRgba, tiles, type Tile } from "./image"
import { decodeImage, pngBlob, previewImage } from "./image-codec"
import { loadRuntimeZip } from "./runtime"
import type { Backend, ProcessOptions, ProcessRequest, Progress, WorkerResponse } from "./processor"

const scope = self as unknown as DedicatedWorkerGlobalScope
let session: ort.InferenceSession | undefined
let sessionKey = ""
let modelBytes: { id: string; bytes: Uint8Array } | undefined
let busy = false
let assetBaseUrl = ""
let wasmInitialized = false

function progress(stage: Progress["stage"], completed = 0, total = 0): void {
  scope.postMessage({
    type: "progress",
    progress: { stage, completed, total }
  } satisfies WorkerResponse)
}

async function download(model: Model): Promise<Uint8Array> {
  progress("download")
  // Versioned local model URLs can use the HTTP cache without stale-model ambiguity.
  const response = await fetch(new URL(model.url, assetBaseUrl), { cache: "force-cache" })
  if (!response.ok) throw new Error(`Model download failed: HTTP ${response.status} (${model.id}).`)
  const total = Number(response.headers.get("content-length")) || 0
  if (!response.body) return new Uint8Array(await response.arrayBuffer())
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      length += value.byteLength
      progress("download", length, total)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  progress("download", length, length)
  return bytes
}

async function loadSession(
  model: Model,
  width: number,
  height: number,
  backend: Backend
): Promise<ort.InferenceSession> {
  const key = `${backend}:${model.id}:${width}x${height}`
  if (session && sessionKey === key) return session
  if (session) {
    await session.release()
    session = undefined
    sessionKey = ""
  }
  if (backend === "webgpu" && (!navigator.gpu || !(await navigator.gpu.requestAdapter()))) {
    throw new Error(
      "WebGPU is unavailable. Use HTTPS/localhost and a WebGPU-capable browser and GPU. CPU fallback is disabled."
    )
  }
  if (modelBytes?.id !== model.id) modelBytes = { id: model.id, bytes: await download(model) }
  progress("initialize")
  if (!wasmInitialized) {
    const fileName = "ort-wasm-simd-threaded.asyncify.wasm"
    ort.env.wasm.wasmBinary = await loadRuntimeZip(
      new URL(`ort-runtime/${fileName}.zip`, assetBaseUrl),
      fileName
    )
  }
  try {
    session = await ort.InferenceSession.create(modelBytes.bytes, {
      executionProviders: [backend],
      // Fail rather than silently assigning unsupported WebGPU nodes to the CPU.
      ...(backend === "webgpu" ? { extra: { session: { disable_cpu_ep_fallback: "1" } } } : {}),
      // Fold shape/padding arithmetic at compile time instead of assigning it to the CPU.
      freeDimensionOverrides: { batch: 1, image_height: height, image_width: width },
      graphOptimizationLevel: "all"
    })
    wasmInitialized = true
  } finally {
    // The runtime is shared by later sessions; do not retain its decompressed input buffer.
    ort.env.wasm.wasmBinary = undefined
  }
  sessionKey = key
  return session
}

async function infer(file: Blob, options: ProcessOptions): Promise<Blob> {
  const model = MODELS.find((entry) => entry.id === options.modelId)
  if (!model) throw new Error("Unknown model.")
  if (![0, 64, 128, 256].includes(options.tileSize)) throw new Error("Invalid tile size.")
  if (options.backend !== "webgpu" && options.backend !== "wasm")
    throw new Error("Invalid backend.")
  const { width, height, data: source } = await decodeImage(file, assetBaseUrl)
  const sampleAlpha = alphaSampler(source, width, height)
  return ImageMagick.read(
    MagickColors.Transparent,
    width * model.scale,
    height * model.scale,
    async (output) => {
      const alpha = new ort.Tensor("float32", new Float32Array([1]), [])
      const total = options.tileSize
        ? Math.ceil(width / options.tileSize) * Math.ceil(height / options.tileSize)
        : 1
      let completed = 0
      progress("inference", 0, total)
      try {
        // Compile once per edge/interior shape; alternating dimensions would recompile every tile.
        const groups = new Map<string, Tile[]>()
        for (const tile of tiles(width, height, options.tileSize)) {
          const key = `${tile.inputWidth}x${tile.inputHeight}`
          const group = groups.get(key)
          if (group) group.push(tile)
          else groups.set(key, [tile])
        }
        for (const group of groups.values()) {
          const first = group[0]
          const currentSession = await loadSession(
            model,
            first.inputWidth,
            first.inputHeight,
            options.backend
          )
          for (const tile of group) {
            const image = new ort.Tensor("float32", rgbTensor(source, width, tile), [
              1,
              3,
              tile.inputHeight,
              tile.inputWidth
            ])
            let outputs: ort.InferenceSession.ReturnType | undefined
            try {
              outputs = await currentSession.run({ image, alpha })
              const result = outputs.output
              if (
                !result ||
                result.type !== "float32" ||
                result.dims.length !== 4 ||
                result.dims[0] !== 1 ||
                result.dims[1] !== 3 ||
                result.dims[2] !== tile.inputHeight * model.scale ||
                result.dims[3] !== tile.inputWidth * model.scale
              ) {
                throw new Error(
                  "Unexpected ONNX output; expected float32 NCHW RGB at the selected scale."
                )
              }
              const rgb = await result.getData()
              if (!(rgb instanceof Float32Array))
                throw new Error("Unexpected ONNX output data type.")
              const rgba = tileRgba(rgb, sampleAlpha, tile, model.scale)
              output.getPixels((pixels) =>
                pixels.setArea(
                  tile.x * model.scale,
                  tile.y * model.scale,
                  tile.width * model.scale,
                  tile.height * model.scale,
                  new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength)
                )
              )
            } finally {
              image.dispose()
              if (outputs) for (const tensor of Object.values(outputs)) tensor.dispose()
            }
            progress("inference", ++completed, total)
          }
        }
      } finally {
        alpha.dispose()
      }
      progress("encode")
      const blob = pngBlob(output)
      progress("encode", 1, 1)
      return blob
    }
  )
}

scope.onmessage = async ({ data }: MessageEvent<ProcessRequest>) => {
  if (busy) return
  busy = true
  try {
    assetBaseUrl = data.assetBaseUrl
    ort.env.wasm.wasmPaths = new URL("ort-runtime/", assetBaseUrl).href
    ort.env.wasm.numThreads = 1
    ort.env.wasm.proxy = false
    if (data.type === "preview") {
      const preview = await previewImage(data.file, assetBaseUrl)
      scope.postMessage({ type: "preview", preview } satisfies WorkerResponse)
    } else {
      const blob = await infer(data.file, data.options)
      scope.postMessage({ type: "result", blob } satisfies WorkerResponse)
    }
  } catch (error) {
    scope.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error)
    } satisfies WorkerResponse)
  } finally {
    busy = false
  }
}
