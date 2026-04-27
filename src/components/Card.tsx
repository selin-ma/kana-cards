import { useState } from "react";
import type { KanaCard } from "../types/kana";
import type { CardAnswer } from "../hooks/useSession";

interface Props {
  card: KanaCard;
  answered: CardAnswer | undefined;
  onAnswer: (remembered: boolean) => void;
  onSkip: () => void;
}

export default function Card({ card, answered, onAnswer, onSkip }: Props) {
  const [flipped, setFlipped] = useState(answered !== undefined);

  const statusLabel =
    answered === true
      ? "已答 · 记住了"
      : answered === false
        ? "已答 · 没记住"
        : answered === "skipped"
          ? "已跳过"
          : "";

  const statusColor =
    answered === true ? "#7AAA7A" : answered === false ? "#C08878" : "#B8C4B8";

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="card-flip cursor-pointer select-none w-[300px] h-[260px]"
        onClick={() => !flipped && setFlipped(true)}
      >
        <div className={`card-inner ${flipped ? "flipped" : ""}`}>
          {/* Front */}
          <div
            className="card-front flex flex-col items-center justify-center gap-2 rounded-2xl"
            style={{
              background: "#FEFCF8",
              border: "1px solid #E4E8E0",
              boxShadow: "0 2px 16px 0 rgba(80,110,85,0.07)",
            }}
          >
            <span
              className="text-6xl font-light tracking-widest"
              style={{ color: "#3A4A3C" }}
            >
              {card.roma}
            </span>
            {answered !== undefined && (
              <span className="text-xs mt-0.5" style={{ color: statusColor }}>
                {statusLabel}
              </span>
            )}
          </div>

          {/* Back */}
          <div
            className="card-back flex flex-col items-center justify-center gap-3 rounded-2xl p-5"
            style={{
              background: "#EEF4EF",
              border: "1px solid #D8E4D8",
              boxShadow: "0 2px 16px 0 rgba(80,110,85,0.07)",
            }}
          >
            <span
              className="text-xs tracking-widest self-end pr-1"
              style={{ color: "#A8C0AA" }}
            >
              {card.roma}
            </span>
            <div className="flex gap-8">
              <span
                className="text-6xl font-light"
                style={{ color: "#5A8870" }}
              >
                {card.hira}
              </span>
              <span
                className="text-6xl font-light"
                style={{ color: "#7A7A9A" }}
              >
                {card.kata}
              </span>
            </div>
            <p className="text-sm" style={{ color: "#607060" }}>
              {card.word_ja}
            </p>
            <p className="text-xs" style={{ color: "#9AAA9A" }}>
              {card.word_zh}
            </p>
          </div>
        </div>
      </div>

      {!flipped && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs" style={{ color: "#C0CAC0" }}>
            点击翻卡查看答案
          </p>
        </div>
      )}

      {flipped && answered === undefined && (
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: "#F5F2EC",
              color: "#B8C4B8",
              border: "1px solid #DDE8DD",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#7A9E82")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#B8C4B8")}
          >
            跳过
          </button>
          <button
            onClick={() => onAnswer(false)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "#F5EDEC", color: "#AA6868" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#EADAD8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F5EDEC")}
          >
            没记住 ✗
          </button>
          <button
            onClick={() => onAnswer(true)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "#E8F2EA", color: "#4A7A50" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#D8EAD8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#E8F2EA")}
          >
            记住了 ✓
          </button>
        </div>
      )}

      {flipped && answered !== undefined && <div className="h-10" />}
    </div>
  );
}
