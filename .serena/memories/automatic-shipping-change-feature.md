# 自動配送変更機能の実装概要

## 機能説明
らくらくメルカリ便監視機能が「らくらくメルカリ便」を検出した後、自動的に配送方法を普通郵便に変更する機能

## 実装場所
- ファイル: `src/sell-create-content.ts`
- 関数: `executeAutoChange()`

## 処理フロー（5段階）
1. **変更ボタン押下**: `a[data-location*="menu_shipping_method"]`の「変更する」ボタンをクリック
2. **タブ展開**: `button[data-testid="shipping-service-trigger-button"]`でタブを展開
3. **郵便選択**: `input[type="radio"][name="selectedShippingMethod"]`で「郵便」を含むラジオボタンを選択
4. **更新実行**: `button[data-location="listing_shipping_methods:update"]`で更新ボタンをクリック
5. **出品実行**: `/sell/create`に戻った後、`button[data-testid="list-item-button"]`で出品ボタンをクリック

## 設定項目
- `autoChangeEnabled`: 自動変更機能の有効/無効
- `waitTime`: 各段階間の待機時間（デフォルト1000ms）

## 動作条件
- らくらくメルカリ便監視機能で「らくらくメルカリ便」が検出された時
- `autoChangeEnabled`が`true`に設定されている時
- 商品説明欄に1文字以上の入力がある時

## エラーハンドリング
各段階で要素が見つからない場合は例外をthrowし、ログに記録
エラー発生時は監視を停止