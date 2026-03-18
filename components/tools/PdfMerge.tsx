"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import FileListEditor from "@/components/FileListEditor";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { mergePdfs } from "@/lib/pdfCompress";
import { downloadBlob, formatBytes, classifyPdfError, getPdfErrorMessage } from "@/lib/utils";

export default function PdfMerge() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [mergeError, setMergeError] = useState("");

  const { files, addFiles, removeFile, moveFile, clearFiles, error: sizeError } =
    useFileProcessor<never>({ maxSizeMB: 200 });

  async function handleMerge() {
    if (files.length < 2) return;
    setLoading(true);
    setResult(null);
    setMergeError("");
    setProgress(30);

    try {
      const merged = await mergePdfs(files);
      setProgress(100);
      setResult(merged);
    } catch (e) {
      const type = classifyPdfError(e);
      setMergeError(getPdfErrorMessage(type));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const displayError = sizeError || mergeError;

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={addFiles}
        accept={{ "application/pdf": [".pdf"] }}
        multiple
        label="PDF 파일을 업로드 (순서대로 병합)"
        subLabel="2개 이상의 PDF 필요 · 최대 200MB"
      />

      {files.length > 0 && (
        <FileListEditor
          files={files}
          onMove={moveFile}
          onRemove={removeFile}
          onClear={clearFiles}
          showSize
          headerLabel={`${files.length}개 PDF · 총 ${formatBytes(totalSize)}`}
        />
      )}

      {loading && <ProgressBar current={progress} label="PDF 병합 중..." />}

      {displayError && (
        <p
          className="text-[13px] p-3 rounded-lg whitespace-pre-line"
          style={{ color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          {displayError}
        </p>
      )}

      {/* 병합 완료 결과 */}
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
            PDF 병합 완료
          </span>
          <button
            onClick={() => downloadBlob(result, "merged.pdf")}
            className="cursor-pointer text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all duration-150 hover:brightness-90 active:scale-95"
            style={{
              background: "var(--success)",
              boxShadow: "0 1px 2px rgba(22,163,74,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            aria-label="병합된 PDF 다운로드"
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
        onClick={handleMerge}
        disabled={files.length < 2 || loading}
        className="w-full py-[11px] px-4 rounded-xl text-[14px] font-medium text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-90 active:scale-[0.99] cursor-pointer"
        style={{
          background: "var(--accent)",
          boxShadow: "0 1px 3px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
        aria-label={files.length >= 2 ? `PDF ${files.length}개 병합 시작` : undefined}
      >
        {loading ? "병합 중..." : files.length < 2 ? "PDF 2개 이상 필요" : `PDF ${files.length}개 병합`}
      </button>
    </div>
  );
}
