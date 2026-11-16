import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js/lib/zip-core-native.js"

export async function buildStoreZip(entries: { name: string; blob: Blob }[]): Promise<Blob> {
  // PNGs are already compressed. The native entry avoids extra WASM and worker assets.
  const writer = new ZipWriter(new BlobWriter("application/zip"), {
    level: 0,
    useWebWorkers: false
  })
  const names = new Set<string>()
  for (const entry of entries) {
    let name = entry.name
    for (let suffix = 1; names.has(name); suffix++) {
      name = entry.name.replace(/(\.[a-z0-9]+)?$/i, `-${suffix}$1`)
    }
    names.add(name)
    await writer.add(name, new BlobReader(entry.blob))
  }
  return writer.close()
}
