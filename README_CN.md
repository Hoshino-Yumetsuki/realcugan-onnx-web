# Real-CUGAN ONNX Web

[English](README.md)

完全在浏览器中运行的动漫图片超分辨率工具。使用 Vue 3、TypeScript、Vite、
Element Plus 和 ONNX Runtime Web，可选择 WebGPU 或 CPU（WASM）推理。无需推理服务器，不上传图片。

移动端滚动到页面下方的介绍区后，仍可点按底部的「参数设置」打开设置抽屉。`src/App.vue` 组合
`src/components/` 下的设置、批量队列、上传与图片对比组件；`src/workspace.ts`
管理类型化共享状态，`src/i18n.ts` 提供中、英、日三语词典。

## 本地开发

需要 Node.js 22+；Yarn 4 版本已在 `package.json` 中锁定：

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

`yarn build` 先通过 `vue-tsc` 检查 TypeScript 和 Vue 模板，再生成 `dist/`。
工具链参考 `moejs-wasm`：严格 TypeScript、Yarn node-modules linker、Oxlint、Oxfmt。
`yarn format` 格式化源码，`yarn format:check` 检查格式。
保留 TypeScript 7；`vue-tsc` 通过独立的 `@typescript/typescript6` 兼容依赖使用
JavaScript 编译器 API，不要求降级项目编译器。

真实模型浏览器回归：运行 `yarn dev`，打开
`http://localhost:5173/tests/inference.html`，添加 `?backend=wasm` 测试 CPU；禁用 GPU
适配器后添加 `?expect-unavailable` 测试无 WebGPU 环境。覆盖全部 17 个内置模型、
显式后端切换、取消后重建 Worker 和 PNG 透明通道。

## 使用方式

- 选择、拖放或粘贴图片，在独立 Worker 中按队列顺序处理。
- 可选 WebGPU（默认）或 CPU（WASM），选择自动保存，处理中不可切换。
  WebGPU 需要兼容浏览器和设备，并通过 HTTPS 或 localhost 打开页面。
  WebGPU 不可用或初始化失败时会报错，不静默回退；可手动选择 CPU。
- CPU 使用 ONNX Runtime WASM 在同一独立 Worker 中推理，不依赖 WebGPU。
  官方 ONNX Runtime 宿主也负责 GPU 图加载和调度。
- 取消操作立即终止 Worker，已完成结果保留；取消或失败的图片可重试，下一次
  处理自动创建新 Worker。
- 支持滑条对比、预览缩放和平移、逐张 PNG 下载及全部 ZIP 打包下载。
  PNG 透明通道通过双线性插值缩放保留。
- 中文、英文、日文；浅色、深色、跟随系统主题。

ZIP 打包使用 `@zip.js/zip.js`，保持不压缩存储，支持 Unicode 文件名并避免重名覆盖；
使用原生入口，不增加压缩 WASM 或 Worker 资源。`@thi.ng/pixel` 负责透明通道提取和
双线性采样；`colord` 负责颜色转换、亮度与对比度。`@imagemagick/magick-wasm`
在同一 Worker 内完成全分辨率解码、分块拼接和 PNG 编码，不依赖 Canvas。
界面与取色只使用单边不超过 1,024 像素的预览，下载与 ZIP 中仍保留完整输出分辨率。

## 模型与图像限制

