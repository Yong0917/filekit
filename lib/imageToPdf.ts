import { jsPDF } from "jspdf";

export interface ImageToPdfResult {
  blob: Blob;
  pageCount: number;
}

// 최대 장변 픽셀 (A4 200dpi 기준, 이 이상은 축소)
const MAX_DIMENSION = 2000;

// 이미지를 JPEG로 재인코딩 + 해상도 제한
function optimizeImage(
  file: File,
  quality = 0.85
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let w = img.naturalWidth;
      let h = img.naturalHeight;

      // 최대 해상도 제한 (비율 유지)
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);

      resolve({ dataUrl: canvas.toDataURL("image/jpeg", quality), width: w, height: h });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`이미지 로딩 실패: "${file.name}"`));
    };

    img.src = url;
  });
}

// 여러 이미지 → 단일 PDF (파일 순서는 전달된 배열 순서를 따름)
export async function imagesToPdf(
  files: File[],
  onProgress?: (p: number) => void
): Promise<ImageToPdfResult> {
  if (files.length === 0) throw new Error("변환할 이미지가 없습니다.");

  let pdf: jsPDF | null = null;
  onProgress?.(0);

  for (let i = 0; i < files.length; i++) {
    let dataUrl: string;
    let width: number, height: number;

    try {
      ({ dataUrl, width, height } = await optimizeImage(files[i]));
    } catch (e) {
      throw e instanceof Error
        ? e
        : new Error(`이미지 처리 실패: "${files[i].name}"`);
    }

    const orientation = width >= height ? "landscape" : "portrait";

    if (i === 0) {
      pdf = new jsPDF({
        orientation,
        unit: "px",
        format: [width, height],
        hotfixes: ["px_scaling"],
      });
    } else {
      pdf!.addPage([width, height], orientation);
    }

    pdf!.addImage(dataUrl, "JPEG", 0, 0, width, height, undefined, "MEDIUM");
    onProgress?.(Math.round(((i + 1) / files.length) * 100));
  }

  const arrayBuffer = pdf!.output("arraybuffer");
  return {
    blob: new Blob([arrayBuffer], { type: "application/pdf" }),
    pageCount: files.length,
  };
}
