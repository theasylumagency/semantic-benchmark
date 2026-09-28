"""Read-only integrity check for the frozen Claim Semantics v1 archive."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_ROOT = REPOSITORY_ROOT / "archive" / "claim-semantics" / "v1"
MANIFEST_PATH = ARCHIVE_ROOT / "archive-manifest.json"
MANIFEST_PIN_PATH = ARCHIVE_ROOT / "archive-manifest.sha256"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    try:
        manifest_bytes = MANIFEST_PATH.read_bytes()
        expected_manifest_hash = MANIFEST_PIN_PATH.read_text(encoding="ascii").strip()
        actual_manifest_hash = sha256(manifest_bytes)
        if expected_manifest_hash != actual_manifest_hash:
            raise ValueError("archive manifest checksum does not match its detached pin")

        manifest = json.loads(manifest_bytes)
        if manifest.get("ontologyVersion") != "v1":
            raise ValueError("archive identity is not ontologyVersion v1")

        entries = manifest.get("files")
        if not isinstance(entries, list):
            raise ValueError("manifest files must be a list")

        seen: set[str] = set()
        for entry in entries:
            relative = entry["archivedPath"]
            relative_path = Path(relative)
            if relative_path.is_absolute() or ".." in relative_path.parts:
                raise ValueError(f"unsafe archived path: {relative}")
            normalized = relative_path.as_posix()
            if normalized in seen:
                raise ValueError(f"duplicate archived path: {relative}")
            seen.add(normalized)

            target = (ARCHIVE_ROOT / relative_path).resolve()
            if not target.is_relative_to(ARCHIVE_ROOT.resolve()):
                raise ValueError(f"archived path escapes archive root: {relative}")
            if not target.is_file():
                raise ValueError(f"archived file is missing: {relative}")

            contents = target.read_bytes()
            if len(contents) != entry["byteSize"]:
                raise ValueError(f"byte size mismatch: {relative}")
            if sha256(contents) != entry["sha256"]:
                raise ValueError(f"SHA-256 mismatch: {relative}")

        print(
            f"Archive verification passed: {len(entries)} files; "
            f"manifest SHA-256 {actual_manifest_hash}"
        )
        return 0
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"Archive verification failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
