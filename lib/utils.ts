// 파일 크기 제한 상수 (MB)
export const IMAGE_MAX_MB = 100;
export const PDF_MAX_MB = 200;

// 파일 크기 검증
export function validateFileSize(
  file: File,
  maxMB: number
): { valid: boolean; message: string } {
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      message: `"${file.name}" 파일이 ${maxMB}MB를 초과합니다. (현재: ${sizeMB} MB)`,
    };
  }
  return { valid: true, message: "" };
}

// PDF 에러 유형 분류
export function classifyPdfError(
  e: unknown
): "encrypted" | "corrupted" | "unknown" {
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    if (msg.includes("encrypt") || msg.includes("password")) return "encrypted";
    if (msg.includes("invalid") || msg.includes("corrupt") || msg.includes("parse")) return "corrupted";
  }
  return "unknown";
}

// PDF 에러 유형별 사용자 메시지
export function getPdfErrorMessage(
  type: "encrypted" | "corrupted" | "unknown"
): string {
  if (type === "encrypted")
    return "암호화된 PDF는 처리할 수 없습니다. 암호를 해제한 후 다시 시도해주세요.";
  if (type === "corrupted")
    return "PDF 파일이 손상되었습니다. 다른 파일을 사용해주세요.";
  return "PDF 처리 중 예기치 않은 오류가 발생했습니다.";
}

// 파일 크기를 읽기 쉬운 형태로 변환
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// 압축률 계산
export function calcReduction(original: number, compressed: number): number {
  return Math.round(((original - compressed) / original) * 100);
}

// base64 → ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Blob을 base64로
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 파일 다운로드 트리거
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
