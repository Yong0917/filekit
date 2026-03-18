"use client";

import { useState } from "react";
import { validateFileSize } from "@/lib/utils";

interface UseFileProcessorOptions {
  maxSizeMB: number;
}

interface ProcessOptions {
  parallel?: boolean;
  concurrency?: number;
}

export function useFileProcessor<TResult>(options: UseFileProcessorOptions) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<TResult[]>([]);
  const [error, setError] = useState("");

  // 파일 추가 시 크기 검증 수행
  function addFiles(incoming: File[]) {
    const valid: File[] = [];
    const warnings: string[] = [];

    for (const f of incoming) {
      const check = validateFileSize(f, options.maxSizeMB);
      if (check.valid) valid.push(f);
      else warnings.push(check.message);
    }

    if (warnings.length > 0) {
      setError(warnings.join("\n"));
    } else {
      setError("");
    }

    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function moveFile(from: number, to: number) {
    setFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }

  function clearFiles() {
    setFiles([]);
    setResults([]);
    setError("");
    setProgress(0);
    setCurrentIndex(0);
  }

  // 파일 배치 처리 (순차 또는 병렬)
  async function processFiles(
    processFn: (
      file: File,
      index: number,
      onProgress: (p: number) => void
    ) => Promise<TResult>,
    { parallel = false, concurrency = 3 }: ProcessOptions = {}
  ): Promise<void> {
    if (files.length === 0) return;
    setLoading(true);
    setResults([]);
    setError("");
    setProgress(0);
    setCurrentIndex(0);

    try {
      if (parallel && files.length > 1) {
        // 병렬 처리: concurrency 제한으로 동시 처리
        const progresses = Array.from({ length: files.length }, () => 0);
        const out: TResult[] = new Array(files.length);
        let taskIndex = 0;

        const updateProgress = () => {
          const avg = progresses.reduce((a, b) => a + b, 0) / files.length;
          setProgress(Math.round(avg));
        };

        const worker = async (): Promise<void> => {
          while (true) {
            const i = taskIndex++;
            if (i >= files.length) break;
            setCurrentIndex((prev) => Math.max(prev, i + 1));
            out[i] = await processFn(files[i], i, (p) => {
              progresses[i] = p;
              updateProgress();
            });
            progresses[i] = 100;
            updateProgress();
          }
        };

        await Promise.all(
          Array.from(
            { length: Math.min(concurrency, files.length) },
            () => worker()
          )
        );

        setResults(out);
        setProgress(100);
      } else {
        // 순차 처리
        const out: TResult[] = [];
        for (let i = 0; i < files.length; i++) {
          setCurrentIndex(i + 1);
          const res = await processFn(files[i], i, (p) => {
            const total = Math.round((i / files.length) * 100 + p / files.length);
            setProgress(total);
          });
          out.push(res);
        }
        setProgress(100);
        setResults(out);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return {
    files,
    addFiles,
    removeFile,
    moveFile,
    clearFiles,
    loading,
    progress,
    currentIndex,
    results,
    error,
    setError,
    processFiles,
  };
}
