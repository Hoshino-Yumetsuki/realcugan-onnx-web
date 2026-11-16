import { BlobReader, Uint8ArrayWriter, ZipReader } from "@zip.js/zip.js/lib/zip-core-native.js"

export async function loadRuntimeZip(url: URL, fileName: string): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Runtime download failed: HTTP ${response.status} (${fileName}).`)
  const reader = new ZipReader(new BlobReader(await response.blob()), { useWebWorkers: false })
  try {
    const entry = (await reader.getEntries()).find((entry) => entry.filename === fileName)
    if (!entry || entry.directory) throw new Error(`Runtime archive is missing ${fileName}.`)
    return await entry.getData(new Uint8ArrayWriter())
  } finally {
    await reader.close()
  }
}
