# プロジェクト概要

## プロジェクト名
mercari-todolist-extension

## プロジェクトの目的
メルカリのブラウザ拡張機能。主に2つの機能を提供：

1. **やることリスト枚数確認**
   - メルカリの出品した商品ページ（`https://jp.mercari.com/todos`）でやることリストの商品枚数と件数を確認する機能

2. **らくらくメルカリ便監視機能**
   - メルカリの出品ページ（`https://jp.mercari.com/sell/create`）で「らくらくメルカリ便」の文字を監視し、見つかった場合にアラートを表示する機能

## 技術スタック
- **言語**: TypeScript
- **ビルドツール**: Vite
- **拡張機能フレームワーク**: @crxjs/vite-plugin
- **フォーマッター/リンター**: Biome
- **パッケージマネージャー**: pnpm
- **型定義**: typed-query-selector, @types/chrome

## バージョン
現在のバージョン: 1.1.1

## ライセンス
MIT