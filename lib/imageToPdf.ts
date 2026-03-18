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

// 여러 이미지 → 단일 PDF
export async function imagesToPdf(files: File[]): Promise<ImageToPdfResult> {
  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));

  let pdf: jsPDF | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const dataUrl = await fileToDataUrl(sorted[i]);
    const { width, height } = await getImageDimensions(dataUrl);

    // 가로/세로 비율에 맞춰 PDF 페이지 방향 결정
    const orientation = width >= height ? "landscape" : "portrait";
    const format: [number, number] =
      orientation === "landscape" ? [width, height] : [width, height];

    if (i === 0) {
      pdf = new jsPDF({
        orientation,
        unit: "px",
        format,
        hotfixes: ["px_scaling"],
      });
    } else {
      pdf!.addPage([width, height], orientation);
    }

    pdf!.addImage(dataUrl, "JPEG", 0, 0, width, height);
  }

  if (!pdf) throw new Error("변환할 이미지가 없습니다.");

  const arrayBuffer = pdf.output("arraybuffer");
  return {
    blob: new Blob([arrayBuffer], { type: "application/pdf" }),
    pageCount: sorted.length,
  };
}
