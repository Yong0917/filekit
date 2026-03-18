import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFArray,
  PDFRef,
  decodePDFRawStream,
} from "pdf-lib";

export type CompressQuality = "low" | "medium" | "high";

const QUALITY_SETTINGS: Record<CompressQuality, { imageQuality: number }> = {
  low: { imageQuality: 0.4 },
  medium: { imageQuality: 0.65 },
  high: { imageQuality: 0.85 },
};

export interface PdfCompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

// 처리 가능한 필터 타입
type FilterType = "/DCTDecode" | "/FlateDecode" | "/Raw";

function getFilterType(stream: PDFRawStream): FilterType | null {
  const subtype = stream.dict.get(PDFName.of("Subtype"));
  if (subtype?.toString() !== "/Image") return null;

  const filter = stream.dict.get(PDFName.of("Filter"));

  // 필터 없음 = 비압축 raw 픽셀 데이터
  if (!filter) return "/Raw";

  const f = filter instanceof PDFArray
    ? filter.asArray()[0]?.toString() ?? null
    : filter.toString();

  if (f === "/DCTDecode" || f === "/DCT") return "/DCTDecode";
  if (f === "/FlateDecode" || f === "/Fl") return "/FlateDecode";
  return null;
}

// ColorSpace에서 채널 수 반환 (간접 참조·ICCBased 처리 포함)
// Indexed는 null 반환 (별도 처리)
function resolveChannels(stream: PDFRawStream, pdfDoc: PDFDocument): number | null {
  let csObj = stream.dict.get(PDFName.of("ColorSpace"));
  if (!csObj) return null;

  if (csObj instanceof PDFRef) {
    csObj = pdfDoc.context.lookup(csObj) ?? csObj;
  }

  const csStr = csObj.toString();

  if (csStr === "/DeviceRGB" || csStr === "/RGB") return 3;
  if (csStr === "/DeviceGray" || csStr === "/G") return 1;

  if (csObj instanceof PDFArray) {
    const arr = csObj.asArray();
    const first = arr[0]?.toString();

    if (first === "/ICCBased") {
      const iccRef = arr[1];
      if (iccRef instanceof PDFRef) {
        const iccStream = pdfDoc.context.lookup(iccRef);
        if (iccStream instanceof PDFRawStream) {
          const n = (iccStream.dict.get(PDFName.of("N")) as PDFNumber | undefined)?.asNumber();
          if (n === 1 || n === 3) return n;
        }
      }
      return null;
    }

    if (first === "/CalRGB") return 3;
    if (first === "/CalGray") return 1;
    if (first === "/DeviceRGB") return 3;
    if (first === "/DeviceGray") return 1;
  }

  return null;
}

// Indexed ColorSpace 팔레트 추출 → RGBA 배열 반환
// [/Indexed, baseCS, hival, lookup_stream_ref]
function resolveIndexedPalette(
  stream: PDFRawStream,
  pdfDoc: PDFDocument
): Uint8Array | null {
  let csObj = stream.dict.get(PDFName.of("ColorSpace"));
  if (!csObj) return null;

  if (csObj instanceof PDFRef) {
    csObj = pdfDoc.context.lookup(csObj) ?? csObj;
  }

  if (!(csObj instanceof PDFArray)) return null;
  const arr = csObj.asArray();
  if (arr[0]?.toString() !== "/Indexed") return null;

  const lookupRef = arr[3];
  if (!(lookupRef instanceof PDFRef)) return null;

  const lookupStream = pdfDoc.context.lookup(lookupRef);
  if (!(lookupStream instanceof PDFRawStream)) return null;

  return lookupStream.contents; // 팔레트: [R0,G0,B0, R1,G1,B1, ...]
}

// 픽셀 배열 → canvas → JPEG bytes
function pixelsToJpeg(
  pixels: Uint8Array,
  width: number,
  height: number,
  channels: number,
  quality: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(width, height);
  const d = imgData.data;

  for (let i = 0; i < width * height; i++) {
    if (channels === 3) {
      d[i * 4]     = pixels[i * 3];
      d[i * 4 + 1] = pixels[i * 3 + 1];
      d[i * 4 + 2] = pixels[i * 3 + 2];
    } else {
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = pixels[i];
    }
    d[i * 4 + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/jpeg", quality);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  return Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
}

// DCTDecode (JPEG) 재압축
async function recompressJpeg(bytes: Uint8Array, quality: number): Promise<Uint8Array | null> {
  try {
    const img = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }));
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    img.close();

    const newBytes = dataUrlToBytes(canvas.toDataURL("image/jpeg", quality));
    return newBytes.length < bytes.length ? newBytes : null;
  } catch {
    return null;
  }
}

