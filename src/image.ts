import { ABGR8888, ALPHA8, defSampler, intBuffer, type IntSampler } from "@thi.ng/pixel"

// All coordinates here are input pixels; ONNX graphs handle their own reflect padding.
export interface Tile {
  x: number
  y: number
  width: number
  height: number
  left: number
  top: number
  inputWidth: number
  inputHeight: number
}

export function* tiles(width: number, height: number, size: number): Generator<Tile> {
  const stepX = size || width
  const stepY = size || height
  const halo = size ? 32 : 0
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const tileWidth = Math.min(stepX, width - x)
      const tileHeight = Math.min(stepY, height - y)
      const left = Math.max(0, x - halo)
      const top = Math.max(0, y - halo)
      yield {
        x,
        y,
        width: tileWidth,
        height: tileHeight,
        left,
        top,
        inputWidth: Math.min(width, x + tileWidth + halo) - left,
        inputHeight: Math.min(height, y + tileHeight + halo) - top
      }
    }
  }
}

export function rgbTensor(source: Uint8ClampedArray, width: number, tile: Tile): Float32Array {
  const plane = tile.inputWidth * tile.inputHeight
  const data = new Float32Array(plane * 3)
  for (let y = 0, i = 0; y < tile.inputHeight; y++) {
    let pixel = ((tile.top + y) * width + tile.left) * 4
    for (let x = 0; x < tile.inputWidth; x++, i++, pixel += 4) {
      data[i] = source[pixel] / 255
      data[i + plane] = source[pixel + 1] / 255
      data[i + plane * 2] = source[pixel + 2] / 255
    }
  }
  return data
}

export function alphaSampler(source: Uint8ClampedArray, width: number, height: number): IntSampler {
  const pixels = intBuffer(
    width,
    height,
    ABGR8888,
    new Uint32Array(source.buffer, source.byteOffset, source.length / 4)
  )
  return defSampler(pixels.as(ALPHA8), "linear", "repeat")
}

export function tileRgba(
  rgb: Float32Array,
  sampleAlpha: IntSampler,
  tile: Tile,
  scale: number
): Uint8ClampedArray<ArrayBuffer> {
  const width = tile.width * scale
  const height = tile.height * scale
  const inputWidth = tile.inputWidth * scale
  const plane = inputWidth * tile.inputHeight * scale
  const cropX = (tile.x - tile.left) * scale
  const cropY = (tile.y - tile.top) * scale
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let y = 0, pixel = 0; y < height; y++) {
    const sy = tile.y + (y + 0.5) / scale
    for (let x = 0; x < width; x++, pixel += 4) {
      const i = (cropY + y) * inputWidth + cropX + x
      rgba[pixel] = rgb[i] * 255
      rgba[pixel + 1] = rgb[i + plane] * 255
      rgba[pixel + 2] = rgb[i + plane * 2] * 255
      // Sample the original alpha in global pixel-center coordinates, not per-tile coordinates.
      rgba[pixel + 3] = sampleAlpha(tile.x + (x + 0.5) / scale, sy)
    }
  }
  return rgba
}
