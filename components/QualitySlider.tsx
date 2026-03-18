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
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="text-gray-600 dark:text-gray-400">
          {label}
        </label>
        <span className="font-semibold text-blue-600 dark:text-blue-400">
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
        className="w-full accent-blue-600"
        aria-label={label}
        aria-valuemin={10}
        aria-valuemax={100}
        aria-valuenow={value}
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>최대 압축</span>
        <span>원본 품질</span>
      </div>
    </div>
  );
}
