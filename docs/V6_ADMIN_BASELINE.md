# V6 Admin Next Baseline

Status: v0.2 定案（2026-10-07，尚未開工）
Repo: `ksp4022-ko/shuttle-burst-dynamic`（frontend，新後台）／`ksp4022-ko/badminton-signup`（Worker，原則上不改）

---

## 0. 定位

- 新版 V6 管理後台，與舊 Worker `/admin`（`renderAdminPage()`）**平行運行**；舊 `/admin` 不動。
- 路由：`/v10CtlPanel`（定案；網址大小寫有區分），放在 GitHub Pages，沿用 V9（OnCourt）的 React / TanStack Start 架構。
- 目標：舊 `/admin` 的功能**全部搬進來**，**唯一不做：Google Sheet 資料匯入**（dry-run / apply）。
- 只換介面，不改計費規則、不改 D1 結構、不新增商業規則；所有數字以 Worker 回傳為準，前端不自行計算。

## 1. 已定案決策

| # | 項目 | 決定 |
|---|---|---|
| D1 | 主要裝置 | 手機優先（iPhone Safari 為最終驗收） |
| D2 | 主導覽 | 底部固定 **dock**，4 個分頁沿用舊 4 大功能 |
| D3 | 預設分頁 | 開啟後停在「① 當次聚會」，自動選今天或下一場聚會 |
| D4 | 第一階段範圍 | 唯讀，先做 ① 當次聚會、③ 賽季管理 |
| D5 | 功能範圍 | V6 後台全部功能，Google Sheet 匯入除外 |
| D6 | 路由 | `/v10CtlPanel` |
| D7 | 測試路由 | 不另開，只有 `/v10CtlPanel` 一個 |

## 2. 資料與驗證

- API base：`https://badminton-signup-v6-alpha.badminton-signup-v6-worker.workers.dev/api/v6-alpha`
- 驗證：每個請求帶 `x-admin-password` 標頭；密碼由使用者在登入頁輸入，**不寫入程式、不放網址、不寫 localStorage**，只存在當下分頁記憶體（關閉分頁需重新登入）。
- 登入：`POST /admin/login`（只驗證，不寫資料）；場地列表：`GET /admin/sites`。
- CORS：Worker 只允許 `GET / POST / OPTIONS`。`DELETE /admin/sites/:site/seasons/:id`（刪除賽季）目前會被擋，做到該功能時再請 Codex 改 Worker 並部署。
- 寫入測試一律使用「測試聚會」（`eventKind = test`），不在正式聚會上試寫入。

## 3. 畫面結構（手機）

```
┌──────────────────────────────┐
│ Header：場地切換（康軒／日安）│
│         目前聚會名稱 ▾        │
├──────────────────────────────┤
│                              │
│   分頁內容（卡片＋可展開區塊）│
│                              │
├──────────────────────────────┤
│ ① 當次  ② 聚會  ③ 賽季  ④ 系統│ ← dock（固定底部，避開 iPhone 手勢區）
└──────────────────────────────┘
```

- 風格：參考 `docs/V9_BASELINE.md` 的配色、圓角卡片與字體；但以資訊密度與易讀為主，少動畫、不用大型插圖。
- 狀態色：綠＝已付／正式、橘＝未付／候補、灰＝請假／取消、紅＝錯誤或危險操作。
- 名單與付款以 compact row 呈現（手機一行一人）。
- 寫入操作（第二階段起）：按鈕 → 確認對話框 → 執行 → toast 結果 → 自動重新讀取。刪除類操作用紅色並二次確認。

## 4. 功能對照（舊 /admin → 新 dock 分頁）

API 路徑省略前綴 `/api/v6-alpha`；`:site` = 場地 ID。

### ① 當次聚會

