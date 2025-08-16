# アーキテクチャパターンと設計方針

## Chrome拡張機能アーキテクチャ

### Manifest V3構成
- **コンテンツスクリプト**: 各ページで実行されるスクリプト
- **ポップアップ**: 拡張機能アイコンクリック時の設定画面
- **メッセージパッシング**: background <-> content script間の通信

### ファイル構成パターン
```
src/
├── content.ts              # メインページ用コンテンツスクリプト
├── sell-create-content.ts  # 特定ページ用コンテンツスクリプト
├── popup.ts               # 設定画面ロジック
├── popup.html             # 設定画面UI
└── types/index.ts         # 共通型定義
```

## 設計パターン

### 関数ベース設計
- クラスは使用せず、関数ベースで実装
- 純粋関数としての実装（副作用なし）
- 単一責任ではなく、ロジックの意味で実装

### 型安全設計
- TypeScriptの型システムを最大限活用
- 構造的型付けを重視
- Pick、Omitなどのユーティリティ型を活用

### Chrome拡張機能特有のパターン
- **設定の永続化**: chrome.storage.sync API使用
- **ページ監視**: setInterval + DOM監視
- **クロスページ通信**: chrome.runtime.sendMessage

## コード例から見るパターン

### 設定管理パターン
```typescript
type MonitoringSettings = {
  enabled: boolean;
  interval: number;
};

const DEFAULT_SETTINGS: MonitoringSettings = {
  enabled: false,
  interval: 3,
};
```

### DOM監視パターン
```typescript
function startMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  
  monitoringInterval = setInterval(() => {
    checkTargetElement();
  }, currentSettings.interval * 1000);
}
```

### メッセージパッシングパターン
```typescript
chrome.runtime.onMessage.addListener((message: ChromeMessage) => {
  if (message.action === 'updateSettings') {
    updateSettings(message.settings);
  }
});
```