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
          headerLabel={`${files.length}개 이미지 (순서 조정 가능)`}
        />
      )}

      {loading && <ProgressBar current={progress} label="PDF 변환 중..." />}

      {displayError && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg whitespace-pre-line">
          {displayError}
        </p>
      )}

      {result && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 dark:text-green-400">
              ✓ PDF 변환 완료
            </span>
            <button
              onClick={() => downloadBlob(result.blob, result.fileName)}
              className="cursor-pointer text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              aria-label={`${result.fileName} 다운로드`}
            >
              ⬇ 다운로드
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={files.length === 0 || loading}
        className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={`이미지 ${files.length}장을 PDF로 변환`}
      >
        {loading ? "변환 중..." : `PDF로 변환 (${files.length}장)`}
      </button>
    </div>
  );
}
