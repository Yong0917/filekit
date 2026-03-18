export interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

// Canvas API를 이용한 이미지 압축 (quality 0~1 직접 반영)
export function compressImage(
  file: File,
  quality: number, // 0~1
  onProgress?: (p: number) => void
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    onProgress?.(10);
    const reader = new FileReader();
    reader.onload = (e) => {
      onProgress?.(30);
      const img = new Image();
      img.onload = () => {
        onProgress?.(60);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d")!;

        // PNG → JPEG 변환 시 투명 배경 흰색 처리
        const isPng = file.type === "image/png";
        const outputMime = isPng ? "image/png" : "image/jpeg";

        if (!isPng) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        // PNG는 무손실이라 quality 파라미터 무시됨
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("압축 실패"));
              return;
            }
            onProgress?.(100);
            resolve({
              blob,
              originalSize: file.size,
              compressedSize: blob.size,
            });
          },
          outputMime,
          isPng ? undefined : quality
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
