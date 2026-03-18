"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import FileThumb from "@/components/FileThumb";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { compressPdf, CompressQuality } from "@/lib/pdfCompress";
import { downloadBlob, classifyPdfError, getPdfErrorMessage } from "@/lib/utils";

interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  name: string;
  file: File;
}

const QUALITY_OPTIONS: { value: CompressQuality; label: string; desc: string }[] = [
  { value: "low", label: "강한 압축", desc: "최소 크기, 화질 손실" },
  { value: "medium", label: "균형", desc: "크기/화질 균형" },
  { value: "high", label: "고화질", desc: "높은 화질 유지" },
];

export default function PdfCompress() {
  const [quality, setQuality] = useState<CompressQuality>("medium");
  const [pageProgress, setPageProgress] = useState<{ page: number; total: number } | null>(null);

  const {
    files,
    addFiles,
    clearFiles,
    loading,
    progress,
    currentIndex,
    results,
    error,
    processFiles,
  } = useFileProcessor<CompressResult>({ maxSizeMB: 200 });

  async function handleCompress() {
    setPageProgress(null);
    await processFiles(
      async (file) => {
        let res;
        try {
          res = await compressPdf(file, quality, (page, total) => {
            setPageProgress({ page, total });
          });
        } catch (e) {
          const type = classifyPdfError(e);
          throw new Error(`"${file.name}": ${getPdfErrorMessage(type)}`);
        }
        return { ...res, name: file.name, file };
      },
      { parallel: false } // 페이지 렌더링은 순차 처리
    );
    setPageProgress(null);
  }

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={addFiles}
        accept={{ "application/pdf": [".pdf"] }}
        multiple
        label="PDF 파일을 업로드"
        subLabel="내부 이미지만 재압축 · 텍스트·벡터 보존 · 최대 200MB"
      />

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
              {files.length}개 파일 선택됨
            </p>
            <button
              onClick={clearFiles}
              className="cursor-pointer text-[12px] hover:underline"
              style={{ color: "var(--danger)" }}
              aria-label="파일 전체 제거"
            >
              전체 제거
            </button>
          </div>
          <div
            className="space-y-px rounded-xl overflow-hidden max-h-48 overflow-y-auto"
            style={{ border: "1px solid var(--border)" }}
          >
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-2.5 py-2"
                style={{
                  background: "var(--surface)",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <FileThumb file={file} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] truncate" style={{ color: "var(--fg-2)" }}>
                    {file.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 품질 선택 */}
      <div className="space-y-1.5">
        <p className="text-[12px] font-medium" style={{ color: "var(--muted)" }}>
          압축 품질
        </p>
        <div className="grid grid-cols-3 gap-2">
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setQuality(opt.value)}
              className="py-2 px-3 rounded-lg text-left transition-all duration-100 cursor-pointer"
              style={{
                background: quality === opt.value ? "var(--accent)" : "var(--surface)",
                border: `1px solid ${quality === opt.value ? "var(--accent)" : "var(--border)"}`,
                color: quality === opt.value ? "#fff" : "var(--fg-2)",
              }}
            >
              <div className="text-[12px] font-medium">{opt.label}</div>
              <div
                className="text-[11px] mt-0.5"
                style={{ color: quality === opt.value ? "rgba(255,255,255,0.75)" : "var(--muted)" }}
              >
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div
        className="p-3 rounded-lg text-[12px] leading-relaxed"
        style={{
          background: "rgba(217,119,6,0.07)",
          border: "1px solid rgba(217,119,6,0.2)",
          color: "#92400E",
        }}
      >
        PDF 내부에 삽입된 JPEG 이미지만 재압축합니다. 텍스트 선택·복사 기능은 그대로 유지되며,
        이미지가 많은 PDF에서 가장 효과적입니다.
      </div>

      {loading && (
        <div className="space-y-1">
          <ProgressBar
            current={progress}
            label={
              files.length > 1
                ? `${currentIndex} / ${files.length} 파일 처리 중...`
                : pageProgress
                ? `이미지 ${pageProgress.page} / ${pageProgress.total} 재압축 중...`
                : "처리 중..."
            }
          />
          {pageProgress && files.length <= 1 && (
            <p className="text-[11px] text-right" style={{ color: "var(--muted)" }}>
              이미지 {pageProgress.page} / {pageProgress.total}
            </p>
          )}
        </div>
      )}

      {error && (
        <p
          className="text-[13px] p-3 rounded-lg whitespace-pre-line"
          style={{
            color: "var(--danger)",
            background: "var(--danger-bg)",
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          {error}
        </p>
      )}

      <button
        onClick={handleCompress}
        disabled={files.length === 0 || loading}
        className="w-full py-[11px] px-4 rounded-xl text-[14px] font-medium text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-90 active:scale-[0.99] cursor-pointer"
        style={{
          background: "var(--accent)",
          boxShadow: "0 1px 3px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {loading ? "압축 중..." : "PDF 압축"}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold" style={{ color: "var(--fg)" }}>
            압축 결과
          </h3>
          {results.map((item, i) => (
            <ResultCard
              key={i}
              file={item.file}
              name={item.name}
              originalSize={item.originalSize}
              resultSize={item.compressedSize}
              onDownload={() => {
                const base = item.name.replace(/\.pdf$/i, "");
                downloadBlob(item.blob, `${base}_compressed.pdf`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
