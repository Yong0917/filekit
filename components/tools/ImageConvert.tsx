"use client";

import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import QualitySlider from "@/components/QualitySlider";
import FileThumb from "@/components/FileThumb";
import ImageModal from "@/components/ImageModal";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { convertImageFormat, type ImageFormat } from "@/lib/imageConvert";
import { downloadBlob } from "@/lib/utils";
import { useState } from "react";

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: "jpeg", label: "JPG" },
  { value: "png",  label: "PNG" },
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
      <ImageModal file={previewFile} onClose={() => setPreviewFile(null)} />

      <DropZone
        onFiles={addFiles}
        accept={{ "image/*": [] }}
        multiple
        label="변환할 이미지를 업로드"
        subLabel="JPG, PNG, WebP, GIF 등 모든 이미지 형식 지원 · 최대 100MB"
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

      {/* 출력 포맷 선택 */}
      <div className="space-y-2">
        <label className="text-[13px]" style={{ color: "var(--fg-2)" }}>
          변환 포맷
        </label>
        <div className="flex gap-2" role="group" aria-label="변환 포맷 선택">
          {FORMAT_OPTIONS.map((opt) => {
            const isActive = targetFormat === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTargetFormat(opt.value)}
                aria-pressed={isActive}
                aria-label={`${opt.label} 포맷으로 변환`}
                className="cursor-pointer flex-1 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 hover:brightness-95"
                style={{
                  background: isActive ? "var(--accent)" : "var(--surface-2)",
                  color: isActive ? "white" : "var(--fg-2)",
                  border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                  boxShadow: isActive ? "0 1px 3px rgba(37,99,235,0.2)" : "var(--shadow-xs)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* PNG는 무손실이라 품질 슬라이더 숨김 */}
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
        <p
          className="text-[13px] p-3 rounded-lg whitespace-pre-line"
          style={{ color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          {error}
        </p>
      )}

      <button
        onClick={handleConvert}
        disabled={files.length === 0 || loading}
        className="w-full py-[11px] px-4 rounded-xl text-[14px] font-medium text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-90 active:scale-[0.99] cursor-pointer"
        style={{
          background: "var(--accent)",
          boxShadow: "0 1px 3px rgba(37,99,235,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {loading ? "변환 중..." : `${targetLabel}로 변환`}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold" style={{ color: "var(--fg)" }}>
              변환 결과
            </h3>
            {results.length > 1 && (
              <button
                onClick={() => results.forEach((r) => handleDownload(r))}
                className="cursor-pointer text-[12px] font-medium hover:underline"
                style={{ color: "var(--accent)" }}
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
              onPreview={() => setPreviewFile(item.file)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
