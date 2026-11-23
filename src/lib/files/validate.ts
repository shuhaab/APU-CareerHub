import { find, read } from "cfb";
import { PDFDocument, PDFName } from "pdf-lib";
import { fromBufferPromise } from "yauzl";

const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function validDocx(bytes: Buffer) {
  const zip = await fromBufferPromise(bytes, { lazyEntries: true, validateEntrySizes: true, strictFileNames: true });
  try {
    if (zip.entryCount > 512) return false;
    const names = new Set<string>();
    let expanded = 0;
    let document = false;
    let contentTypes = false;
    for await (const entry of zip.eachEntry()) {
      expanded += entry.uncompressedSize;
      const name = entry.fileName.toLowerCase();
      if (expanded > 25 * 1024 * 1024 || names.has(name) || entry.isEncrypted() ||
          /vba(project|data)|^word\/embeddings\//.test(name)) return false;
      names.add(name);
      if (name.endsWith("/")) continue;
      const stream = await zip.openReadStreamPromise(entry);
      const inspect = name === "word/document.xml" || name === "[content_types].xml";
      const chunks: Buffer[] = [];
      for await (const chunk of stream) if (inspect) chunks.push(chunk);
      if (!inspect) continue;
      const xml = Buffer.concat(chunks).toString("utf8");
      if (/<!DOCTYPE|<!ENTITY/i.test(xml)) return false;
      if (name === "word/document.xml") document = /<(?:[\w.-]+:)?document[\s>]/.test(xml) && /<\/(?:[\w.-]+:)?document\s*>/.test(xml);
      else contentTypes = xml.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml");
    }
    return document && contentTypes && names.has("_rels/.rels");
  } finally {
    zip.close();
  }
}

export async function validDocument(bytes: Buffer, mime: string, name: string) {
  if (!bytes.length || bytes.length > 5 * 1024 * 1024) return false;
  try {
    if (mime === "application/pdf" && /\.pdf$/i.test(name)) {
      if (!bytes.subarray(0, 8).toString().startsWith("%PDF-") || !/%%EOF\s*$/.test(bytes.subarray(-1024).toString())) return false;
      const pdf = await PDFDocument.load(bytes, { throwOnInvalidObject: true, updateMetadata: false });
      return pdf.getPageCount() > 0 && !pdf.catalog.has(PDFName.of("OpenAction")) && !pdf.catalog.has(PDFName.of("AA")) && !pdf.catalog.has(PDFName.of("Names"));
    }
    if (mime === "application/msword" && /\.doc$/i.test(name)) {
      if (bytes.subarray(0, 8).toString("hex") !== "d0cf11e0a1b11ae1") return false;
      const doc = read(bytes);
      const word = find(doc, "WordDocument")?.content;
      return !!word && word[0] === 0xec && word[1] === 0xa5 && !doc.FullPaths.some((path) => /(?:^|\/)(?:vba|macros)(?:\/|$)/i.test(path));
    }
    if (mime === docxMime && /\.docx$/i.test(name)) return await validDocx(bytes);
  } catch {
    return false;
  }
  return false;
}
