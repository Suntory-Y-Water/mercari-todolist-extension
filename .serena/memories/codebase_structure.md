# コードベース構造

## ディレクトリ構造
/
├── src/
│   ├── types/
│   │   └── index.ts          # 型定義
│   ├── content.ts            # やることリスト機能のコンテンツスクリプト
│   ├── sell-create-content.ts # らくらくメルカリ便監視機能のコンテンツスクリプト
│   ├── popup.ts              # 拡張機能ポップアップの処理
│   ├── popup.html            # 拡張機能ポップアップのHTML
│   └── logger.ts             # ログ機能
├── docs/                     # ドキュメント
├── package.json              # プロジェクト設定とスクリプト
├── tsconfig.json             # TypeScript設定
├── biome.json                # Biome設定（リンター/フォーマッター）
├── vite.config.ts            # Vite設定とマニフェスト定義
├── CLAUDE.md                 # AI開発ガイドライン
└── README.md                 # プロジェクト説明

## 主要ファイルの役割

### マニフェスト設定 (vite.config.ts)
- Chrome拡張機能のマニフェストv3定義
- コンテンツスクリプトのマッピング
- 権限とホスト許可の設定

### コンテンツスクリプト
- `content.ts`: やることリストページでの枚数確認機能
- `sell-create-content.ts`: 出品ページでのらくらくメルカリ便監視機能

### ポップアップ
- `popup.html/ts`: 拡張機能の設定画面

### 型定義
- `types/index.ts`: プロジェクト全体で使用する型定義