import { logger } from './logger';
import type { MonitoringSettings } from './types/index';

const DEFAULT_SETTINGS: MonitoringSettings = {
  interval: 1,
  enabled: false,
};

const TARGET_SELECTOR = '#main > form > section';
const SEARCH_TEXT = 'らくらくメルカリ便';
let monitoringInterval: number | null = null;
let currentSettings: MonitoringSettings = DEFAULT_SETTINGS;

/**
 * Chrome Storageから監視設定を読み込む
 * @returns {Promise<MonitoringSettings>} 監視設定オブジェクト
 */
async function loadSettings(): Promise<MonitoringSettings> {
  try {
    const result = await chrome.storage.local.get('monitoringSettings');
    return result.monitoringSettings || DEFAULT_SETTINGS;
  } catch (error) {
    logger.log('sell_create_content', `設定の読み込みに失敗: ${error}`);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 全sectionを取得して「らくらくメルカリ便」の文字列をチェックし、発見時にアラート表示・監視停止する
 * @returns {void}
 */
function checkTargetElement(): void {
  const targetElements = document.querySelectorAll(TARGET_SELECTOR);
  // 商品の説明欄
  const description = document.querySelector('textarea[name="description"]');

  if (!targetElements || targetElements.length === 0) {
    logger.log(
      'sell_create_content',
      `対象要素が見つかりません: ${TARGET_SELECTOR}`,
    );
    return;
  }

  // descriptionにテキストが1文字以上設定されているかチェック
  const descriptionText = description?.value || '';
  if (descriptionText.length === 0) {
    logger.log(
      'sell_create_content',
      'description未入力のため監視をスキップします',
    );
    return;
  }

  for (const element of targetElements) {
    const textContent = element.textContent || '';
    const hasTargetText = textContent.includes(SEARCH_TEXT);

    if (hasTargetText) {
      logger.log('sell_create_content', `「${SEARCH_TEXT}」を発見しました！`);
      alert(`「${SEARCH_TEXT}」が見つかりました！`);
      stopMonitoring();
      return;
    }
  }

  logger.log('sell_create_content', `「${SEARCH_TEXT}」は見つかりませんでした`);
}

/**
 * 監視機能を開始する。既に監視中の場合は一度停止してから開始する
 * @returns {void}
 */
function startMonitoring(): void {
  if (monitoringInterval !== null) {
    clearInterval(monitoringInterval);
  }

  if (!currentSettings.enabled) {
    logger.log('sell_create_content', '監視機能が無効になっています');
    return;
  }

  logger.log(
    'sell_create_content',
    `監視を開始します（間隔: ${currentSettings.interval}秒）`,
  );

  monitoringInterval = window.setInterval(() => {
    checkTargetElement();
  }, currentSettings.interval * 1000);

  checkTargetElement();
}

/**
 * 監視機能を停止する
 * @returns {void}
 */
function stopMonitoring(): void {
  if (monitoringInterval !== null) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    logger.log('sell_create_content', '監視を停止しました');
  }
}

/**
 * 設定を更新し、必要に応じて監視を再開始する
 * @param {MonitoringSettings} newSettings 新しい監視設定
 * @returns {void}
 */
function updateSettings(newSettings: MonitoringSettings): void {
  const wasEnabled = currentSettings.enabled;
  currentSettings = newSettings;

  logger.log(
    'sell_create_content',
    `設定を更新: 間隔=${newSettings.interval}秒, 有効=${newSettings.enabled}`,
  );

  if (wasEnabled !== newSettings.enabled || newSettings.enabled) {
    stopMonitoring();
    if (newSettings.enabled) {
      startMonitoring();
    }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'updateSettings') {
    updateSettings(message.settings);
    sendResponse({ success: true });
  }
});

/**
 * Content Scriptの初期化処理。設定を読み込み、監視機能を開始する
 * @returns {Promise<void>}
 */
async function initialize(): Promise<void> {
  try {
    const settings = await loadSettings();
    updateSettings(settings);
    logger.log(
      'sell_create_content',
      'らくらくメルカリ便監視機能を初期化しました',
    );
  } catch (error) {
    logger.log('sell_create_content', `初期化エラー: ${error}`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

window.addEventListener('beforeunload', () => {
  stopMonitoring();
});
