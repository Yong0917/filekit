"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import FileListEditor from "@/components/FileListEditor";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { imagesToPdf } from "@/lib/imageToPdf";
import { downloadBlob } from "@/lib/utils";

interface PdfResult {
  blob: Blob;
  fileName: string;
}

export default function ImageToPdf() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PdfResult | null>(null);
  const [convertError, setConvertError] = useState("");

  const { files, addFiles, removeFile, moveFile, clearFiles, error: sizeError } =
    useFileProcessor<never>({ maxSizeMB: 100 });

  async function handleConvert() {
    if (files.length === 0) return;
    setLoading(true);
    setResult(null);
    setConvertError("");
    setProgress(0);

    try {
      const res = await imagesToPdf(files, setProgress);
      const firstName = files[0].name.replace(/\.[^.]+$/, "");
      setResult({ blob: res.blob, fileName: `${firstName}_converted.pdf` });
    } catch (e) {
      setConvertError(
        e instanceof Error
          ? e.message
          : "변환 중 오류가 발생했습니다. 이미지 파일을 확인해주세요."
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const displayError = sizeError || convertError;

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={addFiles}
        accept={{ "image/jpeg": [], "image/png": [], "image/webp": [], "image/gif": [] }}
        multiple
        label="이미지를 업로드 (순서대로 PDF 페이지 생성)"
        subLabel="JPG, PNG, WebP 지원 · 최대 100MB"
      />

      {files.length > 0 && (
        <FileListEditor
          files={files}
          onMove={moveFile}
          onRemove={removeFile}
          onClear={clearFiles}
          headerLabel={`${files.length}개 이미지`}
        />
      )}

      {loading && <ProgressBar current={progress} label="PDF 변환 중..." />}

      {displayError && (
        <p
          className="text-[13px] p-3 rounded-lg whitespace-pre-line"
          style={{ color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          {displayError}
        </p>
      )}

      {/* 변환 완료 결과 */}
      {result && (
        <div
          className="flex items-center justify-between px-3.5 py-3 rounded-xl"
          style={{
            background: "var(--success-bg)",
            border: "1px solid var(--success-border)",
          }}
        >
          <span
            className="text-[13px] font-medium flex items-center gap-1.5"
            style={{ color: "var(--success)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            PDF 변환 완료
          </span>
          <button
            onClick={() => downloadBlob(result.blob, result.fileName)}
            className="cursor-pointer text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all duration-150 hover:brightness-90 active:scale-95"
            style={{
              background: "var(--success)",
              boxShadow: "0 1px 2px rgba(22,163,74,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            aria-label={`${result.fileName} 다운로드`}
          >
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 2v6M3 6l3 3 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 10h8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              다운로드
            </span>
          </button>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={files.length === 0 || loading}
        className="w-full py-[11px] px-4 rounded-xl text-[14px] font-medium text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-90 active:scale-[0.99] cursor-pointer"
        style={{
          background: "var(--accent)",
          boxShadow: "0 1px 3px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
        aria-label={`이미지 ${files.length}장을 PDF로 변환`}
      >
        {loading ? "변환 중..." : `PDF로 변환 (${files.length}장)`}
      </button>
    </div>
  );
}