全部 17 个 ONNX 模型以普通二进制文件保存在
`public/models/c582623ea970dffed0c0afaf971ab43bb3356604/webgpu-f32/`，随仓库一起分发。
模型来自
[Hoshino-Yumetsuki/Real-CUGAN-ONNX](https://huggingface.co/Hoshino-Yumetsuki/Real-CUGAN-ONNX)，
对应 `src/models.ts` 固定的 revision，总计约 89.4 MB。
Vite 构建时复制到 `dist/models/`，浏览器仅按需从本站加载所选模型，并使用普通
HTTP 缓存。运行时不再连接 Hugging Face 或模型 CDN。

| 模型系列             | 放大倍率 | 降噪选项              |
| -------------------- | -------- | --------------------- |
| SE（`weights_v3`）   | 2×       | 保守、不降噪、1、2、3 |
| SE（`weights_v3`）   | 3× / 4×  | 保守、不降噪、3       |
| Pro（`weights_pro`） | 2× / 3×  | 保守、不降噪、3       |

ONNX 图接受 `image`（float32 NCHW，RGB [0,1]）与 `alpha`（float32 标量，固定为
1），返回 float32 NCHW RGB。反射填充、输出裁剪与 Pro 归一化仍保留在图中；
上游新版将 3× 模型中的一个 ConvTranspose 替换为 Conv、Slice 和 DepthToSpace。

内置变体仅移除上游 PNG 字节量化尾部，避免 WebGPU 不支持的 uint8 Cast；
JavaScript 将浮点输出打包为 PNG 字节。会话固定输入尺寸以常量折叠形状运算，
选择 WebGPU 时显式禁用 CPU 执行提供程序回退；CPU 模式明确使用 WASM 执行提供程序。
同尺寸分块复用一次会话编译，切换后端时重新创建会话。

如需重新生成已提交的模型，安装 [uv](https://docs.astral.sh/uv/) 后运行
`uv run scripts/prepare-models.py`。此可选准备步骤会校验上游 SHA-256，
日常开发、构建与浏览器推理均不需要 Python。

默认按 128 输入像素分块，每块额外读取 32 像素上下文；较小分块可降低内存与显存
占用。Real-CUGAN 包含全局 SE 统计，因此分块结果与全图推理并非逐像素一致；需要
避免此差异时可选择全图模式，但要确保有足够内存。应用不再设置单边尺寸或总像素
硬限制，大图无需装入浏览器 Canvas；实际边界取决于设备内存、WebAssembly 地址
空间和图像库能力。内存风险提示仍可选择继续。失败时显示错误，不使用普通缩放冒充模型结果。

## 静态部署

将**整个 `dist/` 目录**部署到任意静态 HTTP 服务，必须包含 `assets/`、
`ort-runtime/`、`image-codec/` 和 `models/`。构建使用相对路径，支持部署到子目录。
`.wasm.zip` 使用 `application/zip` MIME，`.mjs` 使用 JavaScript MIME，
`.onnx` 使用 `application/octet-stream` MIME。两个 WASM 文件均打包为真实 ZIP，
浏览器 Worker 通过已有的 `@zip.js/zip.js` 原生入口解压，分别交给 ONNX Runtime 的
`wasmBinary` 选项和 ImageMagick 的 `initializeImageMagick` 加载。
无需额外解压 Worker 或跨源隔离响应头。每个 Worker 只初始化一次运行时，
CPU 与 WebGPU 会话共同复用 ONNX Runtime。初始化会多一步解压，使用缓冲区而非流式 WASM 编译。

Vite 在开发和构建时将已安装 ONNX Runtime 和 ImageMagick 包中的官方 WASM 压缩为
ZIP，并复制 ONNX Runtime 配套 `.mjs`，不发布未压缩 `.wasm`。运行时文件必须与
应用一起更新；`index.html`、`ort-runtime/` 和 `image-codec/` 应重新验证缓存，
版本化模型 URL 可使用长期缓存。
推理资源全部由部署站点提供，无需外部模型服务或跨域配置。

Cloudflare Workers Static Assets 的[单文件上限为 25 MiB](https://developers.cloudflare.com/workers/platform/limits/#static-assets)，
免费和付费套餐相同。当前 ONNX Runtime ZIP 约 6.9 MiB，ImageMagick ZIP 约 5.2 MiB，
可以直接部署完整 `dist/`，无需 R2、外部 CDN 或服务端解压 Worker。
不要通过 `file://` 直接打开页面。

旧原生构建链、本地原生模型与旧 Worker 均已移除。`.wasm.zip` 内的 WASM 来自官方
ONNX Runtime Web 包，用于 GPU 图加载和调度，以及 CPU 模式下的模型推理。

## 致谢

哔哩哔哩的 [Real-CUGAN](https://github.com/bilibili/ailab/tree/main/Real-CUGAN)、
上述 ONNX 模型仓库及
[原 Web 项目](https://github.com/hanFengSan/realcugan-ncnn-webassembly)。
