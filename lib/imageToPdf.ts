import { jsPDF } from "jspdf";

export interface ImageToPdfResult {
  blob: Blob;
  pageCount: number;
}

// 이미지 파일을 Data URL로 변환
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 이미지의 실제 크기 반환
function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
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
    try {
      dataUrl = await fileToDataUrl(files[i]);
    } catch {
      throw new Error(
        `이미지 로딩 실패: "${files[i].name}"이(가) 손상되었거나 지원하지 않는 형식입니다.`
      );
    }

    let width: number, height: number;
    try {
      ({ width, height } = await getImageDimensions(dataUrl));
    } catch {
      throw new Error(`이미지 크기 읽기 실패: "${files[i].name}"`);
    }

    // 가로/세로 비율에 맞춰 PDF 페이지 방향 결정
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

    pdf!.addImage(dataUrl, "JPEG", 0, 0, width, height);
    onProgress?.(Math.round(((i + 1) / files.length) * 100));
  }

  const arrayBuffer = pdf!.output("arraybuffer");
  return {
    blob: new Blob([arrayBuffer], { type: "application/pdf" }),
    pageCount: files.length,
  };
}
