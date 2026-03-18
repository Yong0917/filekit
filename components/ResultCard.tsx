"use client";

import FileThumb from "@/components/FileThumb";
import SizeDisplay from "@/components/SizeDisplay";

interface ResultCardProps {
  file: File;
  name: string;
  originalSize: number;
  resultSize: number;
  onDownload: () => void;
}

export default function ResultCard({
  file,
  name,
  originalSize,
  resultSize,
  onDownload,
}: ResultCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2.5">
        <FileThumb file={file} size={36} />
        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {name}
        </span>
        <button
          onClick={onDownload}
          className="cursor-pointer text-sm px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors flex-shrink-0"
          aria-label={`${name} 다운로드`}
        >
          ⬇ 다운로드
        </button>
      </div>
      <SizeDisplay originalSize={originalSize} newSize={resultSize} />
    </div>
  );
}
