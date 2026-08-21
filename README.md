# クビを回避せよ！！ ～病院受付シミュレーション～ 公式サイト

高難易度・病院受付シミュレーションゲーム「クビを回避せよ！！（首切クリニック）」の販促用ランディングページ。

- 制作: **SaiKa工房**
- 公開: GitHub Pages（`master` ブランチ / ルート）
- ビルド不要の静的サイト。外部ライブラリ・CDN依存なし。

## 構成

```
index.html            ページ本体
assets/css/site.css   スタイル（紙のカルテを基調にしたテーマ）
assets/js/site.js     行列・渋滞演出・3点照合デモ・実績ウォール・案内役
assets/img/           ゲーム本体から書き出した画像（WebP）
tools/build_assets.py 画像を書き出すスクリプト
```

## ローカルで確認する

```
python -m http.server 8000
# → http://localhost:8000
```

## 画像を更新する

`assets/img/` の中身は、ゲーム本体のリポジトリから自動生成している。
ゲーム側の画像（Steamカプセル・患者立ち絵・実績アイコンなど）を更新したら、次を実行して差分をコミットする。

```
python tools/build_assets.py
# ゲーム本体が別の場所にある場合
python tools/build_assets.py --src ../hospital_reception_web
```

書き出す内容:

| 出力 | 元 |
| --- | --- |
| `logo.webp` / `og.webp` | Steamカプセル（`steam/assets/`） |
| `bg_waiting/bg_reception/bg_casino.webp` | 背景画像 |
| `patient/p01〜p28.webp` | 患者立ち絵（ヒーローの行列に使用） |
| `suggestion/`・`suggestion_casino/` | 案内役の表情差分 |
| `ach/*.webp` | 実績アイコン（解除・未解除の両方） |
| `shots/*.webp`（+ `@sm`） | ゲーム画面（`steam/screenshot/`） |

### スクリーンショットを追加・差し替えるとき

1. ゲーム本体の `steam/screenshot/` に画像を置く。
2. `tools/build_assets.py` の `SHOTS`（元ファイル名 → サイト側の名前）に1行足す。
3. `python tools/build_assets.py` を実行。上下の黒帯は自動で切られ、16:9（1440×810／サムネ720×405）に揃う。
4. `index.html` の `#shots` に `<figure class="shot">` を1つ足す。

## 差し替えが必要な箇所

- **受付業務の画面**: 受付・カルテ探索・監査・会計・リザルトのスクショが未追加。
  撮れたら上の手順で追加する。
- **実績の一覧**: `assets/js/site.js` の `ACHIEVEMENTS`。
  ゲーム側の `docs/steam_achievements_list.tsv` と対応している（実績27・エンディング12・称号9）。
  エンディングは `'e'` を指定すると、名前を伏せて `?` で表示される。
- **Steamリンク**: `index.html` 内の `store.steampowered.com/app/4334400/`。

## 注意

- デモに出てくる薬剤名・適応はすべて架空。実在の医薬品名は使わない（ゲーム本体と同じ方針）。
- 案内役は「受付課の店番の学生」という設定。設備を売り込む・提案する立場ではないので、そのような表現は入れない。
