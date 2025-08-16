# 推奨コマンド

## 開発コマンド

### 基本開発
```bash
# 開発サーバー起動
pnpm run dev

# ビルド
pnpm run build

# プレビュー
pnpm run preview
```

### コード品質
```bash
# リンチェック
pnpm run lint

# リント修正
pnpm run lint:fix

# フォーマット
pnpm run format
```

### AI開発支援
```bash
# AI専用のリント・型チェック
pnpm run ai-check
```

## Git操作
```bash
# 基本操作
git status
git add .
git commit -m "message"
git push

# ブランチ操作
git branch
git checkout -b feature/new-feature
git merge main
```

## システムコマンド (Linux)
```bash
# ファイル操作
ls -la
cd directory
find . -name "*.ts"
grep -r "pattern" src/

# パッケージ管理
pnpm install
pnpm add package-name
pnpm remove package-name
```

## 拡張機能開発特有
```bash
# dist フォルダを Chrome の「パッケージ化されていない拡張機能を読み込む」で読み込み
# 開発時は pnpm run dev でホットリロード可能
```