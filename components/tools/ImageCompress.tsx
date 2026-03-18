"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import SizeDisplay from "@/components/SizeDisplay";
import ProgressBar from "@/components/ProgressBar";
import FileThumb from "@/components/FileThumb";
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
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 전체 진행률 0~100
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<CompressedFile[]>([]);

  async function handleCompress() {
    if (files.length === 0) return;
    setLoading(true);
    setResults([]);
    setProgress(0);

    const out: CompressedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      setCurrentIndex(i + 1);
      const res = await compressImage(files[i], 1, (p) => {
        // 전체 진행률 = 완료된 파일 비율 + 현재 파일 진행률
        const total = Math.round((i / files.length) * 100 + p / files.length);
        setProgress(total);
      });
      out.push({
        name: files[i].name,
        file: files[i],
        blob: res.blob,
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
      });
    }

    setProgress(100);
    setResults(out);
    setLoading(false);
  }

  function handleDownload(item: CompressedFile) {
    const ext = item.blob.type.includes("png") ? "png" : "jpg";
    const baseName = item.name.replace(/\.[^.]+$/, "");
    downloadBlob(item.blob, `${baseName}_compressed.${ext}`);
  }

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={(incoming) => setFiles((prev) => [...prev, ...incoming])}
        accept={{ "image/jpeg": [], "image/png": [], "image/webp": [] }}
        multiple
        label="JPG / PNG / WebP 이미지를 업로드"
        subLabel="여러 파일 동시 처리 가능"
      />

      {/* 파일 목록 + 썸네일 */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">{files.length}개 파일 선택됨</p>
            <button onClick={() => setFiles([])} className="cursor-pointer text-xs text-red-500 hover:underline">
              전체 제거
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <FileThumb file={file} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="cursor-pointer p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-400 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 진행률 */}
      {loading && (
        <ProgressBar
          current={progress}
          label={`${currentIndex} / ${files.length} 처리 중...`}
        />
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
            <h3 className="font-medium text-gray-800 dark:text-gray-200">압축 결과</h3>
            {results.length > 1 && (
              <button
                onClick={() => results.forEach((item) => handleDownload(item))}
                className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                전체 다운로드
              </button>
            )}
          </div>
          {results.map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2.5">
                <FileThumb file={item.file} size={36} />
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
              <SizeDisplay originalSize={item.originalSize} newSize={item.compressedSize} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
