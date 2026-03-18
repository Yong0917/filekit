"use client";

import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept: Accept;
  multiple?: boolean;
  label?: string;
  subLabel?: string;
}

export default function DropZone({
  onFiles,
  accept,
  multiple = false,
  label = "파일을 드래그하거나 클릭해서 업로드",
  subLabel,
}: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 outline-none"
      style={{
        border: `1.5px dashed ${isDragActive ? "var(--accent)" : "var(--border-strong)"}`,
        background: isDragActive ? "var(--accent-bg)" : "var(--surface-2)",
      }}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">

        {/* 업로드 아이콘 */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200"
          style={{
            background: isDragActive ? "var(--accent-bg)" : "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          {isDragActive ? (
            /* 내려놓기 아이콘 */
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 3v10M6 9l4 4 4-4" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 16h14" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            /* 업로드 아이콘 */
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 13V4M6 7l4-4 4 4" stroke="var(--fg-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 14v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" stroke="var(--fg-2)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        {/* 텍스트 */}
        <div className="space-y-1">
          <p
            className="text-[13px] font-medium"
            style={{ color: isDragActive ? "var(--accent)" : "var(--fg-2)" }}
          >
            {isDragActive ? "여기에 놓으세요!" : label}
          </p>
          {subLabel && (
            <p className="text-[12px]" style={{ color: "var(--muted)" }}>
              {subLabel}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
