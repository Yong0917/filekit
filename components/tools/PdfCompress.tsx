"use client";

import DropZone from "@/components/DropZone";
import ProgressBar from "@/components/ProgressBar";
import ResultCard from "@/components/ResultCard";
import FileThumb from "@/components/FileThumb";
import { useFileProcessor } from "@/hooks/useFileProcessor";
import { compressPdf } from "@/lib/pdfCompress";
import { downloadBlob, classifyPdfError, getPdfErrorMessage } from "@/lib/utils";

interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  name: string;
  file: File;
}

export default function PdfCompress() {
  const {
    files,
    addFiles,
    clearFiles,
    loading,
    progress,
    currentIndex,
    results,
    error,
    processFiles,
  } = useFileProcessor<CompressResult>({ maxSizeMB: 200 });

  async function handleCompress() {
    await processFiles(
      async (file) => {
        let res;
        try {
          res = await compressPdf(file);
        } catch (e) {
          const type = classifyPdfError(e);
          throw new Error(`"${file.name}": ${getPdfErrorMessage(type)}`);
        }
        return { ...res, name: file.name, file };
      },
      { parallel: true }
    );
  }

  return (
    <div className="space-y-5">
      <DropZone
        onFiles={addFiles}
        accept={{ "application/pdf": [".pdf"] }}
        multiple
        label="PDF 파일을 업로드"
        subLabel="메타데이터 제거 및 구조 최적화로 용량 축소 · 최대 200MB"
      />

      {/* 파일 목록 */}
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
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg whitespace-pre-line">
          {error}
        </p>
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
            <ResultCard
              key={i}
              file={item.file}
              name={item.name}
              originalSize={item.originalSize}
              resultSize={item.compressedSize}
              onDownload={() => {
                const base = item.name.replace(/\.pdf$/i, "");
                downloadBlob(item.blob, `${base}_compressed.pdf`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
