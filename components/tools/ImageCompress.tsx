"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import QualitySlider from "@/components/QualitySlider";
import FileThumb from "@/components/FileThumb";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { compressImage } from "@/lib/imageCompress";
import { downloadBlob } from "@/lib/utils";

interface CompressedFile {
  name: string;
  file: File;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

export default function ImageCompress() {
  const [quality, setQuality] = useState(80);
  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    loading,
    progress,
    currentIndex,
    results,
    error,
    processFiles,
  } = useFileProcessor<CompressedFile>({ maxSizeMB: 100 });

  async function handleCompress() {
    await processFiles(
      async (file, _i, onProgress) => {
        const res = await compressImage(file, quality / 100, onProgress);
        return {
          name: file.name,
          file,
          blob: res.blob,
          originalSize: res.originalSize,
          compressedSize: res.compressedSize,
        };
      },
      { parallel: true }
    );
  }

  function handleDownload(item: CompressedFile) {
    const ext = item.blob.type.includes("png") ? "png" : "jpg";
    const baseName = item.name.replace(/\.[^.]+$/, "");
    downloadBlob(item.blob, `${baseName}_compressed.${ext}`);
  }

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={addFiles}
        accept={{ "image/jpeg": [], "image/png": [], "image/webp": [] }}
        multiple
        label="JPG / PNG / WebP 이미지를 업로드"
        subLabel="여러 파일 동시 처리 가능 · 최대 100MB"
      />

      {/* 파일 목록 + 썸네일 */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {files.length}개 파일 선택됨
            </p>
            <button
              onClick={clearFiles}
              className="cursor-pointer text-xs text-red-500 hover:underline"
              aria-label="파일 전체 제거"
            >
              전체 제거
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <FileThumb file={file} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="cursor-pointer p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-400 flex-shrink-0"
                  aria-label={`${file.name} 제거`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <QualitySlider
        id="compress-quality"
        value={quality}
        onChange={setQuality}
        disabled={loading}
        label="압축 품질"
      />

      {/* 진행률 */}
      {loading && (
        <ProgressBar
          current={progress}
          label={`${currentIndex} / ${files.length} 처리 중...`}
        />
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg whitespace-pre-line">
          {error}
        </p>
      )}

      <button
        onClick={handleCompress}
        disabled={files.length === 0 || loading}
        className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "압축 중..." : "이미지 압축"}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">
              압축 결과
            </h3>
            {results.length > 1 && (
              <button
                onClick={() => results.forEach((item) => handleDownload(item))}
                className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline"
                aria-label="압축 결과 전체 다운로드"
              >
                전체 다운로드
              </button>
            )}
          </div>
          {results.map((item, i) => (
            <ResultCard
              key={i}
              file={item.file}
              name={item.name}
              originalSize={item.originalSize}
              resultSize={item.compressedSize}
              onDownload={() => handleDownload(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
