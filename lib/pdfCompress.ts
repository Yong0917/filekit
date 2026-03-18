import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";

// PDF.js 워커 설정 (브라우저 환경에서만 동작)
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
}

export type CompressQuality = "low" | "medium" | "high";

const QUALITY_SETTINGS: Record<
  CompressQuality,
  { imageQuality: number; scale: number }
> = {
  low: { imageQuality: 0.4, scale: 1.0 },    // 강한 압축, 화질 손실 있음
  medium: { imageQuality: 0.65, scale: 1.5 }, // 균형
  high: { imageQuality: 0.85, scale: 2.0 },   // 고화질 유지
};

export interface PdfCompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

export async function mergePdfs(files: File[]): Promise<Blob> {
  const { PDFDocument: PD } = await import("pdf-lib");
  const merged = await PD.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PD.load(arrayBuffer);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const bytes = await merged.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

export async function compressPdf(
  file: File,
  quality: CompressQuality = "medium",
  onProgress?: (page: number, total: number) => void
): Promise<PdfCompressResult> {
  const { imageQuality, scale } = QUALITY_SETTINGS[quality];

  const arrayBuffer = await file.arrayBuffer();

  // PDF.js로 PDF 파싱
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfJsDoc = await loadingTask.promise;
  const numPages = pdfJsDoc.numPages;

  // 새 PDF 문서 생성
  const newPdf = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfJsDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // 캔버스에 페이지 렌더링
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d")!;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    // JPEG로 압축 (PNG보다 훨씬 작음)
    const jpegDataUrl = canvas.toDataURL("image/jpeg", imageQuality);
    const base64 = jpegDataUrl.split(",")[1];
    const jpegBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // 새 PDF에 이미지 페이지 추가
    const jpegImage = await newPdf.embedJpg(jpegBytes);
    const pdfPage = newPdf.addPage([canvas.width, canvas.height]);
    pdfPage.drawImage(jpegImage, {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    });

    onProgress?.(pageNum, numPages);
  }

  const compressedBytes = await newPdf.save();
  const compressedBlob = new Blob([compressedBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });

  return {
    blob: compressedBlob,
    originalSize: file.size,
    compressedSize: compressedBlob.size,
  };
}
