import type { Chapter } from "../../types/vocab";

interface Props {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  bookTitle: string;
  onBack: () => void;
  onPick: (chapter: Chapter) => void;
}

export default function ChapterList({
  chapters,
  loading,
  error,
  bookTitle,
  onBack,
  onPick,
}: Props) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs transition-colors"
          style={{ color: "#7A9E82" }}
        >
          ← 书架
        </button>
        <span
          className="text-sm font-medium"
          style={{ color: "#3A4A3C" }}
        >
          {bookTitle}
        </span>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: "#B8C4B8" }}>
          加载中…
        </p>
      )}
      {error && (
        <p className="text-sm" style={{ color: "#C08878" }}>
          {error}
        </p>
      )}
      {!loading && !error && chapters.length === 0 && (
        <p className="text-sm" style={{ color: "#B8C4B8" }}>
          这本书还没有章节
        </p>
      )}

      <div className="flex flex-col gap-2">
        {chapters.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c)}
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-colors"
            style={{
              background: "#FEFCF8",
              border: "1px solid #E4E8E0",
            }}
          >
            <span className="text-sm" style={{ color: "#3A4A3C" }}>
              {c.title}
            </span>
            <span className="text-xs" style={{ color: "#A8B4A8" }}>
              {c.word_count} 词
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
