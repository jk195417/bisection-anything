# 開發說明

## 技術

- Angular 22：standalone components、signals、zoneless change detection，所有元件都用 OnPush
- Bootstrap 5.3（Sass，`src/styles.scss`）：用 `@use ... with (...)` 覆寫主色（`#4f46e5`）、圓角、字型；
  共用的 `.panel`、`.page-header` 也定義在這裡
- 圖示：`src/app/shared/icon.component.ts` 的 `<app-icon name="...">`，把用到的 Bootstrap Icons
  SVG 直接寫在檔案裡，只打包實際用到的圖示。要加新圖示時，從
  [Bootstrap Icons](https://icons.getbootstrap.com) 複製 `<svg>` 內的內容加進 `ICONS`
- Vitest + jsdom 單元測試（`@angular/build:unit-test`）
- 沒有後端；資料存在 localStorage

## 指令

請用專案內的 Angular CLI（`npx ng` 或 npm scripts），不要用全域安裝的 `ng`：

```bash
npm install
npm start                    # 開發伺服器 http://localhost:4200
npx ng test --watch=false    # 單元測試
npx ng build                 # production build，輸出到 dist/bisection-anything/browser
```

npm 11 會提示略過部分套件的 install scripts（例如 esbuild），不影響 build 與測試。

## 架構

```
src/app/
├── core/                 純邏輯與狀態，不依賴畫面
│   ├── session.ts        Session 型別、匯入資料驗證、項目解析、shuffle
│   ├── elimination.ts    單淘汰：種子排位、輪空、重播選擇
│   ├── insertion.ts      完整排序：二分插入排序、比較次數估算
│   ├── share-codec.ts    分享連結的編碼（deflate + base64url）
│   └── session-store.ts  signal 狀態、localStorage、JSON 匯出入、分享連結
├── shared/
│   └── icon.component.ts Bootstrap Icons 的 inline SVG 元件
└── pages/
    ├── config/           設定頁
    ├── compare/          比較頁
    ├── bracket-chart/    結果頁（樹狀圖或名次）
    └── share/            開啟 /share#<code> 分享連結
```

### 資料模型

一個 session 只記錄設定和每次的選擇：

```ts
interface Session {
  version: 1;
  title: string;
  mode: 'elimination' | 'insertion';
  items: string[]; // 種子順序，index 0 是第一種子
  picks: (0 | 1)[]; // 每次比較的選擇：0 = 左、1 = 右
}
```

樹狀圖、排名和目前的比較都是把 `picks` 從頭重播算出來的，所以：

- 復原就是拿掉最後一個 pick
- 存檔、JSON 和分享連結都很小
- 匯入的資料只要驗證這個結構（`parseSession`）

### 單淘汰

把項目數補到下一個 2 的次方，用標準種子排位（8 強為 `[0, 7, 3, 4, 1, 6, 2, 5]`），
讓前段種子越晚相遇。補出來的空位都在第一輪，對到的種子直接晉級。比賽依輪次、由上到下進行，
總共需要 n − 1 次比較。

### 完整排序

依序把每個項目用二分搜尋插入目前的排名；比較時左邊是新項目、右邊是排名中間的項目。
最多需要 Σ⌈log₂(k + 1)⌉（k = 1…n − 1）次比較。

### 儲存與分享

- localStorage key：`bisection-anything.session`，每次變更自動寫入；資料損毀時當作沒有 session
- 分享連結：`/share#<code>`，code 是 session JSON 經 `deflate-raw` 壓縮後的 base64url。
  放在 `#` 後面，所以不會送到伺服器。開啟時若會覆蓋已有進度會先詢問

## CI / 部署

- `.github/workflows/ci.yml`：push 到 main 和每個 PR 都會跑測試與 build
- `.github/workflows/deploy.yml`：push 到 main 時測試、以 `--base-href /bisection-anything/`
  build，並用 GitHub Actions 部署到 GitHub Pages
  - `404.html` 是 `index.html` 的複本：GitHub Pages 沒有 SPA fallback，這樣直接打開
    `/compare`、`/share#…` 也能載入 app（HTTP 狀態碼會是 404，但頁面正常）
  - 網址沿用帳號 Pages 的自訂網域：<https://yang-hong-xin.com/bisection-anything/>

## 截圖

`docs/images/` 的截圖是用 Playwright 對 `npm start` 的開發伺服器操作後拍的
（1000px 寬、2 倍解析度）。headless Chromium 需要中日韓與 emoji 字型，
否則中文會顯示成方塊。
