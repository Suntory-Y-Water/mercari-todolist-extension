# 仕様書

## 前提条件

らくらくメルカリ便監視機能で処理が終わった後に実施

## やりたいこと

配送情報が勝手にらくらくメルカリ便へ変更されてしまうので、すべて普通郵便に変更する処理を行う

※CSSセレクタの最適化は必要だが、処理フローのみ先に記載

- 変更するボタンを押下して`https://jp.mercari.com/sell/shipping_methods`へ遷移
- 遷移後、タブを押下してタブを展開
- 展開したタブから`郵便(定形、定形外、書留など)`といった`郵便`と入っているラジオボタンを選択
  - ラジオボタンのセレクタを押下し選択状態にする
- 更新するボタンを押下
- 押下後、`https://jp.mercari.com/sell/create`に戻ってきたことを確認したら、出品するボタンを押下して処理終了

## 参考ソース
```js
(() => {
    // 目的：'変更する' ボタンを押下する
    // CSSセレクタで'変更する'というテキストを含むリンク要素を特定する。
    // `a[data-location*="menu_shipping_method"]` は、data-location属性に "menu_shipping_method" を含む `a` 要素を狙う。
    // `a:contains('変更する')` は、jQueryのような関数だが、標準JavaScriptには存在しないため、
    // `querySelectorAll` で取得した要素の `textContent` を `includes()` でチェックする。
    // 変更に強いセレクタとして、`a` タグで、`data-location` 属性に `menu_shipping_method` を含み、
    // かつテキストコンテンツに「変更する」が含まれるものを探す。
    // まずは `a[data-location*="menu_shipping_method"]` で候補を絞り、その中からテキストでフィルタリングする。
    const changeButton = Array.from(document.querySelectorAll('a[data-location*="menu_shipping_method"]')).find(element => element.textContent.includes('変更する'));

    if (changeButton) {
        changeButton.click();
    } else {
        console.log("「変更する」ボタンが見つかりませんでした。");
    }
})();
```

```js
(() => {
    // 目的：タブを展開するボタンを押下する。
    // 対象の要素は `button` タグで、`data-testid="shipping-service-trigger-button"` という属性を持つ。
    // また、このボタンは `aria-expanded="false"` で、まだ展開されていない状態を示す。
    // CSSセレクタとしては `button[data-testid="shipping-service-trigger-button"]` が最も直接的で変更にも強い。
    const expandButton = document.querySelector('button[data-testid="shipping-service-trigger-button"]');

    if (expandButton) {
        expandButton.click();
    } else {
        console.log("展開ボタンが見つかりませんでした。");
    }
})();
```

```js
(() => {
    // 目的：展開したタブから「郵便」というテキストを含むラジオボタンを選択する。
    // 対象のラジオボタンは `<input type="radio">` で、その親の `div` や `fieldset` に関連情報がある。
    // ラジオボタンのラベルテキストは `<p>` タグに格納されており、そのクラスは `dpfntZ jdmOYL llkYNn` である。
    // 変更に強く、かつ「郵便」というキーワードで特定するために、以下のセレクタを使用する。
    // 1. `input[type="radio"]` を検索対象とする。
    // 2. その `input` 要素の `aria-labelledby` 属性で指定されている `id` を持つ要素 (`<p>` タグ) を特定する。
    // 3. その `<p>` タグのテキストコンテンツに「郵便」が含まれているかをチェックする。
    // 4. 条件に合致する `<input type="radio">` 要素があれば、それをクリックする。

    // まず、全てのラジオボタン (`input[type="radio"]`) を取得する。
    const radioButtons = document.querySelectorAll('input[type="radio"][name="selectedShippingMethod"]');

    let targetRadioButton = null;

    // 各ラジオボタンをループして、目的のものを探す。
    for (const radioButton of radioButtons) {
        // ラジオボタンに紐づくラベルのIDを取得する。
        const ariaLabelledby = radioButton.getAttribute('aria-labelledby');

        if (ariaLabelledby) {
            // IDを使ってラベル要素（<p>タグ）を取得する。
            const labelElement = document.getElementById(ariaLabelledby);

            // ラベル要素が存在し、そのテキストに「郵便」が含まれているか確認する。
            if (labelElement && labelElement.textContent.includes('郵便')) {
                targetRadioButton = radioButton;
                break; // 目的のラジオボタンが見つかったのでループを抜ける。
            }
        }
    }

    if (targetRadioButton) {
        targetRadioButton.click();
    } else {
        console.log("「郵便」を含むラジオボタンが見つかりませんでした。");
    }
})();
```


```js
(() => {
    // 目的：「更新する」ボタンを押下する。
    // このボタンは、上記のラジオボタン選択処理の後に実行される。
    // HTML構造を見ると、「更新する」というテキストを持つ `span` 要素が `<button>` の中にあり、
    // その `<button>` は `data-location="listing_shipping_methods:update"` という属性を持っている。
    // 変更に強く、かつ意図したボタンを特定するために、`data-location` 属性をキーにするのが最も確実。

    const updateButton = document.querySelector('button[data-location="listing_shipping_methods:update"]');

    if (updateButton) {
        updateButton.click();
    } else {
        console.log("「更新する」ボタンが見つかりませんでした。");
    }
})();
```

```js
(() => {
    // 目的：URLが `https://jp.mercari.com/sell/create` に戻ってきたことを確認したら、「出品する」ボタンを押下する。
    // この処理は、前の「更新する」ボタンのクリック後に実行される。
    // まず、現在のURLが指定されたパス (`/sell/create`) に一致するかどうかを確認する。
    // URLの確認には `window.location.pathname` を使用する。
    // 次に、「出品する」ボタンを特定する。
    // HTML構造によると、「出品する」というテキストを持つ `button` 要素があり、
    // その親の `div` が `data-location="listing:footer:exit_buttons:list"` と `testid="list-item-button"` を持っている。
    // `button` 要素自体も `data-testid="list-item-button"` を持っている。
    // 変更に強く、かつ特定しやすいセレクタとして `button[data-testid="list-item-button"]` を使用する。

    const expectedPath = '/sell/create';
    const sellButtonSelector = 'button[data-testid="list-item-button"]';

    // 現在のURLのパス部分を取得し、期待されるパスと比較する。
    // `window.location.pathname` は、ドメイン名以降のパス部分を返す（例: "/sell/create"）。
    if (window.location.pathname === expectedPath) {
        // URLが一致した場合、「出品する」ボタンを探してクリックする。
        const sellButton = document.querySelector(sellButtonSelector);

        if (sellButton) {
            sellButton.click();
        } else {
            console.log("「出品する」ボタンが見つかりませんでした。URLは期待通りです。");
        }
    } else {
        console.log(`現在のURLパス "${window.location.pathname}" は "${expectedPath}" と一致しません。`);
    }
})();
```