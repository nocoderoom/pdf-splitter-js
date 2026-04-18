import { PDFDocument } from "pdf-lib";

/**
 * Parse page input like:
 * "1,2,5-8" → [0,1,4,5,6,7]
 */
export function parsePageRanges(input: string, maxPages?: number): number[] {
  const pages = new Set<number>();

  input.split(",").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    if (trimmed.includes("-")) {
      let [start, end] = trimmed.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        if (start > end) [start, end] = [end, start];
        for (let i = start; i <= end; i++) {
          pages.add(i - 1);
        }
      }
    } else {
      const num = Number(trimmed);
      if (!isNaN(num)) pages.add(num - 1);
    }
  });

  return [...pages].filter(
    (n) => n >= 0 && (maxPages == null || n < maxPages)
  );
}

/**
 * Split a PDF by page indices
 */
export async function splitPdf(
  file: File | ArrayBuffer,
  input: string
): Promise<Uint8Array> {
  const bytes = file instanceof File ? await file.arrayBuffer() : file;

  const pdf = await PDFDocument.load(bytes);
  const totalPages = pdf.getPageCount();

  const indices = parsePageRanges(input, totalPages);

  if (indices.length === 0) {
    throw new Error("No valid pages selected");
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(pdf, indices);

  copiedPages.forEach((p) => newPdf.addPage(p));

  return await newPdf.save();
}
