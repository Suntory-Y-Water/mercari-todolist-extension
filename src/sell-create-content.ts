import { logger } from './logger';
import type { MonitoringSettings } from './types/index';

const DEFAULT_SETTINGS: MonitoringSettings = {
  interval: 1,
  enabled: false,
  showAlert: true,
  autoChangeEnabled: false,
  waitTime: 1000,
};

const TARGET_SELECTOR = '#main > form > section';
const SEARCH_TEXT = 'らくらくメルカリ便';
let monitoringTimeout: number | null = null;
let isMonitoring = false;
let currentSettings: MonitoringSettings = DEFAULT_SETTINGS;

/**
 * Chrome Storageから監視設定を読み込む
 * @returns {Promise<MonitoringSettings>} 監視設定オブジェクト
 */
/**
 * 段階1: 変更するボタンを押下する
 * @returns {void}
 */
function clickChangeButton(): void {
  const changeButton = [...document.querySelectorAll('a[data-location*="menu_shipping_method"]')].find(element => element.textContent?.includes('変更する'));

  if (!changeButton) {
    throw new Error('「変更する」ボタンが見つかりませんでした');
  }

  changeButton.click();
}

/**
 * 段階2: タブを展開するボタンを押下する
 * @returns {void}
 */
function expandShippingTab(): void {
  const expandButton = document.querySelector('button[data-testid="shipping-service-trigger-button"]');

  if (!expandButton) {
    throw new Error('展開ボタンが見つかりませんでした');
  }

  expandButton.click();
}

/**
 * 段階3: 郵便ラジオボタンを選択する
 * @returns {void}
 */
function selectPostalRadio(): void {
  const radioButtons = [...document.querySelectorAll('input[type="radio"][name="selectedShippingMethod"]')];
  let targetRadioButton: HTMLInputElement | null = null;

  for (const radioButton of radioButtons) {
    const ariaLabelledby = radioButton.getAttribute('aria-labelledby');

    if (ariaLabelledby) {
      const labelElement = document.getElementById(ariaLabelledby);

      if (labelElement?.textContent?.includes('郵便')) {
        targetRadioButton = radioButton;
        break;
      }
    }
  }

  if (!targetRadioButton) {
    throw new Error('「郵便」を含むラジオボタンが見つかりませんでした');
  }

  targetRadioButton.click();
}

/**
 * 段階4: 更新するボタンを押下する
 * @returns {void}
 */
function clickUpdateButton(): void {
  const updateButton = document.querySelector('button[data-location="listing_shipping_methods:update"]');

  if (!updateButton) {
    throw new Error('「更新する」ボタンが見つかりませんでした');
  }

  updateButton.click();
}

/**
 * 段階5: 出品するボタンを押下する（URLチェック付き）
 * @returns {void}
 */
function clickSellButton(): void {
  const expectedPath = '/sell/create';
  
  if (window.location.pathname !== expectedPath) {
    throw new Error(`現在のURLパス "${window.location.pathname}" は "${expectedPath}" と一致しません`);
  }

  const sellButton = document.querySelector('button[data-testid="list-item-button"]');

  if (!sellButton) {
    throw new Error('「出品する」ボタンが見つかりませんでした');
  }

  (sellButton as HTMLElement).click();
}

/**
 * 待機関数
 * @param {number} ms 待機時間（ミリ秒）
 * @returns {Promise<void>}
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 5段階の自動変更処理を順次実行する
 * @returns {Promise<void>}
 */
