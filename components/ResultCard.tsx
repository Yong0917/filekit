"use client";

import FileThumb from "@/components/FileThumb";
import SizeDisplay from "@/components/SizeDisplay";

interface ResultCardProps {
  file: File;
  name: string;
  originalSize: number;
  resultSize: number;
  onDownload: () => void;
  onPreview?: () => void;
}

export default function ResultCard({
  file,
  name,
  originalSize,
  resultSize,
  onDownload,
  onPreview,
}: ResultCardProps) {
  return (
    <div
      className="rounded-xl p-3 space-y-2.5"
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <FileThumb file={file} size={36} onClick={onPreview} />
        <span
          className="flex-1 text-[13px] font-medium truncate"
          style={{ color: "var(--fg-2)" }}
        >
          {name}
        </span>
        <button
          onClick={onDownload}
          className="cursor-pointer text-[12px] font-medium px-3 py-1.5 rounded-lg text-white flex-shrink-0 transition-all duration-150 hover:brightness-90 active:scale-95"
          style={{
            background: "var(--success)",
            boxShadow: "0 1px 2px rgba(22,163,74,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          aria-label={`${name} 다운로드`}
        >
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 2v6M3 6l3 3 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 10h8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            다운로드
          </span>
        </button>
      </div>
      <SizeDisplay originalSize={originalSize} newSize={resultSize} />
    </div>
  );
}
