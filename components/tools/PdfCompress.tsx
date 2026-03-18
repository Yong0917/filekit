"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import SizeDisplay from "@/components/SizeDisplay";
import ProgressBar from "@/components/ProgressBar";
import FileThumb from "@/components/FileThumb";
import { compressPdf } from "@/lib/pdfCompress";
import { downloadBlob } from "@/lib/utils";

interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  name: string;
}

export default function PdfCompress() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<CompressResult[]>([]);
  const [error, setError] = useState("");

  async function handleCompress() {
    if (files.length === 0) return;
    setLoading(true);
    setResults([]);
    setError("");
    setProgress(0);

    try {
      const out: CompressResult[] = [];
      for (let i = 0; i < files.length; i++) {
        setCurrentIndex(i + 1);
        setProgress(Math.round((i / files.length) * 100));
        const res = await compressPdf(files[i]);
        out.push({ ...res, name: files[i].name });
      }
      setProgress(100);
      setResults(out);
    } catch (e) {
      setError("PDF 처리 중 오류가 발생했습니다. 암호화된 PDF는 지원하지 않습니다.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={setFiles}
        accept={{ "application/pdf": [".pdf"] }}
        multiple
        label="PDF 파일을 업로드"
        subLabel="메타데이터 제거 및 구조 최적화로 용량 축소"
      />

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500 dark:text-gray-400">{files.length}개 파일 선택됨</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <FileThumb file={file} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
        ℹ️ 브라우저 기반 PDF 압축은 메타데이터 제거 및 구조 최적화를 수행합니다.
        이미지가 많은 PDF는 압축률이 낮을 수 있습니다.
      </div>

      {loading && (
        <ProgressBar
          current={progress}
          label={`${currentIndex} / ${files.length} 처리 중...`}
        />
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>
      )}

      <button
        onClick={handleCompress}
        disabled={files.length === 0 || loading}
        className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "압축 중..." : "PDF 압축"}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">압축 결과</h3>
          {results.map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2.5">
                <FileThumb file={files[i]} size={36} />
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {item.name}
                </span>
                <button
                  onClick={() => {
                    const base = item.name.replace(/\.pdf$/i, "");
                    downloadBlob(item.blob, `${base}_compressed.pdf`);
                  }}
                  className="cursor-pointer text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors flex-shrink-0"
                >
                  ⬇ 다운로드
                </button>
              </div>
              <SizeDisplay originalSize={item.originalSize} newSize={item.compressedSize} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
