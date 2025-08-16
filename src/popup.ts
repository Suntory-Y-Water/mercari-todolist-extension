import type { MonitoringSettings } from './types/index';

const DEFAULT_SETTINGS: MonitoringSettings = {
  interval: 1,
  enabled: false,
  showAlert: true,
  autoChangeEnabled: false,
  waitTime: 1000,
};

/**
 * Chrome Storageから監視設定を読み込む
 * @returns {Promise<MonitoringSettings>} 監視設定オブジェクト
 */
async function loadSettings(): Promise<MonitoringSettings> {
  try {
    const result = await chrome.storage.local.get('monitoringSettings');
    return result.monitoringSettings || DEFAULT_SETTINGS;
  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 監視設定をChrome Storageに保存し、対象タブに設定変更を通知する
 * @param {MonitoringSettings} settings 保存する監視設定
 * @returns {Promise<void>}
 */
async function saveSettings(settings: MonitoringSettings): Promise<void> {
  try {
    await chrome.storage.local.set({ monitoringSettings: settings });

    const tabs = await chrome.tabs.query({
      url: 'https://jp.mercari.com/sell/create',
    });

    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateSettings',
          settings: settings,
        });
      }
    }
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    throw error;
  }
}

/**
 * ポップアップにステータスメッセージを表示する
 * @param {string} message 表示するメッセージ
 * @param {boolean} isError エラーメッセージかどうか（デフォルト: false）
 * @returns {void}
 */
function showStatus(message: string, isError = false): void {
  const statusElement = document.getElementById('status');
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.className = `status ${isError ? 'error' : 'success'}`;
  statusElement.style.display = 'block';

  setTimeout(() => {
    statusElement.style.display = 'none';
  }, 3000);
}

/**
 * ポップアップの初期化処理。保存された設定値をフォームに反映する
 * @returns {Promise<void>}
 */
async function initializePopup(): Promise<void> {
  const settings = await loadSettings();

  const intervalInput = document.getElementById('interval') as HTMLInputElement;
  const enabledRadio = document.getElementById('enabled') as HTMLInputElement;
  const disabledRadio = document.getElementById('disabled') as HTMLInputElement;
  const alertEnabledRadio = document.getElementById('alertEnabled') as HTMLInputElement;
  const alertDisabledRadio = document.getElementById('alertDisabled') as HTMLInputElement;
  const autoChangeEnabledRadio = document.getElementById('autoChangeEnabled') as HTMLInputElement;
  const autoChangeDisabledRadio = document.getElementById('autoChangeDisabled') as HTMLInputElement;

  if (intervalInput) {
    intervalInput.value = settings.interval.toString();
  }

  if (settings.enabled) {
    if (enabledRadio) enabledRadio.checked = true;
  } else {
    if (disabledRadio) disabledRadio.checked = true;
  }

  if (settings.showAlert) {
    if (alertEnabledRadio) alertEnabledRadio.checked = true;
  } else {
    if (alertDisabledRadio) alertDisabledRadio.checked = true;
  }

  if (settings.autoChangeEnabled) {
    if (autoChangeEnabledRadio) autoChangeEnabledRadio.checked = true;
  } else {
    if (autoChangeDisabledRadio) autoChangeDisabledRadio.checked = true;
  }
}

/**
 * イベントリスナーのセットアップ。保存ボタンのクリックイベントを設定する
 * @returns {void}
 */
function setupEventListeners(): void {
  const saveButton = document.getElementById('save');

  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      try {
        const intervalInput = document.getElementById(
          'interval',
        ) as HTMLInputElement;
        const enabledRadio = document.getElementById(
          'enabled',
        ) as HTMLInputElement;
        const alertEnabledRadio = document.getElementById(
          'alertEnabled',
        ) as HTMLInputElement;
        const autoChangeEnabledRadio = document.getElementById(
          'autoChangeEnabled',
        ) as HTMLInputElement;

        const interval = Number.parseInt(intervalInput?.value || '1', 10);
        const enabled = enabledRadio?.checked || false;
        const showAlert = alertEnabledRadio?.checked || false;
        const autoChangeEnabled = autoChangeEnabledRadio?.checked || false;

        if (interval < 1 || interval > 60) {
          showStatus('監視間隔は1～60秒の範囲で入力してください', true);
          return;
        }

        const settings: MonitoringSettings = {
          interval,
          enabled,
          showAlert,
          autoChangeEnabled,
          waitTime: 1000,
        };

        await saveSettings(settings);
        showStatus('設定を保存しました');
      } catch (error) {
        console.error('保存エラー:', error);
        showStatus('設定の保存に失敗しました', true);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await initializePopup();
  setupEventListeners();
});
