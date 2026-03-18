"use client";

interface QualitySliderProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

export default function QualitySlider({
  id,
  value,
  onChange,
  disabled = false,
  label = "압축 품질",
}: QualitySliderProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[13px]"
          style={{ color: "var(--fg-2)" }}
        >
          {label}
        </label>
        <span
          className="text-[13px] font-semibold tabular-nums px-2 py-0.5 rounded-md"
          style={{
            color: "var(--accent)",
            background: "var(--accent-bg)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}%
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={10}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full"
        aria-label={label}
        aria-valuemin={10}
        aria-valuemax={100}
        aria-valuenow={value}
      />

      <div className="flex justify-between text-[11px]" style={{ color: "var(--muted)" }}>
        <span>최대 압축</span>
        <span>원본 품질</span>
      </div>
    </div>
  );
}
