# Bisection Anything

用兩兩比較，替任何東西排名：輸入一份清單，每次只回答「這兩個你比較喜歡哪一個」。

## 模式

- **單淘汰**：選出冠軍，比較 n − 1 次。人數不是 2 的次方時補到下一個 2 的次方，
  多出來的位置變成第一輪輪空，由前段種子直接晉級（清單越前面種子越高，也可以隨機打亂）。
- **完整排序**：用二分插入排序排出所有名次，最多比較約 n·log₂n 次（16 項最多 49 次）。

## 頁面

| 路徑 | 用途 |
| --- | --- |
| `/config` | 輸入標題、項目、模式；匯入 JSON；繼續或清除目前的進度 |
| `/compare` | 兩兩比較。← / → 選擇，Backspace 復原 |
| `/bracket-chart` | 淘汰賽樹狀圖或排名；複製分享連結、複製結果文字、匯出 JSON |
| `/share#<code>` | 開啟分享連結，載入對方的設定與進度 |

## 資料

一個 session 只記錄設定和每次的選擇（0 = 左、1 = 右），樹狀圖、排名、目前的比較
都是重播選擇算出來的（`src/app/core/`）。session 會自動存進 localStorage
（`bisection-anything.session`）。分享連結把 session 用 deflate 壓縮再轉成
base64url 放在網址的 `#` 後面，所以資料不會送到伺服器。

## 開發

專案使用 Angular 22。請用專案內的 CLI，不要用全域的 `ng`：

```bash
npm start                    # 開發伺服器 http://localhost:4200
npx ng build                 # production build，輸出到 dist/
npx ng test --watch=false    # Vitest 單元測試（jsdom）
```

## CI / 部署

- `.github/workflows/ci.yml`：push 到 main 和每個 PR 都會跑測試與 build
- `.github/workflows/deploy.yml`：main 有新 commit 時測試、build（base href 為
  `/bisection-anything/`），並部署到 GitHub Pages。`404.html` 是 `index.html`
  的複本，讓 `/compare`、`/share#…` 這類深層連結也能載入
