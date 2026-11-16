import {
  ColorSpace,
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  type IMagickImage
} from "@imagemagick/magick-wasm"
import { loadRuntimeZip } from "./runtime"
import type { ImagePreview } from "./processor"

let initialized = false

async function initialize(assetBaseUrl: string): Promise<void> {
  if (initialized) return
  const wasm = await loadRuntimeZip(
    new URL("image-codec/magick.wasm.zip", assetBaseUrl),
    "magick.wasm"
  )
  await initializeImageMagick(wasm)
  initialized = true
}

export function pngBlob(image: IMagickImage): Blob {
  return image.write(
    MagickFormat.Png32,
    (data) =>
      new Blob([new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength)], {
        type: "image/png"
      })
  )
}

export async function decodeImage(file: Blob, assetBaseUrl: string) {
  await initialize(assetBaseUrl)
  return ImageMagick.read(new Uint8Array(await file.arrayBuffer()), (image) => {
    image.autoOrient()
    image.colorSpace = ColorSpace.sRGB
    const data = image.getPixels((pixels) =>
      pixels.toByteArray(0, 0, image.width, image.height, "RGBA")
    )
    if (!data) throw new Error("Unable to decode image pixels.")
    return {
      width: image.width,
      height: image.height,
      data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength)
    }
  })
}

export async function previewImage(file: Blob, assetBaseUrl: string): Promise<ImagePreview> {
  await initialize(assetBaseUrl)
  return ImageMagick.read(new Uint8Array(await file.arrayBuffer()), (image) => {
    image.autoOrient()
    image.colorSpace = ColorSpace.sRGB
    const width = image.width
    const height = image.height
    const ratio = Math.min(1, 1024 / Math.max(width, height))
    if (ratio < 1) {
      image.thumbnail(
        Math.max(1, Math.round(width * ratio)),
        Math.max(1, Math.round(height * ratio))
      )
    }
    return { blob: pngBlob(image), width, height }
  })
}