| 功能 | 讀 / 寫 | API |
|---|---|---|
| 聚會切換、聚會列表 | 讀 | GET `/admin/sites/:site/dashboard?status=all&limit=50` |
| 人數摘要（正式／候補／請假／未付款）、完整名單 | 讀 | GET `/admin/events/:id/overview` |
| 臨打收費清單 | 讀 | 同 overview（payments） |
| 本場實際支出、當天損益 | 讀 | 同 overview（usage、finance） |
| 臨打收費：切換已收／未收 | 寫 | POST `/admin/temp-payments/:id/status` |
| 本場實際支出：儲存 | 寫 | POST `/admin/events/:id/usage` |
| 名單代操作：季打請假／消假、取消臨打 | 寫 | POST `/events/:id/fixed-signups/:sid/leave`、`/return`、`/events/:id/temp-signups/:sid/cancel`（前台公開 API，body 帶 `reason: "admin_action"`） |
| 聚會狀態：關閉／重新開放 | 寫 | POST `/admin/events/:id/close`、`/reopen` |
| LINE 推送名單 | 寫 | POST `/admin/events/:id/line-roster-push` |

### ② 聚會管理

| 功能 | 讀 / 寫 | API |
|---|---|---|
| 聚會列表（日期、名稱、正式/測試、狀態、人數），點擊跳到 ① | 讀 | GET `dashboard` |
| 開立新聚會（含賽季／群組預設值） | 寫 | POST `/admin/sites/:site/events` |
| 修改目前聚會 | 寫 | POST `/admin/events/:id/update` |
| 同步季打成員到聚會 | 寫 | POST `/admin/events/:id/sync-fixed` |
| 刪除建錯聚會 | 寫 | POST `/admin/events/:id/delete` |

### ③ 賽季管理

| 功能 | 讀 / 寫 | API（前綴 `/admin/sites/:site`） |
|---|---|---|
| 賽季／群組選擇、期初設定內容、結算試算 | 讀 | GET `/season-management?seasonId&groupId` |
| 群組成員 | 讀 | GET `/groups/:gid?seasonId` |
| 季繳明細 | 讀 | GET `/season-payments/audit?seasonId&groupId` |
| 退費抵扣紀錄 | 讀 | GET `/refund-credits/audit?seasonId&groupId` |
| 退費調整試算 | 讀 | GET `/refund-adjustments/preview` |
| 季打確認：設定、意願、名單建議 | 讀 | GET `/season-confirm`、`/season-confirm/:cid/intents`、`/season-confirm/:cid/roster-draft` |
| 賽季新增／修改 | 寫 | POST `/seasons` |
| 賽季刪除 | 寫 | DELETE `/seasons/:id`（**需 Worker CORS 修改**） |
| 期初費用試算／儲存 | 寫 | POST `/season-settings/preview`、`/season-settings` |
| 群組建立／改名／停用、成員編輯 | 寫 | POST `/groups`、`/groups/:gid`、`/groups/:gid/members` |
| 季打確認：儲存設定、代登、核准／婉拒、定案 | 寫 | POST `/season-confirm`、`/:cid/proxy`、`/:cid/intents/:iid/review`、`/:cid/finalize` |
| 產生季繳、切換季繳付款狀態 | 寫 | POST `/season-payments/generate`；POST `/admin/season-payments/:id/status`（無 `:site` 前綴） |
| 退費調整新增／取消 | 寫 | POST `/refund-adjustments`、`/refund-adjustments/:id/cancel` |
| 產生下季抵扣、儲存季末損益 | 寫 | POST `/refund-credits/generate`、`/season-profit-loss/save` |

### ④ 系統設定

| 功能 | 讀 / 寫 | API |
|---|---|---|
| 場地切換、登出、版本資訊 | 讀 | GET `/admin/sites` |
| LINE 認領列表 | 讀 | GET `/admin/sites/:site/line-claims` |
| 場地設定 | 寫 | POST `/admin/sites/:site/settings` |
| 管理員密碼變更 | 寫 | POST `/admin/password` |
| 通知設定（LINE / Discord）、測試發送 | 寫 | POST `/admin/sites/:site/notification-settings`、`/line-test`、`/discord-test` |
| LINE 認領解除綁定 | 寫 | POST `/admin/sites/:site/line-claims/:lineId/unlink` |
| ~~Google Sheet 匯入~~ | — | **不做** |

## 5. 階段與優先順序

