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
      setUrl(null);
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
        className={`rounded-lg object-cover flex-shrink-0 ${onClick ? "cursor-zoom-in hover:opacity-75 transition-opacity duration-150" : ""}`}
        style={{
          width: size,
          height: size,
          border: "1px solid var(--border)",
        }}
      />
    );
  }

  // PDF 또는 기타 파일
  const isPdf = file.type === "application/pdf";
  return (
    <div
      className="rounded-lg flex items-center justify-center flex-shrink-0 font-bold select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.32,
        background: isPdf ? "var(--danger-bg)" : "var(--surface-2)",
        color: isPdf ? "var(--danger)" : "var(--muted)",
        border: "1px solid var(--border)",
      }}
    >
      {isPdf ? "PDF" : "📄"}
    </div>
  );
}
