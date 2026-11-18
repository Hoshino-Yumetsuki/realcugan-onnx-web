# Real-CUGAN ONNX Web

[中文](README_CN.md)

Anime image upscaling entirely in the browser. Vue 3 + TypeScript + Vite,
Element Plus, and ONNX Runtime Web with selectable WebGPU or CPU inference.
No server-side inference or image uploads.

On mobile, the settings button stays accessible when you scroll down to the introduction.
`src/App.vue` composes settings, batch queue, upload and image-comparison components
from `src/components/`. `src/workspace.ts` owns their shared, typed workspace state;
`src/i18n.ts` supplies the Chinese, English and Japanese dictionaries.

## Development

Node.js 22+ and Yarn 4 (version pinned in `package.json`):

```sh
corepack enable
yarn install --immutable
yarn dev
```

```sh
yarn lint
yarn test
yarn build
yarn preview
```

`yarn build` checks TypeScript and Vue templates with `vue-tsc` before producing
`dist/`. The toolchain follows `moejs-wasm`: strict TypeScript, Yarn's node-modules
linker, Oxlint and Oxfmt.
`yarn format` formats sources; `yarn format:check` checks formatting.
TypeScript 7 remains the project compiler. `vue-tsc` uses the separate
`@typescript/typescript6` compatibility package for its JavaScript compiler API.

For real-model browser regression checks, run `yarn dev` and open
`http://localhost:5173/tests/inference.html`. Add `?backend=wasm` for CPU coverage,
or `?expect-unavailable` with GPU adapters disabled. The checks cover all 17 bundled
models, explicit backend switching, cancellation, worker recreation and PNG alpha.

With `yarn dev` running and Chrome installed, `uv run tests/mobile-ui.py` checks the
settings drawer after scrolling and switches the introduction between all three languages.

## Processing

- Choose, drop or paste images; process the queue sequentially in a dedicated worker.
- Select WebGPU (default) or CPU; the choice is saved locally and locked
  while processing. WebGPU needs a compatible browser/device over HTTPS or localhost.
  WebGPU errors do not silently fall back; select CPU explicitly when needed.
- CPU inference runs in the same dedicated worker using ONNX Runtime WASM, without
  requiring WebGPU. The official ONNX Runtime host also loads and schedules GPU graphs.
- Cancel terminates the worker immediately. Completed results remain downloadable;
  cancelled/failed images can be retried. The next operation creates a fresh worker.
- Compare original/result with the slider, zoom and pan. Download individual PNGs
  or a store-only ZIP. Transparency is resized with bilinear interpolation.
- Chinese, English and Japanese; light, dark and system themes.

ZIP packaging uses `@zip.js/zip.js` with stored entries, Unicode filenames and
collision-safe names. Its native entry adds no compression WASM or worker assets.
`@thi.ng/pixel` supplies alpha-channel extraction and bilinear sampling; `colord`
handles color conversions, luminance and contrast. `@imagemagick/magick-wasm` handles
full-resolution decoding, tile assembly and PNG encoding in the same worker without
Canvas. Display and theme extraction use previews bounded to 1,024 pixels per side;
downloads and ZIP entries retain the original output resolution.

## Models and image limits

