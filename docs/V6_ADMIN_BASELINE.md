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
- P5-a（③ 季繳 標記已收／取消已收、調整抵扣 補列／排除／取消調整）＋ T-01、T-02、iPhone 縮放卡住修正：已部署並經使用者 iPhone 驗收（2026-10-08）。
- P5-b（期初設定試算/儲存、群組新增/改名/停用、季打成員、產生下季抵扣、建立季繳收費單、儲存季末損益）已部署 72de344，待 iPhone 驗收。
- 剩餘：P5-c（原拆分： P5-a 季繳付款＋退費調整、P5-b 期初設定／群組／產生季繳／季末結算、P5-c 季打確認＋刪除賽季（需 Worker CORS 開 DELETE））。

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
| T-01 | 2026-10-08 | 頁首「V6 控制台」改為「V10 控制台」（含登入頁標題與瀏覽器分頁標題） | 已完成並驗收 |
| T-02 | 2026-10-08 | 各區塊標題可點擊收合／展開：① 當次聚會的名單、臨打收費、本場支出、當天損益、聚會狀態等卡片（③ 賽季已是收合式） | 已完成並驗收 |
| T-03 | 2026-10-08 | 驗收待補：④ LINE 認領（季打／臨打分區）、LINE 通知設定修改 | 已驗收 |
| T-04 | 2026-10-08 | 舊密碼仍可登入：如要停用，請 Codex 刪除 Worker secret ADMIN_PASSWORD / ADMIN_PASSWORD_HASH（不改程式） | 已完成（使用者 2026-10-08 確認） |
| T-05 | 2026-10-09 | ④ LINE 認領改為三欄對照表：名單名（季打名）｜自訂稱呼｜LINE 名稱，一眼對齊；臨打同樣三欄（名單名＝報名時填的名字） | 已完成並部署 18689d6（欄位：名單顯示｜季打名｜LINE 名稱），已驗收 |
| T-06 | 2026-10-09 | P8 收款頁：同一人同時有未繳與待退款時（例：阿富 2026 第3季季費 $2,470、第3季請假退費待退 $1,520），「收款」與「已退款」是兩個分開的按鈕，操作不直覺，還要自己算差額（應淨收 $950）。方案（2026-10-09 使用者確認第 1 點：要有明細）：帳單頁合併成一張「結算」卡，逐筆列出明細——應收各筆（賽季／日期、金額）與待退各筆（來源賽季、請假 N 次 × 單價、−金額），各自可勾選；底部小計「應收 $X」「待退 −$Y」＋「淨收 $Z／淨退 $Z」；一顆按鈕「結清 淨收 $Z」依序寫入（季費已收、退費已退款，沿用現有 API，不改 Worker；失敗即停並顯示哪些已完成）；確認視窗同樣列明細與「實收現金 $Z」。只有應收或只有待退的人維持現狀。名單（使用者選 A）：同時有應收與待退的人大字「淨收 $Z」（或「淨退 $Z」），下方小字「應收 $X・待退 $Y」 | 方案已定案，待「開工」（未改程式） |
| T-07 | 2026-10-09 | ③ 季末結算「請假退費總額」日安顯示 $0：目前取「本季已產生的退費抵扣」，日安不產生抵扣所以永遠 0。使用者要求：康軒、日安一樣計算請假退費金額，只有損益扣不扣（開關）不同。方案草案：請假退費總額改為 本季各場（已計算場次）季打請假人次 × 每場季費基準（Worker 結算已回傳，前端直接用，不改 Worker）；康軒若已產生抵扣，另列「已產生抵扣 $X」供對照 | Pending（方案待確認，未改程式） |

P6（④ 系統設定寫入）、頁面左右鎖定、賽季預設修正、Worker V6-026（臨打成員清單）已部署；預設賽季、左右鎖定、場地設定、測試發送已驗收。

## 9. P7 一站式收款（已部署：Worker V6-027 e0e0ab4，Cloudflare version 1e74aa4d-658f-4ce0-b9e5-8460706ed3fe；前端 5d93930；iPhone 驗收 1–5 通過 2026-10-08）

問題：同一位球員的未繳項目分散在 ③（各賽季季繳）與 ①（各場臨打），收一次款要切換三個以上地方。

已定案（2026-10-08）：
| # | 項目 | 決定 |
|---|---|---|
| C1 | 入口 | 新增第 5 個 dock「收款」 |
| C2 | 收款方式 | 列出所有未繳項目（本季季費、臨打費、歷史未收），預設全選、顯示合計，按一次「收款 $合計」全部標記已收；可取消勾選只收部分 |
| C3 | Worker | 同意只加唯讀 API（V6-027），沿用 V9-021 的帳單計算，不改計費規則、不改 D1 結構 |

Worker V6-027（唯讀，x-admin-password 驗證）：
- GET `/admin/sites/:site/billing-people`：可收款的人＝有 LINE 身分的球員（同 V9-021 名單）＋未認領 LINE 的季打成員。
- GET `/admin/sites/:site/billing-people/:id/billing`：沿用 `respondV8Billing` 的結果（季繳含退費抵扣明細、臨打含聚會日期、各項 paymentId、合計）。未認領成員只有季繳。

