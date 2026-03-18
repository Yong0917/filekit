"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import SizeDisplay from "@/components/SizeDisplay";
import ProgressBar from "@/components/ProgressBar";
import FileThumb from "@/components/FileThumb";
import { convertImageFormat, type ImageFormat } from "@/lib/imageConvert";
import { downloadBlob } from "@/lib/utils";

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: "jpeg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
];

interface ConvertedFile {
  name: string;
  blob: Blob;
  originalSize: number;
  convertedSize: number;
  format: ImageFormat;
}

export default function ImageConvert() {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>("webp");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ConvertedFile[]>([]);

  async function handleConvert() {
    if (files.length === 0) return;
    setLoading(true);
    setResults([]);
    setProgress(0);

    const out: ConvertedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i + 1);
      setProgress(Math.round((i / files.length) * 100));
      const res = await convertImageFormat(files[i], targetFormat, 1);
      out.push({
        name: files[i].name,
        blob: res.blob,
        originalSize: res.originalSize,
        convertedSize: res.convertedSize,
        format: targetFormat,
      });
    }

    setProgress(100);
    setResults(out);
    setLoading(false);
  }

  function handleDownload(item: ConvertedFile) {
    const base = item.name.replace(/\.[^.]+$/, "");
    const ext = item.format === "jpeg" ? "jpg" : item.format;
    downloadBlob(item.blob, `${base}.${ext}`);
  }

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={setFiles}
        accept={{ "image/*": [] }}
        multiple
        label="변환할 이미지를 업로드"
        subLabel="JPG, PNG, WebP, GIF 등 모든 이미지 형식 지원"
      />

      {/* 파일 목록 + 썸네일 */}
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

      {/* 출력 포맷 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">변환 포맷</label>
        <div className="flex gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTargetFormat(opt.value)}
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

      {loading && (
        <ProgressBar
          current={progress}
          label={`${currentIndex} / ${files.length} 변환 중...`}
        />
      )}

      <button
        onClick={handleConvert}
        disabled={files.length === 0 || loading}
        className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "변환 중..." : `${FORMAT_OPTIONS.find((f) => f.value === targetFormat)?.label}로 변환`}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">변환 결과</h3>
            {results.length > 1 && (
              <button
                onClick={() => results.forEach((r) => handleDownload(r))}
                className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                전체 다운로드
              </button>
            )}
          </div>
          {results.map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2.5">
                <FileThumb file={files[i]} size={36} />
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {item.name}
                </span>
                <button
                  onClick={() => handleDownload(item)}
                  className="cursor-pointer text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors flex-shrink-0"
                >
                  ⬇ 다운로드
                </button>
              </div>
              <SizeDisplay originalSize={item.originalSize} newSize={item.convertedSize} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
