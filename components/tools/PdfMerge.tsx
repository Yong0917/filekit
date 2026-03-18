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
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg whitespace-pre-line">
          {displayError}
        </p>
      )}

      {result && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 dark:text-green-400">
              ✓ PDF 병합 완료
            </span>
            <button
              onClick={() => downloadBlob(result, "merged.pdf")}
              className="cursor-pointer text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              aria-label="병합된 PDF 다운로드"
            >
              ⬇ 다운로드
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleMerge}
        disabled={files.length < 2 || loading}
        className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={files.length >= 2 ? `PDF ${files.length}개 병합 시작` : undefined}
      >
        {loading ? "병합 중..." : files.length < 2 ? "PDF 2개 이상 필요" : `PDF ${files.length}개 병합`}
      </button>
    </div>
  );
}