前端（「收款」分頁）：
- 搜尋／選擇球員 → 帳單（與 V9 帳單同樣的項目與金額，數字以 Worker 為準）。
- 收款寫入沿用現有 API：臨打 POST `/admin/temp-payments/:id/status`、季繳 POST `/admin/season-payments/:id/status`，在寫入鎖內逐筆送出。
- 中途失敗：停在失敗那筆，畫面標示哪些已收、哪些未收，重新讀取帳單；結果不明（逾時等）不自動重送。
- 收完重新讀取帳單，其他分頁同步更新（dataVersion）。

P7 追加（C4 已實作並部署，待 iPhone 驗收）：
- C4：「已繳紀錄」每筆右側加按鈕「fix」（外觀是按鈕：有框線、可點的樣式，與綠色「已收」膠囊明顯不同），點後確認「改回未收」再送出（確認後送出；季費 POST season-payments/:id/status unpaid，臨打 POST temp-payments/:id/status unpaid，與 ①③ 相同 API）。
- V6-028（Worker，commit ffbbb94，已部署 Cloudflare version 2d5cce6e-7d88-437d-b034-f13b50981403，待千賀收款實測）：季繳／臨打「改狀態」API 先把網址中的付款 ID 解碼再查詢。原因：Google Sheet 匯入的付款 ID 含中文，未解碼導致 SEASON_PAYMENT_NOT_FOUND（2026-10-09 千賀 2026 第3季）。
- V6-030（2026-10-09）：③ 讀取常逾時。Worker e55bcaa 把季繳／退費抵扣報表與季末結算的逐筆查詢改為同時查（結果逐字相同，本機快約 2 倍），已部署 Cloudflare 94b68261；前端 f461a19：各區塊各自顯示、失敗單區重試、季報表逾時 45 秒（已部署）。

## 10. P8 不續打季打的待退款（已實作並部署，待 iPhone 驗收）

問題（2026-10-09）：2026 第3季季打、第4季沒續打的人（例：蘇軾）有請假退費，產生下季抵扣時會建立「第3季→第4季」抵扣，但他沒有第4季季繳可抵，抵扣永遠停在「未使用」，收款、帳單都看不到；欠款的人（阿富）則照常顯示。

方案草案：
- 判定（Worker 自動比對前後季）：抵扣狀態「未使用」、且此人在目標賽季沒有季繳收費單 ⇒「待退款」，金額＝抵扣金額（沿用 Worker 已算好的請假次數 × 單價）。
- V10 收款：名單照樣列出此人，餘額顯示負數「待退 $X」（綠字）；點進去看明細（來源賽季、請假 N 次 × 單價），像收款一樣勾選後按「已退款 $X」沖銷；已退款紀錄有 fix 可改回。
- V10 ③ 退費抵扣區：此類抵扣標「待退款」，可同樣按「已退款」。
- V9 球員帳單：顯示「待退款 $X」，本次應繳不受影響。
- 紀錄方式（不改 D1 結構）：沿用抵扣狀態「已使用」＋備註「現金退款」＋時間；fix 改回「未使用」。
- 需改 Worker（V6-031）：收款名單／帳單加「待退款」項目（讀取）、新增「標記已退款／改回」寫入 API。不改計費金額的算法。
- 季末損益（2026-10-09 定案）：退款不另扣損益（請假本來就不計收入）。結算改顯示：季打收入（全額）＝（出席＋請假）×每場季費基準、請假退費總額＝本季實際抵扣合計；V10 ③ 開關「扣除請假退費：是／否」即時切換，瀏覽器記住每場地上次選擇（預設康軒是、日安否，日安請假不退費）；儲存本季損益存畫面目前結果並註明。Worker 結算多回每場請假人數與本季請假退費總額（只加欄位）。

實作（2026-10-09）：
- Worker V6-031（badminton-signup 58577ab，已部署 Cloudflare version 421d8306-85e5-43ef-9895-7f9816795dfb，2026-10-09）：
  - 待退款判定：抵扣「未使用」、有金額、目標賽季該群組已有名單但此人不在名單、且此人在目標賽季沒有（未取消的）季繳。
  - POST /admin/refund-credits/:id/cash-refund {action:"refund"|"undo"}：已退款＝status used＋note cash_refund＋used_at；改回＝active、note cash_refund_undone；都寫 admin audit。
  - billing-people 每人多 refundDue；個人帳單與 /me/billing 多 refundItems（due／refunded）；退費抵扣報表多 refundDue、cashRefunded。
  - 重跑「產生下季抵扣」時，來源賽季有現金退款紀錄的抵扣不被重算覆蓋。
  - 結算多 fixedLeaveIncome、leaveRefundTotal（每場明細多 fixedLeaveCount）；儲存損益可帶 deductLeaveRefund（不帶＝舊 /admin 行為不變），note 記錄是否扣除。
- V10 收款：名單「只看有未繳／待退款的人」，待退顯示藍字「待退 $X」；帳單頁「待退款」卡勾選後按「已退款 $X」→ 確認 → 逐筆送出；已退款列在已繳紀錄（藍色「已退款」＋ fix 改回待退款）。
- V10 ③：退費抵扣列標「待退款」／「已退款」（操作在收款頁）；季末結算加「扣除請假退費 是／否」，顯示季打收入（全額）、請假退費總額，總收入與損益即時換算，儲存時帶目前選擇。Worker 未部署前不顯示開關，畫面維持舊樣。
