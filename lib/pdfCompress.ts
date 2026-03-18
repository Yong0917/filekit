import { PDFDocument } from "pdf-lib";

export interface PdfCompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

// PDF 압축 (객체 정리 + 재직렬화로 파일 크기 축소)
export async function compressPdf(file: File): Promise<PdfCompressResult> {
  const arrayBuffer = await file.arrayBuffer();

  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    updateMetadata: false,
  });

  // 불필요한 메타데이터 제거
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("");
  pdfDoc.setCreator("");

  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true, // 객체 스트림으로 압축
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  const compressedBlob = new Blob([compressedBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });

  return {
    blob: compressedBlob,
    originalSize: file.size,
    compressedSize: compressedBlob.size,
  };
}

// 여러 PDF 병합
export async function mergePdfs(files: File[]): Promise<Blob> {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const bytes = await merged.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
}
