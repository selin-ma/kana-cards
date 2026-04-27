import { useState, useMemo } from "react";
import type { KanaCard } from "../types/kana";
import type { CardStats } from "../hooks/useHistory";
import KanaDetailModal from "./KanaDetailModal";
import { ROW_ORDER } from "../utils/kanaOrder";

interface Props {
  cardStats: CardStats;
  allCards: KanaCard[];
  onPractice: (cards: KanaCard[]) => void;
}

function CardTile({
  c,
  stat,
  rowCards,
  onClickCard,
}: {
  c: KanaCard;
  stat: { correct: number; wrong: number };
  rowCards: KanaCard[];
  onClickCard: (c: KanaCard, rowCards: KanaCard[]) => void;
}) {
  const intensity = Math.min(stat.wrong, 8);
  const alpha = 0.12 + intensity * 0.07;

  return (
    <button
      onClick={() => onClickCard(c, rowCards)}
      className="flex flex-col items-center px-3 py-2 rounded-xl gap-0.5 transition-opacity"
      style={{ background: `rgba(192, 136, 120, ${alpha})`, minWidth: "58px" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.72")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <span className="text-xs font-medium" style={{ color: "#4A3525" }}>
        {c.roma}
      </span>
      <div className="flex gap-1.5 items-baseline">
        <span className="text-base" style={{ color: "#5A8870" }}>
          {c.hira}
        </span>
        <span className="text-sm" style={{ color: "#7A7A9A" }}>
          {c.kata}
        </span>
      </div>
      <div className="flex gap-1.5">
        <span className="text-xs" style={{ color: "#C08878" }}>
          ✗{stat.wrong}
        </span>
        {stat.correct > 0 && (
          <span className="text-xs" style={{ color: "#7AAA7A" }}>
            ✓{stat.correct}
          </span>
        )}
      </div>
    </button>
  );
}

export default function ErrorDashboard({
  cardStats,
  allCards,
  onPractice,
}: Props) {
  const [detail, setDetail] = useState<KanaCard | null>(null);
  const [detailRowCards, setDetailRowCards] = useState<KanaCard[]>([]);
  const [activeRow, setActiveRow] = useState<string | null>(null);

  const missed = useMemo(
    () => allCards.filter((c) => (cardStats[c.id]?.wrong ?? 0) > 0),
    [allCards, cardStats],
  );

  const availableRows = useMemo(() => {
    const rowSet = [...new Set(missed.map((c) => c.row))];
    return rowSet.sort((a, b) => {
      const ra = ROW_ORDER.indexOf(a);
      const rb = ROW_ORDER.indexOf(b);
      return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb);
    });
  }, [missed]);

  const displayed = useMemo(
    () => (activeRow ? missed.filter((c) => c.row === activeRow) : missed),
    [missed, activeRow],
  );

  const struggling = displayed
    .filter((c) => {
      const s = cardStats[c.id];
      return s.correct < s.wrong;
    })
    .sort(
      (a, b) => (cardStats[b.id]?.wrong ?? 0) - (cardStats[a.id]?.wrong ?? 0),
    );

  const improving = displayed
    .filter((c) => {
      const s = cardStats[c.id];
      return s.correct >= s.wrong;
    })
    .sort(
      (a, b) => (cardStats[b.id]?.wrong ?? 0) - (cardStats[a.id]?.wrong ?? 0),
    );

  if (missed.length === 0)
    return (
      <p className="text-xs text-center" style={{ color: "#C0CAC0" }}>
        暂无错题记录
      </p>
    );

  return (
    <>
      <div className="w-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "#A8B4A8" }}>
            错题统计
            <span className="ml-1.5 font-normal" style={{ color: "#B8C4B8" }}>
              共 {missed.length} 个
            </span>
          </span>
          <button
            onClick={() =>
              onPractice(struggling.length > 0 ? struggling : missed)
            }
            className="text-xs px-3 py-1 rounded-full font-medium transition-colors"
            style={{ background: "#E4EAE4", color: "#607060" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#D8E4D8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#E4EAE4")}
          >
            练全部错题
          </button>
        </div>

        {/* Row filter */}
        {availableRows.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveRow(null)}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={
                activeRow === null
                  ? { background: "#7A9E82", color: "#F8FCF8" }
                  : { background: "#E4EAE4", color: "#607060" }
              }
            >
              全部
            </button>
            {availableRows.map((row) => (
              <button
                key={row}
                onClick={() => setActiveRow((r) => (r === row ? null : row))}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                style={
                  activeRow === row
                    ? { background: "#7A9E82", color: "#F8FCF8" }
                    : { background: "#E4EAE4", color: "#607060" }
                }
              >
                {row}
              </button>
            ))}
          </div>
        )}

        {/* Still struggling */}
        {struggling.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: "#C08878" }}>
              还需练习 ({struggling.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {struggling.map((c) => {
                const rowMissed = missed.filter((m) => m.row === c.row);
                return (
                  <CardTile
                    key={c.id}
                    c={c}
                    stat={cardStats[c.id]}
                    rowCards={rowMissed}
                    onClickCard={(card, rc) => {
                      setDetail(card);
                      setDetailRowCards(rc);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Improving */}
        {improving.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: "#9AAA7A" }}>
              趋于掌握 ({improving.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {improving.map((c) => {
                const rowMissed = missed.filter((m) => m.row === c.row);
                return (
                  <CardTile
                    key={c.id}
                    c={c}
                    stat={cardStats[c.id]}
                    rowCards={rowMissed}
                    onClickCard={(card, rc) => {
                      setDetail(card);
                      setDetailRowCards(rc);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {detail && (
        <KanaDetailModal
          card={detail}
          onClose={() => setDetail(null)}
          onPractice={() => {
            onPractice(detailRowCards);
            setDetail(null);
          }}
          practiceLabel={
            detailRowCards.length > 1
              ? `练习此行错题 (还有${detailRowCards.length} 个)`
              : "去练习"
          }
        />
      )}
    </>
  );
}
