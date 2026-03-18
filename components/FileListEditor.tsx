"use client";

import { useState } from "react";
import FileThumb from "@/components/FileThumb";
import { formatBytes } from "@/lib/utils";

interface FileListEditorProps {
  files: File[];
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  showSize?: boolean;
  headerLabel?: string;
}

export default function FileListEditor({
  files,
  onMove,
  onRemove,
  onClear,
  showSize = false,
  headerLabel,
}: FileListEditorProps) {
  const defaultLabel = `${files.length}개 파일`;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDragStart(i: number, e: React.DragEvent) {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(i: number, e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIndex !== i) setOverIndex(i);
  }

  function handleDrop(i: number, e: React.DragEvent) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== i) onMove(dragIndex, i);
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-medium" style={{ color: "var(--fg-2)" }}>
          {headerLabel ?? defaultLabel}
          <span className="ml-1.5 text-[11px] font-normal" style={{ color: "var(--muted)" }}>
            (순서 조정 가능)
          </span>
        </h3>
        <button
          onClick={onClear}
          className="cursor-pointer text-[12px] transition-colors duration-100 hover:underline"
          style={{ color: "var(--danger)" }}
          aria-label="파일 전체 제거"
        >
          전체 제거
        </button>
      </div>

      {/* 파일 목록 */}
      <div className="space-y-1 max-h-52 overflow-y-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
        {files.map((file, i) => (
          <div
            key={i}
            draggable
            onDragStart={(e) => handleDragStart(i, e)}
            onDragOver={(e) => handleDragOver(i, e)}
            onDragLeave={() => setOverIndex(null)}
            onDrop={(e) => handleDrop(i, e)}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-2 px-2.5 py-2 transition-colors duration-100"
            style={{
              background:
                dragIndex === i
                  ? "var(--surface-2)"
                  : overIndex === i
                  ? "var(--accent-bg)"
                  : "var(--surface)",
              opacity: dragIndex === i ? 0.45 : 1,
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
              outline: overIndex === i ? `1px solid var(--accent-border)` : "none",
            }}
          >
            {/* 드래그 핸들 */}
            <span
              className="cursor-grab active:cursor-grabbing flex-shrink-0 select-none"
              style={{ color: "var(--border-strong)" }}
              aria-hidden="true"
            >
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                <circle cx="4" cy="4"  r="1.5" fill="currentColor"/>
                <circle cx="4" cy="8"  r="1.5" fill="currentColor"/>
                <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="4"  r="1.5" fill="currentColor"/>
                <circle cx="8" cy="8"  r="1.5" fill="currentColor"/>
                <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
              </svg>
            </span>

            {/* 순서 번호 */}
            <span
              className="w-5 text-center font-mono text-[11px] flex-shrink-0"
              style={{ color: "var(--muted)" }}
            >
              {i + 1}
            </span>

            <FileThumb file={file} size={32} />

            {/* 파일명 */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] truncate" style={{ color: "var(--fg-2)" }}>
                {file.name}
              </p>
              {showSize && (
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  {formatBytes(file.size)}
                </p>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {i > 0 && (
                <button
                  onClick={() => onMove(i, i - 1)}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center rounded transition-colors duration-100"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  aria-label={`${file.name} 위로 이동`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              {i < files.length - 1 && (
                <button
                  onClick={() => onMove(i, i + 1)}
                  className="cursor-pointer w-6 h-6 flex items-center justify-center rounded transition-colors duration-100"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  aria-label={`${file.name} 아래로 이동`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              <button
                onClick={() => onRemove(i)}
                className="cursor-pointer w-6 h-6 flex items-center justify-center rounded transition-colors duration-100"
                style={{ color: "var(--muted)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--danger-bg)"; e.currentTarget.style.color = "var(--danger)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
                aria-label={`${file.name} 제거`}
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
