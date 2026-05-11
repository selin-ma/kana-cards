#!/usr/bin/env python3
"""Convert a chapter vocab JSON into Supabase import SQL.

Usage:
    python3 scripts/json_to_sql.py path/to/lesson.json [book_total_chapters] > import.sql

Run the produced SQL in Supabase Dashboard → SQL Editor.
Idempotent: re-running upserts by (book.code, chapter.order_idx, word.order_idx).
"""
import json
import sys
from pathlib import Path

TAG = "$kj$"  # dollar-quote tag — must not appear in any field text


def q(s):
    if s is None or s == "":
        return "null"
    if TAG in str(s):
        raise ValueError(f"field contains reserved tag {TAG}: {s!r}")
    return f"{TAG}{s}{TAG}"


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: json_to_sql.py lesson.json [book_total_chapters]")
    json_path = Path(sys.argv[1])
    total_ch = int(sys.argv[2]) if len(sys.argv) > 2 else 25

    data = json.loads(json_path.read_text(encoding="utf-8"))
    book = data["book"]
    chapter = data["chapter"]
    words = data["words"]

    out = []
    out.append(f"-- generated from {json_path.name}")
    out.append(f"-- book: {book['title']}  chapter: {chapter['title']}  words: {len(words)}")
    out.append("")

    out.append(
        f"insert into public.books (code, title, publisher, total_chapters)\n"
        f"values ({q(book['code'])}, {q(book['title'])}, {q(book.get('publisher'))}, {total_ch})\n"
        f"on conflict (code) do update set\n"
        f"  title = excluded.title,\n"
        f"  publisher = excluded.publisher,\n"
        f"  total_chapters = excluded.total_chapters;\n"
    )

    out.append(
        f"insert into public.chapters (book_id, order_idx, title, word_count)\n"
        f"select id, {chapter['order_idx']}, {q(chapter['title'])}, {len(words)}\n"
        f"from public.books where code = {q(book['code'])}\n"
        f"on conflict (book_id, order_idx) do update set\n"
        f"  title = excluded.title,\n"
        f"  word_count = excluded.word_count;\n"
    )

    rows = []
    for w in words:
        pa = "null" if w.get("pitch_accent") is None else str(w["pitch_accent"])
        if w.get("pos"):
            pos_arr = "array[" + ",".join(q(p) for p in w["pos"]) + "]::text[]"
        else:
            pos_arr = "null::text[]"
        rows.append(
            "  ("
            f"{w['order_idx']}, "
            f"{q(w['kana'])}, "
            f"{q(w.get('kanji'))}, "
            f"{pa}, "
            f"{pos_arr}, "
            f"{q(w['meaning_zh'])}, "
            f"{q(w.get('notes'))}"
            ")"
        )

    vals_sql = ",\n".join(rows)
    out.append(
        f"with target_chapter as (\n"
        f"  select c.id from public.chapters c\n"
        f"  join public.books b on b.id = c.book_id\n"
        f"  where b.code = {q(book['code'])} and c.order_idx = {chapter['order_idx']}\n"
        f")\n"
        f"insert into public.words (chapter_id, order_idx, kana, kanji, pitch_accent, pos, meaning_zh, notes)\n"
        f"select tc.id, w.order_idx, w.kana, w.kanji, w.pitch_accent, w.pos, w.meaning_zh, w.notes\n"
        f"from target_chapter tc\n"
        f"cross join (values\n"
        f"{vals_sql}\n"
        f") as w(order_idx, kana, kanji, pitch_accent, pos, meaning_zh, notes)\n"
        f"on conflict (chapter_id, order_idx) do update set\n"
        f"  kana = excluded.kana,\n"
        f"  kanji = excluded.kanji,\n"
        f"  pitch_accent = excluded.pitch_accent,\n"
        f"  pos = excluded.pos,\n"
        f"  meaning_zh = excluded.meaning_zh,\n"
        f"  notes = excluded.notes;\n"
    )

    print("\n".join(out))


if __name__ == "__main__":
    main()
