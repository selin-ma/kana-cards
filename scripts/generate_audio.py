#!/usr/bin/env python3
"""Batch-generate mp3 audio for vocab words using Microsoft Edge TTS.

Reads a chapter JSON (produced by the extraction pipeline), writes one
mp3 per word, named by order_idx so the R2 key is stable independent of
the database UUID.

Output layout (assumes JSON lives in `<lesson-N>/data/<lesson-N>.json`):
    <lesson-N>/audio/<order_idx:03>.mp3
e.g. kana-jump-resources/library/minna-1/lesson-03/audio/001.mp3

Usage:
    python3 scripts/generate_audio.py path/to/lesson.json [--voice NAME] [--rate -10%]

Notes:
- Skips files that already exist (resumable).
- Strips ~ placeholder marks from kana before synthesis; brackets
  ([どうぞ] etc) are kept so the optional part is voiced.
"""
import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts

DEFAULT_VOICE = "ja-JP-NanamiNeural"
DEFAULT_RATE = "-10%"


def clean_text(s: str) -> str:
    """Remove tilde placeholders so edge-tts speaks the actual word."""
    return re.sub(r"[～〜]", "", s).strip()


async def synth_one(text: str, out_path: Path, voice: str, rate: str) -> None:
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(out_path))


async def run(args) -> int:
    json_path = Path(args.json_path)
    data = json.loads(json_path.read_text(encoding="utf-8"))

    chapter_order = data["chapter"]["order_idx"]
    # JSON expected at <lesson-N>/data/<file>.json → audio at <lesson-N>/audio/
    out_dir = json_path.parent.parent / "audio"
    out_dir.mkdir(parents=True, exist_ok=True)

    words = data["words"]
    total = len(words)
    print(f"-> {total} words, voice={args.voice}, rate={args.rate}")
    print(f"   output: {out_dir}")

    skipped = 0
    failed = []
    for i, w in enumerate(words, 1):
        order_idx = w["order_idx"]
        text = clean_text(w["kana"])
        if not text:
            print(f"  [{i}/{total}] #{order_idx}  empty kana, skip")
            continue

        fname = f"{order_idx:03d}.mp3"
        out_path = out_dir / fname
        if out_path.exists() and out_path.stat().st_size > 0:
            print(f"  [{i}/{total}] #{order_idx}  {fname}  (exists)")
            skipped += 1
            continue

        print(f"  [{i}/{total}] #{order_idx}  {fname}  <- {text}")
        try:
            await synth_one(text, out_path, args.voice, args.rate)
        except Exception as e:
            print(f"      FAIL: {e}")
            failed.append((order_idx, text, str(e)))

    print()
    print(f"done. generated={total - skipped - len(failed)}  skipped={skipped}  failed={len(failed)}")
    if failed:
        for o, t, e in failed:
            print(f"  ! #{o} {t}: {e}")
        return 1
    return 0


def main():
    p = argparse.ArgumentParser()
    p.add_argument("json_path", help="Chapter vocab JSON file")
    p.add_argument("--voice", default=DEFAULT_VOICE)
    p.add_argument("--rate", default=DEFAULT_RATE)
    args = p.parse_args()
    sys.exit(asyncio.run(run(args)))


if __name__ == "__main__":
    main()
