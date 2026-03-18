import { formatBytes, calcReduction } from "@/lib/utils";

interface SizeDisplayProps {
  originalSize: number;
  newSize: number;
  label?: string;
}

export default function SizeDisplay({ originalSize, newSize, label }: SizeDisplayProps) {
  const reduction = calcReduction(originalSize, newSize);
  const isBigger = newSize > originalSize;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm flex-wrap">
      {label && <span className="text-gray-500 text-xs">{label}</span>}
      <span className="text-gray-600 dark:text-gray-300">
        <span className="font-mono">{formatBytes(originalSize)}</span>
      </span>
      <span className="text-gray-400">→</span>
      <span className="font-mono font-medium text-gray-800 dark:text-gray-100">
        {formatBytes(newSize)}
      </span>
      <span
        className={`ml-auto font-semibold px-2 py-0.5 rounded-full text-xs ${
          isBigger
            ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        }`}
      >
        {isBigger ? `+${Math.abs(reduction)}%` : `-${reduction}%`}
      </span>
    </div>
  );
}
