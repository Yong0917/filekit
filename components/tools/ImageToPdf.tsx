"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import FileThumb from "@/components/FileThumb";
import { imagesToPdf } from "@/lib/imageToPdf";
import { downloadBlob } from "@/lib/utils";

interface PdfResult {
  blob: Blob;
  fileName: string;
}

export default function ImageToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PdfResult | null>(null);
  const [error, setError] = useState("");

  async function handleConvert() {
    if (files.length === 0) return;
    setLoading(true);
    setResult(null);
    setError("");
    setProgress(0);

    try {
      setProgress(30);
      const res = await imagesToPdf(files);
      setProgress(100);
      const firstName = files[0].name.replace(/\.[^.]+$/, "");
      setResult({ blob: res.blob, fileName: `${firstName}_converted.pdf` });
    } catch (e) {
      setError("변환 중 오류가 발생했습니다. 이미지 파일을 확인해주세요.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function moveFile(from: number, to: number) {
    setFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={(incoming) => setFiles((prev) => [...prev, ...incoming])}
        accept={{ "image/jpeg": [], "image/png": [], "image/webp": [], "image/gif": [] }}
        multiple
        label="이미지를 업로드 (순서대로 PDF 페이지 생성)"
        subLabel="JPG, PNG, WebP 지원 · 여러 장 가능"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {files.length}개 이미지 (순서 조정 가능)
            </h3>
            <button onClick={() => setFiles([])} className="cursor-pointer text-xs text-red-500 hover:underline">
              전체 제거
            </button>
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="w-5 text-center text-gray-400 font-mono text-xs flex-shrink-0">{i + 1}</span>
                <FileThumb file={file} size={36} />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                <div className="flex gap-1 flex-shrink-0">
                  {i > 0 && (
                    <button onClick={() => moveFile(i, i - 1)} className="cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500">↑</button>
                  )}
                  {i < files.length - 1 && (
                    <button onClick={() => moveFile(i, i + 1)} className="cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500">↓</button>
                  )}
                  <button onClick={() => removeFile(i)} className="cursor-pointer p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-400">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <ProgressBar current={progress} label="PDF 변환 중..." />}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>
      )}

      {result && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 dark:text-green-400">✓ PDF 변환 완료</span>
            <button
              onClick={() => downloadBlob(result.blob, result.fileName)}
              className="cursor-pointer text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
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
      >
        {loading ? "변환 중..." : `PDF로 변환 (${files.length}장)`}
      </button>
    </div>
  );
}