| 階段 | 內容 | 驗收 |
|---|---|---|
| P0 | 骨架：`/v10CtlPanel` 路由、登入頁、Header、dock、API client | 手機截圖 |
| P1 | 唯讀：① 當次聚會、③ 賽季管理 | 手機截圖＋與舊 /admin 數字比對 |
| P2 | 唯讀：② 聚會管理、④ 系統設定 | 手機截圖 |
| P3 | 寫入：① 當次聚會（收費、支出、代操作、開關、LINE 推送） | 在測試聚會實測 |
| P4 | 寫入：② 聚會管理 | 在測試聚會實測 |
| P5 | 寫入：③ 賽季管理（刪除賽季需先改 Worker CORS） | 逐項確認 |
| P6 | 寫入：④ 系統設定 | 逐項確認 |

每個階段都截手機圖給使用者確認後，才進入下一階段。

進度（2026-10-08）：
- P0 + P1 已部署，使用者以正式資料核對通過。
- 使用者決定先做 P3（P2 延後）。P3 已部署，經兩輪 Codex 審查修正（寫入鎖、序號、逾時與結果不明處理）。
- P2 + P4 合併進行：② 聚會管理（列表＋開立／修改／同步／刪除）、④ 系統設定（唯讀）。所有寫入共用 src/lib/v6admin-write.ts 的 runWrite 流程。
- P2+P4 已部署並經使用者確認。
- P6：④ 系統設定寫入（場地設定、改管理密碼、LINE/Discord 通知設定與測試、解除 LINE 認領）。
- 剩餘：P5（③ 賽季管理寫入），預計拆成 P5-a 季繳付款＋退費調整、P5-b 期初設定／群組／產生季繳／季末結算、P5-c 季打確認＋刪除賽季（需 Worker CORS 開 DELETE）。

## 6. 隔離與安全規則

- 程式放在 `src/components/v6admin/`、`src/lib/v6admin-*`；路由檔 `src/routes/v10CtlPanel.tsx`。
- 不 import V8 / V9 的 UI 元件，V8 / V9 也不 import v6admin 程式；可參考 V9 的色票與樣式，但另外複製一份。
- 新後台自有 storage key 使用 `v10CtlPanel:` 前綴；只存非敏感偏好（例如上次選的場地），不存密碼。
- 共用檔（`__root.tsx`、`routeTree.gen.ts`、workflow）若需修改，報告中標示「影響共用檔」，並做 `/v9`、`/v8` 迴歸檢查。
- `/v9` 正式頁面不得受影響；不 force push、不 hard reset。
- Worker 原則上不改；若必須改，先跑 `cd worker && npm run check`，改完提供 Codex 一鍵部署指令（目前編號到 V6-025）。

## 7. 驗證

- `npx tsc --noEmit --pretty false`、`npm run build`、`git diff --check`
- 手機尺寸截圖（瀏覽器自動化）每階段提供；真實 iPhone Safari 為最終驗收。

## 8. 待辦（使用者提出，尚未實作）

| # | 日期 | 內容 | 狀態 |
|---|---|---|---|
| T-01 | 2026-10-08 | 頁首「V6 控制台」改為「V10 控制台」（含登入頁標題與瀏覽器分頁標題） | 待開工 |
| T-02 | 2026-10-08 | 各區塊標題可點擊收合／展開：① 當次聚會的名單、臨打收費、本場支出、當天損益、聚會狀態等卡片（③ 賽季已是收合式） | 待開工 |
| T-03 | 2026-10-08 | 驗收待補：④ LINE 認領（季打／臨打分區）、LINE 通知設定修改 | 待使用者實測 |
| T-04 | 2026-10-08 | 舊密碼仍可登入：如要停用，請 Codex 刪除 Worker secret ADMIN_PASSWORD / ADMIN_PASSWORD_HASH（不改程式） | 待使用者決定 |

P6（④ 系統設定寫入）、頁面左右鎖定、賽季預設修正、Worker V6-026（臨打成員清單）已部署；預設賽季、左右鎖定、場地設定、測試發送已驗收。
