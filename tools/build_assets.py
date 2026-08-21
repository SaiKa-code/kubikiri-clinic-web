#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""ゲーム本体のリポジトリからサイト用の画像を書き出す。

    python tools/build_assets.py [--src <ゲームリポジトリのパス>]

書き出し先は assets/img/ 以下。透過を保ったまま WebP に変換し、
Web で扱えるサイズまで縮小する。ゲーム側の画像を更新したら再実行すれば良い。
"""

import argparse
import sys
from pathlib import Path

from PIL import Image

SITE_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = SITE_ROOT / "assets" / "img"
DEFAULT_SRC = SITE_ROOT.parent / "hospital_reception_web"


def load(src: Path, rel: str) -> Image.Image:
    path = src / rel
    if not path.exists():
        raise FileNotFoundError(path)
    return Image.open(path).convert("RGBA")


def trim(img: Image.Image, padding: int = 0) -> Image.Image:
    """透明な余白を切り落とす。"""
    box = img.getbbox()
    if box is None:
        return img
    if padding:
        left, top, right, bottom = box
        box = (
            max(0, left - padding),
            max(0, top - padding),
            min(img.width, right + padding),
            min(img.height, bottom + padding),
        )
    return img.crop(box)


def fit_height(img: Image.Image, height: int) -> Image.Image:
    if img.height <= height:
        return img
    width = max(1, round(img.width * height / img.height))
    return img.resize((width, height), Image.LANCZOS)


def fit_width(img: Image.Image, width: int) -> Image.Image:
    if img.width <= width:
        return img
    height = max(1, round(img.height * width / img.width))
    return img.resize((width, height), Image.LANCZOS)


def save(img: Image.Image, rel_out: str, quality: int = 82, lossless: bool = False) -> None:
    dest = OUT_DIR / rel_out
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=quality, lossless=lossless, method=6)
    kb = dest.stat().st_size / 1024
    print(f"  {rel_out:<34} {img.width}x{img.height}  {kb:7.1f} KB")


def flatten(img: Image.Image, bg=(255, 255, 255)) -> Image.Image:
    """背景色に合成して不透明にする（写真・カプセル用）。"""
    canvas = Image.new("RGB", img.size, bg)
    canvas.paste(img, mask=img.split()[3])
    return canvas


def build_branding(src: Path) -> None:
    # ロゴ・OGP画像は日本語版（steam/assets/ja/）を使う
    print("branding")
    logo = trim(load(src, "steam/assets/ja/library_logo_1280x720.png"), padding=8)
    save(fit_width(logo, 1000), "logo.webp")

    capsule = flatten(load(src, "steam/assets/ja/main_capsule_1232x706.png"))
    save(fit_width(capsule, 1200), "og.webp", quality=88)

    mark = trim(load(src, "assets/images/logo_saika_mark.png"))
    save(fit_height(mark, 96), "saika_mark.webp", lossless=True)

    # ヘッダーのブランドマーク（ゲーム本体のアプリアイコン）
    icon = Image.open(src / "assets" / "images" / "icon.ico").convert("RGBA")
    save(fit_width(icon, 128), "icon.webp", lossless=True)


def build_backgrounds(src: Path) -> None:
    print("backgrounds")
    for rel_in, name in (
        ("assets/images/reception_background2.png", "bg_waiting.webp"),
        ("assets/images/reception_background.png", "bg_reception.webp"),
        ("assets/images/casino_home.jpg", "bg_casino.webp"),
    ):
        img = flatten(load(src, rel_in))
        save(fit_width(img, 1600), name, quality=76)


def build_patients(src: Path) -> None:
    print("patients")
    names = [f"man{i}" for i in range(1, 15)] + [f"woman{i}" for i in range(1, 15)]
    for i, name in enumerate(names, start=1):
        img = trim(load(src, f"assets/images/patient/{name}.png"))
        save(fit_height(img, 460), f"patient/p{i:02d}.webp", quality=80)


def build_suggestion(src: Path) -> None:
    print("suggestion")
    for face in ("01_normal", "02_smile", "03_wink", "04_relax", "05_surprised", "06_worried"):
        img = trim(load(src, f"assets/images/suggestion/{face}.png"))
        save(fit_height(img, 560), f"suggestion/{face}.webp", quality=82)
    for face in ("01_normal", "02_smile", "03_wink", "05_surprised", "06_worried"):
        img = trim(load(src, f"assets/images/suggestion_casino/{face}.png"))
        save(fit_height(img, 560), f"suggestion_casino/{face}.webp", quality=82)


#: steam/screenshot/ の実ゲーム画面 → サイト側のファイル名
SHOTS = {
    "スクリーンショット 2026-07-23 135146.png": "home",       # 自宅（ハブ）
    "スクリーンショット 2026-07-23 135205.png": "shop",       # 改善提案ショップ
    "スクリーンショット 2026-07-23 135224.png": "dx",         # DX機材の導入
    "スクリーンショット 2026-07-23 134919.png": "stock",      # 株式取引（現物）
    "スクリーンショット 2026-07-23 135306.png": "casino",     # ナイトカジノ
    "スクリーンショット 2026-07-23 135343.png": "baccarat",   # バカラ
    "スクリーンショット 2026-07-23 135440.png": "poker",      # ポーカー
    "スクリーンショット 2026-07-23 135455 - コピー - コピー.png": "review",  # 月次査定
    "スクリーンショット 2026-07-23 134743.png": "novel",      # 会話パート
}


def to_16x9(img: Image.Image, width: int = 1440) -> Image.Image:
    """幅を揃えたうえで、高さを16:9に中央クロップ（足りなければ上端基準）。"""
    img = fit_width(img, width)
    target = round(img.width * 9 / 16)
    if img.height > target:
        top = (img.height - target) // 2
        return img.crop((0, top, img.width, top + target))
    if img.height < target:
        canvas = Image.new(img.mode, (img.width, target), (18, 18, 18))
        canvas.paste(img, (0, (target - img.height) // 2))
        return canvas
    return img


def trim_letterbox(img: Image.Image, threshold: int = 48) -> Image.Image:
    """ゲーム画面の上下に入る黒帯を切り落とす（帯の輝度は34前後）。
    左右はトリムしない——暗い背景の画面まで削ってしまうため。"""
    gray = img.convert("L")
    w, h = gray.size
    px = gray.load()
    xs = range(0, w, max(1, w // 80))
    ys = range(0, h, max(1, h // 80))

    def span(count: int, is_bright) -> tuple[int, int]:
        first, last = 0, count - 1
        for i in range(count):
            if is_bright(i):
                first = i
                break
        for i in range(count - 1, -1, -1):
            if is_bright(i):
                last = i
                break
        return first, last

    top, bottom = span(h, lambda y: max(px[x, y] for x in xs) > threshold)
    if bottom <= top:
        return img
    return img.crop((0, top, w, bottom + 1))


def build_shots(src: Path) -> None:
    print("screenshots")
    shot_dir = src / "steam" / "screenshot"
    if not shot_dir.is_dir():
        print("  steam/screenshot が無いのでスキップ")
        return
    for filename, name in SHOTS.items():
        path = shot_dir / filename
        if not path.exists():
            print(f"  見つかりません: {filename}")
            continue
        img = to_16x9(trim_letterbox(flatten(Image.open(path).convert("RGBA"))))
        save(img, f"shots/{name}.webp", quality=80)
        save(fit_width(img, 720), f"shots/{name}@sm.webp", quality=72)


def build_achievements(src: Path) -> None:
    print("achievements")
    ach_dir = src / "steam" / "achievements"
    for path in sorted(ach_dir.glob("*.png")):
        img = fit_width(Image.open(path).convert("RGBA"), 128)
        save(img, f"ach/{path.stem}.webp", quality=84)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", type=Path, default=DEFAULT_SRC, help="ゲーム本体のリポジトリ")
    args = parser.parse_args()

    src = args.src.resolve()
    if not (src / "assets" / "images").is_dir():
        print(f"ゲーム本体が見つかりません: {src}", file=sys.stderr)
        return 1

    print(f"src = {src}")
    print(f"out = {OUT_DIR}\n")
    build_branding(src)
    build_backgrounds(src)
    build_patients(src)
    build_suggestion(src)
    build_achievements(src)
    print("\n完了")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
