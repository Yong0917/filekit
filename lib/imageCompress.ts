import imageCompression from "browser-image-compression";

export interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

// 이미지 압축 (JPG/PNG/WebP)
export async function compressImage(
  file: File,
  quality: number, // 0~1
  onProgress?: (p: number) => void
): Promise<CompressResult> {
  const options = {
    maxSizeMB: 10,
    useWebWorker: true,
    initialQuality: quality,
    alwaysKeepResolution: true,
    onProgress,
  };

  const compressed = await imageCompression(file, options);

  return {
    blob: compressed,
    originalSize: file.size,
    compressedSize: compressed.size,
  };
}