async function executeAutoChange(): Promise<void> {
  try {
    logger.log('sell_create_content', '自動変更処理を開始します');

    // 段階1: 変更ボタン押下
    clickChangeButton();
    logger.log('sell_create_content', '段階1: 変更ボタンを押下しました');
    await sleep(currentSettings.waitTime);

    // 段階2: タブ展開
    expandShippingTab();
    logger.log('sell_create_content', '段階2: タブを展開しました');
    await sleep(currentSettings.waitTime);

    // 段階3: 郵便ラジオボタン選択
    selectPostalRadio();
    logger.log('sell_create_content', '段階3: 郵便ラジオボタンを選択しました');
    await sleep(currentSettings.waitTime);

    // 段階4: 更新ボタン押下
    clickUpdateButton();
    logger.log('sell_create_content', '段階4: 更新ボタンを押下しました');
    await sleep(currentSettings.waitTime);

    // 段階5: 出品ボタン押下
    clickSellButton();
    logger.log('sell_create_content', '段階5: 出品ボタンを押下しました');

    logger.log('sell_create_content', '自動変更処理が完了しました');
  } catch (error) {
    logger.log('sell_create_content', `自動変更処理でエラーが発生しました: ${error}`);
    throw error;
  }
}

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
 * @returns {Promise<void>}
 */
async function checkTargetElement(): Promise<void> {
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
      
      if (currentSettings.autoChangeEnabled) {
        // 自動変更処理を実行（2秒待機後）
        logger.log('sell_create_content', '2秒後に自動変更処理を開始します');
        await sleep(2000);
        try {
          await executeAutoChange();
          stopMonitoring();
        } catch (error) {
          logger.log('sell_create_content', `自動変更処理でエラーが発生しました: ${error}`);
          stopMonitoring();
        }
      } else if (currentSettings.showAlert) {
        // アラート表示
        alert(`「${SEARCH_TEXT}」が見つかりました！`);
        stopMonitoring();
      }
      
      return;
    }
  }

  logger.log('sell_create_content', `「${SEARCH_TEXT}」は見つかりませんでした`);
}

/**
 * 再帰的な監視処理
 * @returns {Promise<void>}
 */
async function runMonitoringCycle(): Promise<void> {
  if (!isMonitoring) {
    return;
  }

  try {
    await checkTargetElement();
  } catch (error) {
    logger.log('sell_create_content', `監視処理エラー: ${error}`);
  }

  if (isMonitoring) {
    monitoringTimeout = window.setTimeout(() => {
      runMonitoringCycle();
    }, currentSettings.interval * 1000);
  }
}

/**
 * 監視機能を開始する。既に監視中の場合は一度停止してから開始する
 * @returns {Promise<void>}
 */
async function startMonitoring(): Promise<void> {
  stopMonitoring();

  if (!currentSettings.enabled) {
    logger.log('sell_create_content', '監視機能が無効になっています');
    return;
  }

  logger.log(
    'sell_create_content',
    `監視を開始します（間隔: ${currentSettings.interval}秒）`,
  );

  isMonitoring = true;
  await runMonitoringCycle();
}

/**
 * 監視機能を停止する
 * @returns {void}
 */
function stopMonitoring(): void {
  if (monitoringTimeout !== null) {
    clearTimeout(monitoringTimeout);
    monitoringTimeout = null;
  }
  if (isMonitoring) {
    isMonitoring = false;
    logger.log('sell_create_content', '監視を停止しました');
  }
}

/**
 * 設定を更新し、必要に応じて監視を再開始する
 * @param {MonitoringSettings} newSettings 新しい監視設定
 * @returns {Promise<void>}
 */
async function updateSettings(newSettings: MonitoringSettings): Promise<void> {
  const wasEnabled = currentSettings.enabled;
  currentSettings = newSettings;

  logger.log(
    'sell_create_content',
    `設定を更新: 間隔=${newSettings.interval}秒, 有効=${newSettings.enabled}`,
  );

  if (wasEnabled !== newSettings.enabled || newSettings.enabled) {
    stopMonitoring();
    if (newSettings.enabled) {
      await startMonitoring();
    }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'updateSettings') {
    updateSettings(message.settings).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      logger.log('sell_create_content', `設定更新エラー: ${error}`);
      sendResponse({ success: false, error: error.message });
    });
    return true; // 非同期レスポンスを示す
  }
});

/**
 * Content Scriptの初期化処理。設定を読み込み、監視機能を開始する
 * @returns {Promise<void>}
 */
async function initialize(): Promise<void> {
  try {
    const settings = await loadSettings();
    await updateSettings(settings);
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
