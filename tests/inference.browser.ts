// Open /tests/inference.html under `yarn dev`. Uses real models, no mocked providers.
import { ImageProcessor, type Backend, type ProcessOptions } from "../src/processor"
import { MODELS } from "../src/models"

const status = document.querySelector<HTMLPreElement>("#results")!
const processor = new ImageProcessor()
const checks: string[] = []
const backend: Backend =
  new URLSearchParams(location.search).get("backend") === "wasm" ? "wasm" : "webgpu"
const canvas = new OffscreenCanvas(9, 7)
const context = canvas.getContext("2d")!
context.fillStyle = "rgb(195,92,142)"
context.fillRect(0, 0, 9, 7)

async function pixels(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const context = canvas.getContext("2d")!
  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  return context.getImageData(0, 0, canvas.width, canvas.height)
}

async function verify(): Promise<void> {
  const input = await canvas.convertToBlob({ type: "image/png" })
  const options: ProcessOptions = { modelId: "se-2x-no-denoise", tileSize: 64, backend }
  if (new URLSearchParams(location.search).has("expect-unavailable")) {
    const cpu = await pixels(
      await processor.process(input, { ...options, backend: "wasm" }, () => {})
    )
    if (cpu.width !== 18 || cpu.height !== 14)
      throw new Error("CPU inference returned incorrect dimensions")
    for (let i = 0; i < cpu.data.length; i++) {
      if (Math.abs(cpu.data[i] - [195, 92, 142, 255][i % 4]) > 8)
        throw new Error("CPU inference returned incorrect RGB values")
    }
    checks.push("CPU inference passed without WebGPU")
    try {
      await processor.process(input, { ...options, backend: "webgpu" }, () => {})
      throw new Error("Inference succeeded without WebGPU")
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("WebGPU is unavailable")) throw error
    }
    checks.push("WebGPU unavailable: inference rejected without CPU fallback")
    return
  }
  for (const model of MODELS) {
    const result = await pixels(
      await processor.process(input, { modelId: model.id, tileSize: 0, backend }, () => {})
    )
    if (result.width !== 9 * model.scale || result.height !== 7 * model.scale)
      throw new Error(`${model.id}: incorrect dimensions`)
    for (let i = 0; i < result.data.length; i++) {
      if (Math.abs(result.data[i] - [195, 92, 142, 255][i % 4]) > 8)
        throw new Error(`${model.id}: RGB range/channel regression`)
    }
    checks.push(`${model.id}: ${backend} RGB and dimensions passed`)
    status.textContent = checks.join("\n")
  }
  if (navigator.gpu && (await navigator.gpu.requestAdapter())) {
    for (const selected of ["wasm", "webgpu", "wasm"] as const) {
      const result = await pixels(
        await processor.process(input, { ...options, backend: selected }, () => {})
      )
      if (result.width !== 18 || result.height !== 14)
        throw new Error(`${selected}: incorrect dimensions after switching`)
      for (let i = 0; i < result.data.length; i++) {
        if (Math.abs(result.data[i] - [195, 92, 142, 255][i % 4]) > 8)
          throw new Error(`${selected}: RGB regression after switching`)
      }
    }
    checks.push("Persistent processor switched CPU → WebGPU → CPU")
  }
  const tiledCanvas = new OffscreenCanvas(131, 129)
  const tiledContext = tiledCanvas.getContext("2d")!
  tiledContext.fillStyle = "rgb(195,92,142)"
  tiledContext.fillRect(0, 0, 131, 129)
  const tiled = await pixels(
    await processor.process(
      await tiledCanvas.convertToBlob({ type: "image/png" }),
      options,
      () => {}
    )
  )
  if (tiled.width !== 262 || tiled.height !== 258) throw new Error("Incorrect tiled dimensions")
  for (let i = 0; i < tiled.data.length; i++) {
    if (Math.abs(tiled.data[i] - [195, 92, 142, 255][i % 4]) > 8)
      throw new Error("Edge/interior tile shape or RGB regression")
  }
  checks.push("Grouped edge/interior tile shapes passed")
  try {
    await processor.process(input, options, () => processor.cancel())
    throw new Error("Cancellation resolved instead of rejecting")
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "AbortError") throw error
  }
  context.clearRect(0, 0, 9, 7)
  context.fillStyle = "rgba(195,92,142,0.3)"
  context.fillRect(0, 0, 9, 7)
  const translucent = await canvas.convertToBlob({ type: "image/png" })
  const source = await pixels(translucent)
  const result = await pixels(await processor.process(translucent, options, () => {}))
  for (let i = 3; i < result.data.length; i += 4) {
    if (result.data[i] !== source.data[3]) throw new Error("Transparency was not preserved")
  }
  checks.push("Cancellation, worker recreation and PNG transparency passed")

  // Input exceeds the previous cap; output also exceeds Chromium's 32767-pixel canvas side.
  const wideCanvas = new OffscreenCanvas(16385, 7)
  const wideContext = wideCanvas.getContext("2d")!
  wideContext.fillStyle = "rgba(195,92,142,0.3)"
  wideContext.fillRect(0, 0, wideCanvas.width, wideCanvas.height)
  const wideInput = await wideCanvas.convertToBlob({ type: "image/png" })
  const inputPreview = await processor.preview(wideInput)
  if (inputPreview.width !== 16385 || inputPreview.height !== 7)
    throw new Error("Input preview lost original dimensions")
  const wideResult = await processor.process(wideInput, { ...options, tileSize: 128 }, () => {})
  const header = new DataView(await wideResult.slice(0, 24).arrayBuffer())
  if (header.getUint32(16) !== 32770 || header.getUint32(20) !== 14)
    throw new Error("Full-resolution PNG dimensions were truncated")
  const outputPreview = await processor.preview(wideResult)
  if (outputPreview.width !== 32770 || outputPreview.height !== 14)
    throw new Error("Output preview lost original dimensions")
  const thumbnail = await pixels(outputPreview.blob)
  if (thumbnail.width > 1024 || thumbnail.height > 1024)
    throw new Error("Large-image preview was not bounded")
  if (thumbnail.data[3] !== source.data[3] || thumbnail.data.at(-1) !== source.data[3])
    throw new Error("Large PNG transparency was not preserved")
  checks.push("16385px input → 32770px PNG, bounded previews and alpha passed")
}

try {
  await verify()
  status.textContent = `PASS\n${checks.join("\n")}`
  document.title = "PASS: Real-CUGAN inference"
} catch (error) {
  status.textContent = `FAIL\n${error instanceof Error ? error.message : String(error)}\n${checks.join("\n")}`
  document.title = "FAIL: Real-CUGAN inference"
  throw error
} finally {
  processor.dispose()
}
