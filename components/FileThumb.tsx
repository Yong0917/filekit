"use client";

import { useEffect, useState } from "react";

interface FileThumbProps {
  file: File;
  size?: number; // px
  onClick?: () => void;
}

export default function FileThumb({ file, size = 48, onClick }: FileThumbProps) {
  const [url, setUrl] = useState<string | null>(null);
  if (!file) return null;
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(null); // 이전 URL 참조 제거
    };
  }, [file]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isImage && url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={file.name}
        width={size}
        height={size}
        onClick={onClick}
        className={`rounded object-cover flex-shrink-0 ${onClick ? "cursor-zoom-in hover:opacity-80 transition-opacity" : ""}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // PDF 또는 기타 파일
  const isPdf = file.type === "application/pdf";
  return (
    <div
      className="rounded flex items-center justify-center flex-shrink-0 bg-red-50 dark:bg-red-900/20 text-red-500 text-lg font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {isPdf ? "PDF" : "📄"}
    </div>
  );
}
