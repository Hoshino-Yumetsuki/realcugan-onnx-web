export type Backend = "webgpu" | "wasm"

export interface ProcessOptions {
  modelId: string
  backend: Backend
  tileSize: number
}

export interface Progress {
  stage: "download" | "initialize" | "inference" | "encode"
  completed: number
  total: number
}

export interface ImagePreview {
  blob: Blob
  width: number
  height: number
}

export type ProcessRequest = { assetBaseUrl: string; file: Blob } & (
  | { type: "preview" }
  | { type: "process"; options: ProcessOptions }
)

export type WorkerResponse =
  | { type: "progress"; progress: Progress }
  | { type: "result"; blob: Blob }
  | { type: "preview"; preview: ImagePreview }
  | { type: "error"; message: string }

export class ImageProcessor {
  private worker?: Worker
  private pending?: {
    resolve: (result: Blob | ImagePreview) => void
    reject: (error: Error) => void
    progress?: (progress: Progress) => void
  }

  process(
    file: Blob,
    options: ProcessOptions,
    onProgress: (progress: Progress) => void
  ): Promise<Blob> {
    return this.run(file, options, onProgress)
  }

  preview(file: Blob): Promise<ImagePreview> {
    return this.run(file)
  }

  private run(file: Blob): Promise<ImagePreview>
  private run(
    file: Blob,
    options: ProcessOptions,
    onProgress: (progress: Progress) => void
  ): Promise<Blob>
  private run(
    file: Blob,
    options?: ProcessOptions,
    onProgress?: (progress: Progress) => void
  ): Promise<Blob | ImagePreview> {
    if (this.pending) return Promise.reject(new Error("An image is already being processed."))
    if (!this.worker) {
      this.worker = new Worker(new URL("./inference.worker.ts", import.meta.url), {
        type: "module"
      })
      this.worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        const pending = this.pending
        if (!pending) return
        if (data.type === "progress") {
          pending.progress?.(data.progress)
        } else {
          this.pending = undefined
          if (data.type === "result") pending.resolve(data.blob)
          else if (data.type === "preview") pending.resolve(data.preview)
          else {
            this.worker?.terminate()
            this.worker = undefined
            pending.reject(new Error(data.message))
          }
        }
      }
      this.worker.onerror = (event) => {
        event.preventDefault()
        const pending = this.pending
        this.pending = undefined
        this.worker?.terminate()
        this.worker = undefined
        pending?.reject(new Error(event.message || "Inference worker failed."))
      }
      this.worker.onmessageerror = () => {
        const pending = this.pending
        this.pending = undefined
        this.worker?.terminate()
        this.worker = undefined
        pending?.reject(new Error("Unable to read inference worker response."))
      }
    }
    const worker = this.worker
    const { promise, resolve, reject } = Promise.withResolvers<Blob | ImagePreview>()
    this.pending = { resolve, reject, progress: onProgress }
    try {
      const assetBaseUrl = new URL(import.meta.env.BASE_URL, document.baseURI).href
      worker.postMessage(
        options
          ? ({ type: "process", file, options, assetBaseUrl } satisfies ProcessRequest)
          : ({ type: "preview", file, assetBaseUrl } satisfies ProcessRequest)
      )
    } catch (error) {
      this.pending = undefined
      worker.terminate()
      this.worker = undefined
      reject(error)
    }
    return promise
  }

  cancel(): void {
    this.worker?.terminate()
    this.worker = undefined
    const pending = this.pending
    this.pending = undefined
    pending?.reject(new DOMException("Processing cancelled.", "AbortError"))
  }

  dispose(): void {
    this.cancel()
  }
}
