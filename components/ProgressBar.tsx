interface ProgressBarProps {
  current: number; // 0~100
  label?: string;
}

export default function ProgressBar({ current, label }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-[12px]" style={{ color: "var(--muted)" }}>
            {label}
          </span>
          <span
            className="text-[12px] font-medium tabular-nums"
            style={{ color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}
          >
            {current}%
          </span>
        </div>
      )}
      <div
        className="w-full h-[3px] rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${current}%`,
            background: `linear-gradient(90deg, var(--accent) 0%, #60A5FA 100%)`,
          }}
        />
      </div>
    </div>
  );
}
