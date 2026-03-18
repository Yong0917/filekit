export type ImageFormat = "jpeg" | "png" | "webp";

export interface ConvertResult {
  blob: Blob;
  originalSize: number;
  convertedSize: number;
}

// Canvas를 이용한 이미지 포맷 변환
export function convertImageFormat(
  file: File,
  targetFormat: ImageFormat,
  quality = 0.9
): Promise<ConvertResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context를 가져올 수 없습니다."));
          return;
        }
        // PNG → JPEG 변환 시 배경 흰색으로 채움 (투명도 제거)
        if (targetFormat === "jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        const mimeType = `image/${targetFormat}`;
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(
                new Error(
                  `${targetFormat.toUpperCase()} 변환 실패: 지원하지 않는 이미지 형식이거나 브라우저가 해당 포맷을 지원하지 않습니다.`
                )
              );
              return;
            }
            resolve({
              blob,
              originalSize: file.size,
              convertedSize: blob.size,
            });
          },
          mimeType,
          quality
        );
      };
      img.onerror = () =>
        reject(
          new Error(
            "이미지 로딩 실패: 파일이 손상되었거나 지원하지 않는 형식입니다."
          )
        );
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
