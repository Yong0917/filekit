"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import FileThumb from "@/components/FileThumb";
import { mergePdfs } from "@/lib/pdfCompress";
import { downloadBlob, formatBytes } from "@/lib/utils";

export default function PdfMerge() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  function moveFile(from: number, to: number) {
    setFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleMerge() {
    if (files.length < 2) return;
    setLoading(true);
    setResult(null);
    setError("");
    setProgress(30);

    try {
      const merged = await mergePdfs(files);
      setProgress(100);
      setResult(merged);
    } catch (e) {
      setError("PDF 병합 중 오류가 발생했습니다. 암호화된 PDF는 지원하지 않습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={(incoming) => setFiles((prev) => [...prev, ...incoming])}
        accept={{ "application/pdf": [".pdf"] }}
        multiple
        label="PDF 파일을 업로드 (순서대로 병합)"
        subLabel="2개 이상의 PDF 필요"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {files.length}개 PDF · 총 {formatBytes(totalSize)}
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
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

      {loading && <ProgressBar current={progress} label="PDF 병합 중..." />}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>
      )}

      {result && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 dark:text-green-400">✓ PDF 병합 완료</span>
            <button
              onClick={() => downloadBlob(result, "merged.pdf")}
              className="cursor-pointer text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
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
      >
        {loading ? "병합 중..." : files.length < 2 ? "PDF 2개 이상 필요" : `PDF ${files.length}개 병합`}
      </button>
    </div>
  );
}
