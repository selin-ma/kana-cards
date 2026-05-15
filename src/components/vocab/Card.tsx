import { useState, useEffect } from "react";
import type { Word, Rating } from "../../types/vocab";
import { RATING } from "../../types/vocab";
import type { VocabAnswer } from "../../utils/vocabSessionDraft";
import AudioButton from "./AudioButton";
import { playWord } from "../../utils/speak";

interface Props {
  word: Word;
  answered: VocabAnswer | undefined;
  onRate: (rating: Rating) => void;
  onSkip: () => void;
}

export default function VocabCard({ word, answered, onRate, onSkip }: Props) {
  const [flipped, setFlipped] = useState(answered !== undefined);

  // Reset flip when word changes (next card)
  useEffect(() => {
    setFlipped(answered !== undefined);
  }, [word.id, answered]);

  const statusLabel =
    answered === RATING.Again
      ? "没记住"
      : answered === RATING.Hard
        ? "有点难"
        : answered === RATING.Good
          ? "记住了"
          : answered === RATING.Easy
            ? "很简单"
            : answered === "skipped"
              ? "已跳过"
              : "";

  const statusColor =
    answered === RATING.Again
      ? "#C08878"
      : answered === RATING.Hard
        ? "#C0A878"
        : answered === RATING.Good
          ? "#7AAA7A"
          : answered === RATING.Easy
            ? "#7A9EAA"
            : answered === "skipped"
              ? "#B8C4B8"
              : "#B8C4B8";

  // Japanese text to speak: prefer kana for pronunciation accuracy
  const speakText = word.kana.replace(/[～〜]/g, "");

  // Toggle flip. Audio only fires when flipping front→back (user wants
  // to peek the back), not back→front. Synchronous play in the click
  // handler satisfies Chrome's autoplay policy.
  const handleFlip = () => {
    const willFlipToBack = !flipped;
    setFlipped(willFlipToBack);
    if (willFlipToBack) {
      playWord(speakText, word.audio_url);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="card-flip cursor-pointer select-none w-[300px] h-[260px]"
        onClick={handleFlip}
      >
        <div className={`card-inner ${flipped ? "flipped" : ""}`}>
          {/* Front: kana */}
          <div
            className="card-front flex flex-col items-center justify-center gap-3 rounded-2xl px-5"
            style={{
              background: "#FEFCF8",
              border: "1px solid #E4E8E0",
              boxShadow: "0 2px 16px 0 rgba(80,110,85,0.07)",
            }}
          >
            <span
              className="text-4xl font-light tracking-wider text-center break-all leading-snug"
              style={{ color: "#3A4A3C" }}
            >
              {word.kana}
            </span>
            <div className="flex items-center gap-3">
              {word.pitch_accent !== null && (
                <span className="text-xs" style={{ color: "#A8B4A8" }}>
                  声调 {word.pitch_accent}
                </span>
              )}
              <AudioButton
                text={speakText}
                audioUrl={word.audio_url}
                size="sm"
              />
            </div>
            {answered !== undefined && (
              <span className="text-xs mt-0.5" style={{ color: statusColor }}>
                已答 · {statusLabel}
              </span>
            )}
          </div>

          {/* Back: kanji + meaning + pos + notes + audio */}
          <div
            className="card-back flex flex-col items-center justify-center gap-2 rounded-2xl px-5 py-4"
            style={{
              background: "#EEF4EF",
              border: "1px solid #D8E4D8",
              boxShadow: "0 2px 16px 0 rgba(80,110,85,0.07)",
            }}
          >
            <div className="flex items-center gap-2 self-end">
              {word.pos &&
                word.pos.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] px-1.5 py-0.5 rounded-md"
                    style={{
                      background: "#FEFCF8",
                      color: "#7A9E82",
                      border: "1px solid #D8E4D8",
                    }}
                  >
                    〈{p}〉
                  </span>
                ))}
            </div>

            <div className="flex items-center gap-3">
              {word.kanji && (
                <span
                  className="text-2xl font-light"
                  style={{ color: "#5A8870" }}
                >
                  {word.kanji}
                </span>
              )}
              <AudioButton
                text={speakText}
                audioUrl={word.audio_url}
                size="sm"
              />
            </div>

            <p
              className="text-sm text-center leading-relaxed break-all"
              style={{ color: "#3A4A3C" }}
            >
              {word.meaning_zh}
            </p>

            {word.notes && (
              <p
                className="text-[10px] text-center"
                style={{ color: "#9AAA9A" }}
              >
                {word.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {!flipped && (
        <p className="text-xs" style={{ color: "#C0CAC0" }}>
          点击翻卡查看答案
        </p>
      )}

      {flipped && answered === undefined && (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onSkip}
            className="text-xs transition-colors"
            style={{ color: "#B8C4B8" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#7A9E82")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#B8C4B8")}
          >
            跳过本张
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onRate(RATING.Again)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ background: "#F5EDEC", color: "#AA6868" }}
            >
              没记住
            </button>
            <button
              onClick={() => onRate(RATING.Hard)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ background: "#F5F0E4", color: "#A89060" }}
            >
              有点难
            </button>
            <button
              onClick={() => onRate(RATING.Good)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ background: "#E8F2EA", color: "#4A7A50" }}
            >
              记住了
            </button>
            <button
              onClick={() => onRate(RATING.Easy)}
              className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ background: "#E4EEF2", color: "#5A7A9A" }}
            >
              很简单
            </button>
          </div>
        </div>
      )}

      {flipped && answered !== undefined && <div className="h-10" />}
    </div>
  );
}
