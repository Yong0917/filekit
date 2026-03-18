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
  const defaultLabel = `${files.length}개 파일 (순서 조정 가능)`;
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
    if (dragIndex !== null && dragIndex !== i) {
      onMove(dragIndex, i);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {headerLabel ?? defaultLabel}
        </h3>
        <button
          onClick={onClear}
          className="cursor-pointer text-xs text-red-500 hover:underline"
          aria-label="파일 전체 제거"
        >
          전체 제거
        </button>
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto">
        {files.map((file, i) => (
          <div
            key={i}
            draggable
            onDragStart={(e) => handleDragStart(i, e)}
            onDragOver={(e) => handleDragOver(i, e)}
            onDragLeave={() => setOverIndex(null)}
            onDrop={(e) => handleDrop(i, e)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
              dragIndex === i
                ? "opacity-40 bg-gray-100 dark:bg-gray-700"
                : overIndex === i
                  ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600"
                  : "bg-gray-50 dark:bg-gray-800"
            }`}
          >
            {/* 드래그 핸들 */}
            <span
              className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 flex-shrink-0 select-none"
              aria-hidden="true"
            >
              ⠿
            </span>
            <span className="w-5 text-center text-gray-400 font-mono text-xs flex-shrink-0">
              {i + 1}
            </span>
            <FileThumb file={file} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {file.name}
              </p>
              {showSize && (
                <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {i > 0 && (
                <button
                  onClick={() => onMove(i, i - 1)}
                  className="cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                  aria-label={`${file.name} 위로 이동`}
                >
                  ↑
                </button>
              )}
              {i < files.length - 1 && (
                <button
                  onClick={() => onMove(i, i + 1)}
                  className="cursor-pointer p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                  aria-label={`${file.name} 아래로 이동`}
                >
                  ↓
                </button>
              )}
              <button
                onClick={() => onRemove(i)}
                className="cursor-pointer p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-400"
                aria-label={`${file.name} 제거`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