// FlateDecode (PNG/zlib) → JPEG 재압축
async function recompressFlate(
  stream: PDFRawStream,
  quality: number,
  pdfDoc: PDFDocument
): Promise<Uint8Array | null> {
  try {
    const dict = stream.dict;
    const width = (dict.get(PDFName.of("Width")) as PDFNumber | undefined)?.asNumber();
    const height = (dict.get(PDFName.of("Height")) as PDFNumber | undefined)?.asNumber();
    const bpc = (dict.get(PDFName.of("BitsPerComponent")) as PDFNumber | undefined)?.asNumber() ?? 8;

    if (!width || !height || bpc !== 8) return null;

    // Indexed ColorSpace 처리
    const palette = resolveIndexedPalette(stream, pdfDoc);
    if (palette) {
      const pixels = decodePDFRawStream(stream).decode();
      if (pixels.length < width * height) return null;

      const rgbPixels = new Uint8Array(width * height * 3);
      for (let i = 0; i < width * height; i++) {
        const idx = pixels[i];
        rgbPixels[i * 3]     = palette[idx * 3]     ?? 0;
        rgbPixels[i * 3 + 1] = palette[idx * 3 + 1] ?? 0;
        rgbPixels[i * 3 + 2] = palette[idx * 3 + 2] ?? 0;
      }

      const newBytes = dataUrlToBytes(pixelsToJpeg(rgbPixels, width, height, 3, quality));
      return newBytes.length < stream.contents.length ? newBytes : null;
    }

    const channels = resolveChannels(stream, pdfDoc);
    if (!channels || channels > 3) return null;

    const pixels = decodePDFRawStream(stream).decode();
    if (pixels.length < width * height * channels) return null;

    const newBytes = dataUrlToBytes(pixelsToJpeg(pixels, width, height, channels, quality));
    return newBytes.length < stream.contents.length ? newBytes : null;
  } catch {
    return null;
  }
}

// 비압축 Raw (필터 없음) → JPEG 재압축
async function recompressRaw(
  stream: PDFRawStream,
  quality: number,
  pdfDoc: PDFDocument
): Promise<Uint8Array | null> {
  try {
    const dict = stream.dict;
    const width = (dict.get(PDFName.of("Width")) as PDFNumber | undefined)?.asNumber();
    const height = (dict.get(PDFName.of("Height")) as PDFNumber | undefined)?.asNumber();
    const bpc = (dict.get(PDFName.of("BitsPerComponent")) as PDFNumber | undefined)?.asNumber() ?? 8;

    if (!width || !height || bpc !== 8) return null;

    const pixels = stream.contents; // raw: 필터 없음, 바로 픽셀 데이터

    // Indexed ColorSpace 처리
    const palette = resolveIndexedPalette(stream, pdfDoc);
    if (palette) {
      if (pixels.length < width * height) return null;

      const rgbPixels = new Uint8Array(width * height * 3);
      for (let i = 0; i < width * height; i++) {
        const idx = pixels[i];
        rgbPixels[i * 3]     = palette[idx * 3]     ?? 0;
        rgbPixels[i * 3 + 1] = palette[idx * 3 + 1] ?? 0;
        rgbPixels[i * 3 + 2] = palette[idx * 3 + 2] ?? 0;
      }

      return dataUrlToBytes(pixelsToJpeg(rgbPixels, width, height, 3, quality));
    }

    const channels = resolveChannels(stream, pdfDoc);
    if (!channels || channels > 3) return null;

    if (pixels.length < width * height * channels) return null;

    // raw는 무조건 압축 없는 상태이므로 JPEG이 항상 작음
    return dataUrlToBytes(pixelsToJpeg(pixels, width, height, channels, quality));
  } catch {
    return null;
  }
}

export async function compressPdf(
  file: File,
  quality: CompressQuality = "medium",
  onProgress?: (current: number, total: number) => void
): Promise<PdfCompressResult> {
  const { imageQuality } = QUALITY_SETTINGS[quality];

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

  // 메타데이터 제거
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer("");
  pdfDoc.setCreator("");

  // JPEG·PNG·Raw 이미지 스트림 수집
  const allObjects = [...pdfDoc.context.enumerateIndirectObjects()];
  const imageObjects = allObjects.filter(([, obj]) => {
    if (!(obj instanceof PDFRawStream)) return false;
    return getFilterType(obj as PDFRawStream) !== null;
  }) as [PDFRef, PDFRawStream][];

  let processed = 0;
  for (const [ref, stream] of imageObjects) {
    const filterType = getFilterType(stream);
    let newBytes: Uint8Array | null = null;

    if (filterType === "/DCTDecode") {
      newBytes = await recompressJpeg(stream.contents, imageQuality);
    } else if (filterType === "/FlateDecode") {
      newBytes = await recompressFlate(stream, imageQuality, pdfDoc);
    } else if (filterType === "/Raw") {
      newBytes = await recompressRaw(stream, imageQuality, pdfDoc);
    }

    if (newBytes) {
      // 필터를 DCTDecode(JPEG)로 교체
      stream.dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
      stream.dict.delete(PDFName.of("DecodeParms"));

      const newStream = PDFRawStream.of(stream.dict, newBytes);
      newStream.dict.set(PDFName.of("Length"), PDFNumber.of(newBytes.length));
      pdfDoc.context.assign(ref, newStream);
    }

    processed++;
    onProgress?.(processed, imageObjects.length);
  }

  const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
  const compressedBlob = new Blob([compressedBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });

  return {
    blob: compressedBlob,
    originalSize: file.size,
    compressedSize: compressedBlob.size,
  };
}

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
