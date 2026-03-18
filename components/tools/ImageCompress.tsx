"use client";

import { useState } from "react";
import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import QualitySlider from "@/components/QualitySlider";
import FileThumb from "@/components/FileThumb";
import ImageModal from "@/components/ImageModal";
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
  const [previewFile, setPreviewFile] = useState<File | null>(null);
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
      <ImageModal file={previewFile} onClose={() => setPreviewFile(null)} />

      <DropZone
        onFiles={addFiles}
        accept={{ "image/jpeg": [], "image/png": [], "image/webp": [] }}
        multiple
        label="JPG / PNG / WebP 이미지를 업로드"
        subLabel="여러 파일 동시 처리 가능 · 최대 100MB"
      />

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
              {files.length}개 파일 선택됨
            </p>
            <button
              onClick={clearFiles}
              className="cursor-pointer text-[12px] hover:underline"
              style={{ color: "var(--danger)" }}
              aria-label="파일 전체 제거"
            >
              전체 제거
            </button>
          </div>
          <div
            className="space-y-px rounded-xl overflow-hidden max-h-48 overflow-y-auto"
            style={{ border: "1px solid var(--border)" }}
          >
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-2.5 py-2"
                style={{
                  background: "var(--surface)",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <FileThumb file={file} size={36} onClick={() => setPreviewFile(file)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] truncate" style={{ color: "var(--fg-2)" }}>
                    {file.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center rounded flex-shrink-0 transition-colors duration-100"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-bg)"; e.currentTarget.style.color = "var(--danger)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
                  aria-label={`${file.name} 제거`}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
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

      {loading && (
        <ProgressBar
          current={progress}
          label={`${currentIndex} / ${files.length} 처리 중...`}
        />
      )}

      {error && (
        <p
          className="text-[13px] p-3 rounded-lg whitespace-pre-line"
          style={{ color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          {error}
        </p>
      )}

      <button
        onClick={handleCompress}
        disabled={files.length === 0 || loading}
        className="w-full py-[11px] px-4 rounded-xl text-[14px] font-medium text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-90 active:scale-[0.99] cursor-pointer"
        style={{
          background: "var(--accent)",
          boxShadow: "0 1px 3px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {loading ? "압축 중..." : "이미지 압축"}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold" style={{ color: "var(--fg)" }}>
              압축 결과
            </h3>
            {results.length > 1 && (
              <button
                onClick={() => results.forEach((item) => handleDownload(item))}
                className="cursor-pointer text-[12px] font-medium hover:underline"
                style={{ color: "var(--accent)" }}
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
              onPreview={() => setPreviewFile(item.file)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
