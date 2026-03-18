"use client";

import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import FileThumb from "@/components/FileThumb";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { compressPdf } from "@/lib/pdfCompress";
import { downloadBlob, classifyPdfError, getPdfErrorMessage } from "@/lib/utils";

interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  name: string;
  file: File;
}

export default function PdfCompress() {
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
    await processFiles(
      async (file) => {
        let res;
        try {
          res = await compressPdf(file);
        } catch (e) {
          const type = classifyPdfError(e);
          throw new Error(`"${file.name}": ${getPdfErrorMessage(type)}`);
        }
        return { ...res, name: file.name, file };
      },
      { parallel: true }
    );
  }

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={addFiles}
        accept={{ "application/pdf": [".pdf"] }}
        multiple
        label="PDF 파일을 업로드"
        subLabel="메타데이터 제거 및 구조 최적화로 용량 축소 · 최대 200MB"
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

      {/* 안내 메시지 */}
      <div
        className="p-3 rounded-lg text-[12px] leading-relaxed"
        style={{
          background: "rgba(217,119,6,0.07)",
          border: "1px solid rgba(217,119,6,0.2)",
          color: "#92400E",
        }}
      >
        브라우저 기반 PDF 압축은 메타데이터 제거 및 구조 최적화를 수행합니다.
        이미지가 많은 PDF는 압축률이 낮을 수 있습니다.
      </div>

      {loading && (
        <ProgressBar
          current={progress}
          label={`${currentIndex} / ${files.length} 처리 중...`}
        />
      )}

      {error && (
        <p
          className="text-[13px] p-3 rounded-lg whitespace-pre-line"
          style={{ color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid rgba(220,38,38,0.2)" }}
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
