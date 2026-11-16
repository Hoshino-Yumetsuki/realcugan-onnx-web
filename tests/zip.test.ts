import { BlobReader, Uint8ArrayWriter, ZipReader } from "@zip.js/zip.js/lib/zip-core-native.js"
import { expect, it } from "vitest"
import { buildStoreZip } from "../src/zip"

it("preserves Unicode filenames and every payload when duplicate and suffixed names collide", async () => {
  const names = ["猫🐱.png", "猫🐱.png", "猫🐱-1.png", "__proto__", "__proto__"]
  const entries = names.map((name, index) => ({
    name,
    blob: new Blob([new Uint8Array([index, 0, 255, 128])])
  }))
  const reader = new ZipReader(new BlobReader(await buildStoreZip(entries)), {
    useWebWorkers: false
  })
  try {
    const files = await reader.getEntries()
    expect(files.map((file) => file.filename)).toEqual([
      "猫🐱.png",
      "猫🐱-1.png",
      "猫🐱-1-1.png",
      "__proto__",
      "__proto__-1"
    ])
    for (const [index, file] of files.entries()) {
      expect(file.compressionMethod).toBe(0)
      if (file.directory) throw new Error("Unexpected directory in image archive")
      const bytes = await file.getData(new Uint8ArrayWriter(), { checkSignature: true })
      expect(bytes).toEqual(new Uint8Array(await entries[index].blob.arrayBuffer()))
    }
  } finally {
    await reader.close()
  }
})
