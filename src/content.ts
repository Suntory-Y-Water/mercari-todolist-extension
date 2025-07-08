import { logger } from './logger';

function createSearchBox(): HTMLInputElement {
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.id = 'page-search-box';
  searchInput.placeholder = '検索...';

  // 必要最小限のスタイリング
  searchInput.style.cssText = `
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 300px;
    font-size: 14px;
    position: relative;
    z-index: 1000;
  `;

  return searchInput;
}

function createCountDisplay(): HTMLDivElement {
  const countDiv = document.createElement('div');
  countDiv.id = 'count-display';
  countDiv.style.cssText = `
    margin-left: 10px;
    display: inline-block;
    padding: 8px 12px;
    background-color: #333;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
  `;
  countDiv.textContent = '合計: 0枚 (0件)';
  return countDiv;
}

function insertSearchBox(): void {
  const mainElement = document.querySelector('#main');
  if (!mainElement) {
    logger.log('content_script', '#main要素が見つかりません');
    throw new Error('#main要素が見つかりません');
  }

  // 既存の検索ボックスがある場合は削除
  const existingSearchBox = document.getElementById('page-search-box');
  if (existingSearchBox) {
    existingSearchBox.remove();
  }

  // 既存の合計表示がある場合は削除
  const existingCountDisplay = document.getElementById('count-display');
  if (existingCountDisplay) {
    existingCountDisplay.remove();
  }

  const searchBox = createSearchBox();
  const countDisplay = createCountDisplay();

  // 検索機能を追加
  searchBox.addEventListener('input', (event) => {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    searchInPage(searchTerm);
  });

  // コンテナを作成して横並びにする
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  `;

  container.appendChild(searchBox);
  container.appendChild(countDisplay);

  // #main要素の最初の子要素として挿入
  mainElement.insertBefore(container, mainElement.firstChild);
  logger.log('content_script', '検索ボックスを挿入しました');
}

function getTextContent(element: Element, selector: string): string {
  const targetElement = element.querySelector(selector);
  if (!targetElement) {
    return '';
  }
  return targetElement.textContent || '';
}

function getItemName(name: string): string {
  const removedBrackets = name
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/「|」/g, '');

  const regex = /さんが(.+?)(?:を購入しました。|の支払いを完了)/;
  const match = removedBrackets.match(regex);

  if (!match) {
    return '';
  }

  return match[1].trim().replace(/\s+/g, '');
}

function getItemCount(itemName: string): number {
  const match = itemName.match(/(\d+)枚/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function updateCountDisplay(totalCount: number, itemCount: number): void {
  const countDisplay = document.getElementById('count-display');
  if (countDisplay) {
    countDisplay.textContent = `合計: ${totalCount}枚 (${itemCount}件)`;
  }
}

function searchInPage(searchTerm: string): void {
  if (!searchTerm) {
    const hiddenElements = document.querySelectorAll(
      '[data-search-hidden="true"]',
    );
    for (const element of hiddenElements) {
      (element as HTMLElement).style.display = '';
      element.removeAttribute('data-search-hidden');
    }

    updateCountDisplay(0, 0);
    return;
  }

  const itemElements = document.querySelectorAll(
    '[data-testid="merListItem-container"]',
  );

  let totalCount = 0;
  let itemCount = 0;

  for (const itemElement of itemElements) {
    const htmlElement = itemElement as HTMLElement;
    const itemMessage = getTextContent(itemElement, 'p');
    const name = getItemName(itemMessage);

    if (!name) {
      htmlElement.style.display = 'none';
      htmlElement.setAttribute('data-search-hidden', 'true');
      continue;
    }

    const hasMatch = name.toLowerCase().includes(searchTerm);

    if (!hasMatch) {
      htmlElement.style.display = 'none';
      htmlElement.setAttribute('data-search-hidden', 'true');
      continue;
    }

    htmlElement.style.display = '';
    htmlElement.removeAttribute('data-search-hidden');
    totalCount += getItemCount(name);
    itemCount++;
  }

  updateCountDisplay(totalCount, itemCount);
  changeBackgroundColor();
}

// ページ読み込み時に検索ボックスを挿入
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', insertSearchBox);
} else {
  insertSearchBox();
}

/**
 * 枚数に応じて背景色を決定する
 * @param count 商品の枚数
 * @returns 背景色のカラーコード。対象外の枚数の場合はnullを返す
 */
function getBackgroundColorByCount(count: number): string | null {
  switch (count) {
    case 4:
      return '#da3e50'; // 赤色
    case 3:
      return '#f0c14b'; // 黄色
    case 2:
      return '#4caf50'; // 緑色
    case 1:
      return '#2196f3'; // 青色
    default:
      return null;
  }
}

/**
 * 枚数によって現在表示されている商品の背景色を変更する
 * フィルタリングで非表示になっている商品は処理しない
 */
function changeBackgroundColor() {
  const itemElements = [
    ...document.querySelectorAll('[data-testid="merListItem-container"]'),
  ];

  for (const itemElement of itemElements) {
    const htmlElement = itemElement as HTMLElement;

    // フィルタリング後に非表示になっている商品は処理しない
    if (htmlElement.getAttribute('data-search-hidden') === 'true') {
      continue;
    }

    const itemMessage = getTextContent(itemElement, 'p');
    const name = getItemName(itemMessage);

    if (!name) {
      continue;
    }

    const count = getItemCount(name);
    const backgroundColor = getBackgroundColorByCount(count);

    // 背景色をリセット
    htmlElement.style.backgroundColor = '';

    // 枚数に応じて背景色を設定
    if (backgroundColor) {
      htmlElement.style.backgroundColor = backgroundColor;
    }
  }
}
