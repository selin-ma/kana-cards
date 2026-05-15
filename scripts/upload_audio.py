#!/usr/bin/env python3
"""Upload generated chapter mp3s to Cloudflare R2.

Reads R2 credentials from .env.local at project root. Uploads files
from a local audio directory to a deterministic R2 key layout:

    <book_code>/lesson-<NN>/<order_idx:03>.mp3

After upload, prints SQL UPDATE statements that map each word's
audio_url column to its public R2 URL. Run that SQL in Supabase
SQL Editor (or pipe to a .sql file).

Usage:
    python3 scripts/upload_audio.py path/to/lesson.json

The audio directory is inferred from the JSON path:
    <json-dir>/audio/lesson-<NN>/

Idempotent: re-uploading the same key just overwrites.
"""
import argparse
import json
import os
import sys
from pathlib import Path

import boto3
from botocore.config import Config
from dotenv import load_dotenv


def main():
    p = argparse.ArgumentParser()
    p.add_argument("json_path", help="Chapter vocab JSON file")
    p.add_argument(
        "--sql-out",
        help="Write audio_url UPDATE statements to this file (default: same dir as JSON, audio-urls-XX.sql)",
    )
    args = p.parse_args()

    # Load env
    project_root = Path(__file__).resolve().parent.parent
    load_dotenv(project_root / ".env.local")

    endpoint = os.environ["R2_ENDPOINT"]
    access_key = os.environ["R2_ACCESS_KEY_ID"]
    secret_key = os.environ["R2_SECRET_ACCESS_KEY"]
    bucket = os.environ["R2_BUCKET"]
    public_base = os.environ["R2_PUBLIC_BASE"].rstrip("/")

    # Load chapter JSON
    json_path = Path(args.json_path)
    data = json.loads(json_path.read_text(encoding="utf-8"))
    book_code = data["book"]["code"]
    chapter_order = data["chapter"]["order_idx"]
    words = data["words"]

    # JSON expected at <lesson-N>/data/<file>.json → audio at <lesson-N>/audio/
    audio_dir = json_path.parent.parent / "audio"
    if not audio_dir.is_dir():
        sys.exit(f"audio dir not found: {audio_dir}")

    # S3 client for R2
    s3 = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )

    sql_lines = [
        f"-- audio_url backfill for {book_code} chapter {chapter_order}",
        "begin;",
    ]

    uploaded = 0
    skipped = 0
    failed = []
    for w in words:
        order_idx = w["order_idx"]
        local_path = audio_dir / f"{order_idx:03d}.mp3"
        if not local_path.exists():
            print(f"  #{order_idx}  MISSING local file, skip")
            skipped += 1
            continue

        r2_key = f"{book_code}/lesson-{chapter_order:02d}/{order_idx:03d}.mp3"
        public_url = f"{public_base}/{r2_key}"

        try:
            with open(local_path, "rb") as f:
                s3.put_object(
                    Bucket=bucket,
                    Key=r2_key,
                    Body=f,
                    ContentType="audio/mpeg",
                    CacheControl="public, max-age=31536000, immutable",
                )
            uploaded += 1
            print(f"  #{order_idx}  -> {r2_key}")
        except Exception as e:
            failed.append((order_idx, str(e)))
            print(f"  #{order_idx}  FAIL: {e}")
            continue

        # SQL UPDATE for this word (no whitespace inside dollar-quotes!)
        sql_lines.append(
            f"update public.words set audio_url = $${public_url}$$ "
            f"where chapter_id = (select c.id from public.chapters c "
            f"join public.books b on b.id = c.book_id "
            f"where b.code = $${book_code}$$ and c.order_idx = {chapter_order}) "
            f"and order_idx = {order_idx};"
        )

    sql_lines.append("commit;")
    sql_text = "\n".join(sql_lines) + "\n"

    # Write SQL file
    sql_path = (
        Path(args.sql_out)
        if args.sql_out
        else json_path.parent / f"audio-urls-{chapter_order:02d}.sql"
    )
    sql_path.write_text(sql_text, encoding="utf-8")

    print()
    print(f"uploaded={uploaded}  skipped={skipped}  failed={len(failed)}")
    print(f"backfill SQL written to: {sql_path}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
