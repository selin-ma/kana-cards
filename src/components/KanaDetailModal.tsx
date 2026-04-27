import type { KanaCard } from "../types/kana";

interface Props {
  card: KanaCard;
  onClose: () => void;
  onPractice?: () => void;
  practiceLabel?: string;
}

export default function KanaDetailModal({
  card,
  onClose,
  onPractice,
  practiceLabel,
}: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] px-4"
      style={{ background: "rgba(58,74,60,0.22)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-8 flex flex-col items-center gap-4 relative"
        style={{
          background: "#EEF4EF",
          border: "1px solid #D8E4D8",
          boxShadow: "0 8px 32px rgba(80,110,85,0.18)",
          width: "280px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top row: roma left, close right */}
        <div className="flex items-center justify-between w-full">
          <span
            className="text-sm tracking-widest"
            style={{ color: "#A8C0AA" }}
          >
            {card.roma}
          </span>
          <button
            onClick={onClose}
            className="text-xl leading-none transition-colors"
            style={{ color: "#C0CAC0" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#7A9E82")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#C0CAC0")}
          >
            ×
          </button>
        </div>

        <div className="flex gap-10 items-end">
          <span className="text-7xl font-light" style={{ color: "#5A8870" }}>
            {card.hira}
          </span>
          <span className="text-7xl font-light" style={{ color: "#7A7A9A" }}>
            {card.kata}
          </span>
        </div>
        <p className="text-base mt-2" style={{ color: "#607060" }}>
          {card.word_ja}
        </p>
        <p className="text-sm" style={{ color: "#9AAA9A" }}>
          {card.word_zh}
        </p>

        {onPractice && (
          <button
            onClick={onPractice}
            className="px-5 py-1.5 rounded-xl text-xs font-medium transition-colors mt-1"
            style={{ background: "#7A9E82", color: "#F8FCF8" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#628070")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#7A9E82")}
          >
            {practiceLabel ?? "去练习"}
          </button>
        )}
        <button
          onClick={onClose}
          className="text-xs transition-colors"
          style={{ color: "#C0CAC0" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#7A9E82")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#C0CAC0")}
        >
          关闭
        </button>
      </div>
    </div>
  );
}
