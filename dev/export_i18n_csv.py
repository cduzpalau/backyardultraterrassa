#!/usr/bin/env python3
import json
import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
I18N_PATH = ROOT / 'assets' / 'i18n.json'
OUT_DIR = ROOT / 'dev'
OUT_CSV = OUT_DIR / 'i18n.csv'


def flatten(obj, prefix=""):
    flat = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else str(k)
            flat.update(flatten(v, key))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            key = f"{prefix}.{i}" if prefix else str(i)
            flat.update(flatten(v, key))
    else:
        # Only keep scalar values (convert to string)
        flat[prefix] = "" if obj is None else str(obj)
    return flat


def main():
    if not I18N_PATH.exists():
        raise SystemExit(f"Missing i18n file: {I18N_PATH}")
    with I18N_PATH.open('r', encoding='utf-8') as f:
        data = json.load(f)

    # Preserve preferred language order if present
    preferred = ['ca', 'es', 'en']
    langs = [l for l in preferred if l in data] + [
        l for l in data.keys() if l not in preferred
    ]

    flat_by_lang = {l: flatten(data.get(l, {})) for l in langs}
    # Union of all keys
    all_keys = set()
    for flat in flat_by_lang.values():
        all_keys.update(flat.keys())
    keys_sorted = sorted(all_keys)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open('w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['key'] + langs)
        for k in keys_sorted:
            row = [k] + [flat_by_lang[l].get(k, '') for l in langs]
            writer.writerow(row)

    print(f"Wrote {OUT_CSV} with {len(keys_sorted)} rows and languages: {', '.join(langs)}")


if __name__ == '__main__':
    main()

