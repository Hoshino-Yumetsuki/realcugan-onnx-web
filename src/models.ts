export type Family = "se" | "pro"
export type Noise = "conservative" | "no-denoise" | "denoise1x" | "denoise2x" | "denoise3x"

export interface Model {
  id: string
  family: Family
  scale: 2 | 3 | 4
  noise: Noise
  url: string
}

export const MODEL_REVISION = "c582623ea970dffed0c0afaf971ab43bb3356604"
const models: Model[] = []
for (const family of ["se", "pro"] as const) {
  for (const scale of [2, 3, 4] as const) {
    if (family === "pro" && scale === 4) continue
    for (const noise of [
      "conservative",
      "no-denoise",
      "denoise1x",
      "denoise2x",
      "denoise3x"
    ] as const) {
      if ((noise === "denoise1x" || noise === "denoise2x") && (family !== "se" || scale !== 2))
        continue
      const path =
        family === "pro"
          ? `weights_pro/pro-${noise}-up${scale}x.onnx`
          : `weights_v3/up${scale}x-latest-${noise}.onnx`
      models.push({
        id: `${family}-${scale}x-${noise}`,
        family,
        scale,
        noise,
        url: `models/${MODEL_REVISION}/webgpu-f32/${path}`
      })
    }
  }
}
export const MODELS: readonly Model[] = models
