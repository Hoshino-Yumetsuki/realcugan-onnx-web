import { describe, expect, it } from "vitest"
import { alphaSampler, rgbTensor, tileRgba, tiles } from "../src/image"

describe("image conversion", () => {
  it("packs RGB planes without swapping channels or including alpha", () => {
    const source = new Uint8ClampedArray([255, 0, 128, 0, 0, 64, 255, 255])
    const [tile] = tiles(2, 1, 0)
    expect(Array.from(rgbTensor(source, 2, tile))).toEqual([
      1,
      0,
      0,
      Math.fround(64 / 255),
      Math.fround(128 / 255),
      1
    ])
  })

  it("crops contextual output to cover odd-sized images once with continuous alpha", () => {
    const width = 67
    const height = 69
    const scale = 3
    const source = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) source[(y * width + x) * 4 + 3] = x * 3
    }
    function render(size: number) {
      const sampleAlpha = alphaSampler(source, width, height)
      const output = new Uint8ClampedArray(width * height * scale * scale * 4)
      const coverage = new Uint8Array(width * height * scale * scale)
      for (const tile of tiles(width, height, size)) {
        const plane = tile.inputWidth * tile.inputHeight * scale * scale
        const rgb = new Float32Array(plane * 3)
        for (let y = 0; y < tile.inputHeight * scale; y++) {
          for (let x = 0; x < tile.inputWidth * scale; x++) {
            const i = y * tile.inputWidth * scale + x
            rgb[i] = ((tile.left * scale + x) % 256) / 255
            rgb[i + plane] = ((tile.top * scale + y) % 256) / 255
            rgb[i + plane * 2] = 123 / 255
          }
        }
        const rgba = tileRgba(rgb, sampleAlpha, tile, scale)
        for (let y = 0; y < tile.height * scale; y++) {
          const start = (tile.y * scale + y) * width * scale + tile.x * scale
          output.set(
            rgba.subarray(y * tile.width * scale * 4, (y + 1) * tile.width * scale * 4),
            start * 4
          )
          for (let x = 0; x < tile.width * scale; x++) coverage[start + x]++
        }
      }
      expect(coverage.every((value) => value === 1)).toBe(true)
      return output
    }
    const result = render(64)
    expect(result).toEqual(render(0))
    const pixel = ((height * scale - 1) * width * scale + width * scale - 1) * 4
    expect(Array.from(result.subarray(pixel, pixel + 4))).toEqual([200, 206, 123, 198])
    expect(result[3]).toBe(0)
    expect(result[4 * (32 * scale) + 3]).toBe(95)
  })

  it("keeps a one-pixel transparent image valid at every output edge", () => {
    const [tile] = tiles(1, 1, 64)
    const rgb = new Float32Array(3 * 4 * 4)
    rgb.fill(1)
    const sampleAlpha = alphaSampler(new Uint8ClampedArray([255, 255, 255, 73]), 1, 1)
    const rgba = tileRgba(rgb, sampleAlpha, tile, 4)
    for (let i = 0; i < rgba.length; i += 4) {
      expect(Array.from(rgba.subarray(i, i + 4))).toEqual([255, 255, 255, 73])
    }
  })
})
