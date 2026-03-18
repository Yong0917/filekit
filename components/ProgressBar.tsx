interface ProgressBarProps {
  current: number; // 0~100
  label?: string;
}

export default function ProgressBar({ current, label }: ProgressBarProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{label}</span>
          <span className="font-mono">{current}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-200"
          style={{ width: `${current}%` }}
        />
      </div>
    </div>
  );
}
