# 食刻 · Food Order System

繁體中文訂餐專案。HTML/CSS/JavaScript 前端搭配 Node.js API；Render 上使用 PostgreSQL 儲存訂單。

## 功能

- 菜單與分類、購物車、數量調整與移除。
- 到店自取、姓名／手機驗證、餐點備註、到店付款。
- 伺服器計價與重複送出保護。
- 訂單編號查詢；查詢結果不含姓名、手機或備註。
- 響應式桌面／手機介面。

本專案為示範餐廳，沒有串接真實店家、信用卡金流、簡訊或出餐後台。訂單狀態維持「已收到訂單」。

## 本機執行

使用 Node.js 22 或更新版本，在本目錄執行：

```sh
npm ci
npm start
```

開啟 http://localhost:3000 。未設定 DATABASE_URL 時，訂單存在本機 `data/orders.json`，重啟仍會保留；請勿把這個資料夾上傳 GitHub。

```sh
npm test
```

## Render 部署

請將 **本目錄的內容** 上傳至 GitHub 儲存庫根目錄（package.json 與 render.yaml 應在根目錄）。上層 Sites 初始化檔案不屬於此 Render 應用程式。

1. 在 Render 以 New → Blueprint 連結該儲存庫。
2. 檢查將建立的 `food-order-system` Web Service 與 `food-order-db` PostgreSQL。
3. 套用 Blueprint，等待部署完成。DATABASE_URL 由 Blueprint 自動接入。
4. 如服務未放進既有專案，可在 food-order-system 專案頁使用 Move existing services 加入。
5. 以服務網址開啟網站；`/health` 應回傳 `{"ok":true}`。

設定指定 free 方案，實際可用性與期限以 Render 建立畫面為準。本專案不會自動選擇付費方案。未設定 DATABASE_URL 時，Render 上會拒絕啟動，避免把正式訂單寫入暫存磁碟。

## 檔案

- `server.mjs`：HTTP 伺服器、訂单 API、PostgreSQL 與本機儲存。
- `menu.mjs`：菜單、價格、訂單驗證。
- `public/`：網頁、樣式、前端互動。
- `test/order.test.mjs`：計價與輸入驗證測試。
- `render.yaml`：部署配置。

## API

- GET `/api/menu` — 菜單。
- POST `/api/orders` — `{name, phone, note, requestId, items:[{id,quantity}]}`。
- GET `/api/orders/:id` — 使用完整隨機訂單編號查詢。
- GET `/health` — 服務與資料庫健康檢查。

正式營運前需依店家需求加入營業時間、出餐管理、登入及訂單存取控制與防濫用限制；訂單編號目前是查詢憑證，請妥善保管。

## 圖片來源
招牌漢堡照片：Giorgi Iremadze / Unsplash，https://unsplash.com/photos/burger-with-lettuce-and-tomato-5ZR4DxAG3RQ 。圖片以 Unsplash 遠端網址載入，菜單品項為示範資料。
