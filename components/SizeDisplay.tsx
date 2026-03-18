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
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] flex-wrap"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      {label && (
        <span className="text-[11px]" style={{ color: "var(--muted)" }}>
          {label}
        </span>
      )}

      {/* 원본 크기 */}
      <span className="font-mono" style={{ color: "var(--fg-2)" }}>
        {formatBytes(originalSize)}
      </span>

      {/* 화살표 */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="flex-shrink-0">
        <path d="M3 7h8M8 4l3 3-3 3" stroke="var(--muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {/* 변환된 크기 */}
      <span className="font-mono font-medium" style={{ color: "var(--fg)" }}>
        {formatBytes(newSize)}
      </span>

      {/* 감소율 뱃지 */}
      <span
        className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{
          color: isBigger ? "#D97706" : "var(--success)",
          background: isBigger ? "rgba(217,119,6,0.08)" : "var(--success-bg)",
          border: `1px solid ${isBigger ? "rgba(217,119,6,0.2)" : "var(--success-border)"}`,
        }}
      >
        {isBigger ? `+${Math.abs(reduction)}%` : `−${reduction}%`}
      </span>
    </div>
  );
}
