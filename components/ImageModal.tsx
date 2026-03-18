"use client";

import { useEffect, useState } from "react";

interface ImageModalProps {
  file: File | null;
  onClose: () => void;
}

export default function ImageModal({ file, onClose }: ImageModalProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(null);
    };
  }, [file]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [file, onClose]);

  if (!file || !url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="이미지 미리보기"
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white text-2xl leading-none"
          aria-label="미리보기 닫기"
        >
          ✕
        </button>

        {/* 이미지 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={file.name}
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />

        {/* 파일명 */}
        <p className="mt-3 text-white/70 text-sm text-center max-w-[80vw] truncate">
          {file.name}
        </p>
      </div>
    </div>
  );
}