All 17 ONNX models are stored as ordinary binary files in
`public/models/c582623ea970dffed0c0afaf971ab43bb3356604/webgpu-f32/` and distributed with the
repository. They originate from
[Hoshino-Yumetsuki/Real-CUGAN-ONNX](https://huggingface.co/Hoshino-Yumetsuki/Real-CUGAN-ONNX)
at the revision pinned in `src/models.ts`. The models total approximately 89.4 MB.
Vite copies them to `dist/models/`; the browser loads only
the selected model from the same site and uses its HTTP cache. No runtime
connection to Hugging Face or a model CDN is required.

| Family              | Scale   | Denoising                   |
| ------------------- | ------- | --------------------------- |
| SE (`weights_v3`)   | 2×      | conservative, none, 1, 2, 3 |
| SE (`weights_v3`)   | 3× / 4× | conservative, none, 3       |
| Pro (`weights_pro`) | 2× / 3× | conservative, none, 3       |

The graphs take `image` (float32 NCHW RGB in [0,1]) and `alpha` (float32 scalar,
fixed at 1), and return float32 NCHW RGB. Padding, output cropping and Pro
normalization remain inside the graph. The updated upstream 3× graphs replace a
ConvTranspose with Conv, Slice and DepthToSpace.

The bundled variants remove only the upstream PNG byte-quantization tail, whose
uint8 Cast is unsupported by WebGPU. JavaScript packs the float output into PNG
bytes. Sessions specialize input dimensions so shape arithmetic is constant-folded,
with CPU execution-provider fallback disabled when WebGPU is selected. CPU mode
explicitly uses the WASM execution provider. Tiles of the same shape share one session
compilation; switching providers rebuilds the session.

To regenerate the committed variants, install [uv](https://docs.astral.sh/uv/) and run
`uv run scripts/prepare-models.py`. This optional preparation step verifies upstream
SHA-256 hashes and does not run during development, build or browser inference.

Tiles default to 128 input pixels with a 32-pixel context halo. Smaller tiles lower
memory usage. Real-CUGAN's global SE statistics mean tiled output is not pixel-identical
to whole-image inference; use full-image mode when that matters and memory permits.
There is no application-level side-length or pixel-count cap. Large images do not
need to fit a browser canvas; actual limits come from device memory, WebAssembly
address space and the image codec. Memory warnings remain advisory. Failed runs
surface errors rather than returning resized placeholders.

## Static deployment

Publish the **entire `dist/` directory**, including `assets/`, `ort-runtime/`,
`image-codec/` and `models/`, on any static HTTP host. Relative build URLs support
subdirectory hosting. Serve `.wasm.zip` as `application/zip`, `.mjs` as JavaScript
and `.onnx` as `application/octet-stream`. Both WASM payloads are real ZIP archives
containing the original binaries. The browser worker extracts them with the existing
`@zip.js/zip.js` native entry. ONNX Runtime receives its binary via `wasmBinary`;
ImageMagick receives its binary through `initializeImageMagick`. No separate
decompression worker or cross-origin isolation headers are required.
The runtime is initialized once per worker and reused by both CPU and WebGPU sessions.
This adds a decompression step and uses buffered rather than streaming WASM compilation.

Vite packages the official WASM binaries from the installed ONNX Runtime and
ImageMagick packages into ZIP during development/build and copies ONNX Runtime's
matching `.mjs`; no uncompressed `.wasm` is published.
Keep runtime files with the matching app bundle and revalidate `index.html`,
`ort-runtime/` and `image-codec/` when publishing. Versioned model URLs may use long-lived caching.
All inference resources are served by the deployment; no external model host or
CORS configuration is required.

Cloudflare Workers Static Assets has a [25 MiB per-file limit](https://developers.cloudflare.com/workers/platform/limits/#static-assets)
on both free and paid plans. The current ONNX Runtime ZIP is approximately 6.9 MiB
and the ImageMagick ZIP is approximately 5.2 MiB, so the full `dist/` directory fits
the per-file limit without
R2, an external CDN or a server-side decompression worker.
Do not open `index.html` via `file://`.

The previous native build chain, bundled native models and legacy workers have
been removed. The `.wasm.zip` payload belongs to the official ONNX Runtime
Web package: it hosts GPU graph loading/scheduling and executes models in CPU mode.

## Credits
[Real-CUGAN](https://github.com/bilibili/ailab/tree/main/Real-CUGAN) by Bilibili,
the ONNX model repository above, the original
[web project](https://github.com/hanFengSan/realcugan-ncnn-webassembly) and the frontend by [lemonno2333](https://github.com/lemonno2333)
