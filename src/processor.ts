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

export interface ProcessRequest {
  file: Blob
  options: ProcessOptions
  assetBaseUrl: string
}

export type WorkerResponse =
  | { type: "progress"; progress: Progress }
  | { type: "result"; blob: Blob }
  | { type: "error"; message: string }

export class ImageProcessor {
  private worker?: Worker
  private pending?: {
    resolve: (blob: Blob) => void
    reject: (error: Error) => void
    progress: (progress: Progress) => void
  }

  process(
    file: Blob,
    options: ProcessOptions,
    onProgress: (progress: Progress) => void
  ): Promise<Blob> {
    if (this.pending) return Promise.reject(new Error("An image is already being processed."))
    if (!this.worker) {
      this.worker = new Worker(new URL("./inference.worker.ts", import.meta.url), {
        type: "module"
      })
      this.worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
        const pending = this.pending
        if (!pending) return
        if (data.type === "progress") {
          pending.progress(data.progress)
        } else {
          this.pending = undefined
          if (data.type === "result") pending.resolve(data.blob)
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
    const { promise, resolve, reject } = Promise.withResolvers<Blob>()
    this.pending = { resolve, reject, progress: onProgress }
    try {
      const assetBaseUrl = new URL(import.meta.env.BASE_URL, document.baseURI).href
      worker.postMessage({ file, options, assetBaseUrl } satisfies ProcessRequest)
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
