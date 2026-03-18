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
      className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
        ${isDragActive
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {/* 업로드 아이콘 */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors
          ${isDragActive ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-800"}`}>
          {isDragActive ? "📂" : "📁"}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDragActive ? "여기에 놓으세요!" : label}
          </p>
          {subLabel && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
