"use client";

import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import QualitySlider from "@/components/QualitySlider";
import FileThumb from "@/components/FileThumb";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { convertImageFormat, type ImageFormat } from "@/lib/imageConvert";
import { downloadBlob } from "@/lib/utils";
import { useState } from "react";

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: "jpeg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
];

interface ConvertedFile {
  name: string;
  file: File;
  blob: Blob;
  originalSize: number;
  convertedSize: number;
  format: ImageFormat;
}

export default function ImageConvert() {
  const [targetFormat, setTargetFormat] = useState<ImageFormat>("webp");
  const [quality, setQuality] = useState(85);
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
  } = useFileProcessor<ConvertedFile>({ maxSizeMB: 100 });

  async function handleConvert() {
    await processFiles(
      async (file) => {
        const res = await convertImageFormat(
          file,
          targetFormat,
          targetFormat === "png" ? 1 : quality / 100
        );
        return {
          name: file.name,
          file,
          blob: res.blob,
          originalSize: res.originalSize,
          convertedSize: res.convertedSize,
          format: targetFormat,
        };
      },
      { parallel: true }
    );
  }

  function handleDownload(item: ConvertedFile) {
    const base = item.name.replace(/\.[^.]+$/, "");
    const ext = item.format === "jpeg" ? "jpg" : item.format;
    downloadBlob(item.blob, `${base}.${ext}`);
  }

  const targetLabel = FORMAT_OPTIONS.find((f) => f.value === targetFormat)?.label;

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={addFiles}
        accept={{ "image/*": [] }}
        multiple
        label="변환할 이미지를 업로드"
        subLabel="JPG, PNG, WebP, GIF 등 모든 이미지 형식 지원 · 최대 100MB"
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

      {/* 출력 포맷 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          변환 포맷
        </label>
        <div className="flex gap-2" role="group" aria-label="변환 포맷 선택">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTargetFormat(opt.value)}
              aria-pressed={targetFormat === opt.value}
              aria-label={`${opt.label} 포맷으로 변환`}
              className={`cursor-pointer flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                targetFormat === opt.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 품질 슬라이더 (PNG는 무손실이라 숨김) */}
      {targetFormat !== "png" && (
        <QualitySlider
          id="convert-quality"
          value={quality}
          onChange={setQuality}
          disabled={loading}
          label="출력 품질"
        />
      )}

      {loading && (
        <ProgressBar
          current={progress}
          label={`${currentIndex} / ${files.length} 변환 중...`}
        />
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg whitespace-pre-line">
          {error}
        </p>
      )}

      <button
        onClick={handleConvert}
        disabled={files.length === 0 || loading}
        className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "변환 중..." : `${targetLabel}로 변환`}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">변환 결과</h3>
            {results.length > 1 && (
              <button
                onClick={() => results.forEach((r) => handleDownload(r))}
                className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline"
                aria-label="변환 결과 전체 다운로드"
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
              resultSize={item.convertedSize}
              onDownload={() => handleDownload(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
