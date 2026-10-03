# V9 Shuttle Baseline v0.1

Status: 初版 baseline v0.3（2026-10-03，B1–B3、D1–D2 已決定）
Repo: `ksp4022-ko/shuttle-burst-dynamic`（frontend）／`ksp4022-ko/badminton-signup`（Worker，不改）

---

## 1. 定位

V9 Shuttle：保留 V8 的功能與品牌角色，拿掉大型劇場式素材，改成
「可愛龍虎品牌 ＋ 極簡圓角單頁動態報名介面」。

V9 不是「把 V8 簡化一點」，而是新的 UI philosophy：

可愛龍虎品牌 ＋ 極簡圓角資訊 UI ＋ 輕量動態 ＋ 快速載入 ＋ 單頁完成主要操作

| | V8 | V9 |
|---|---|---|
| 調性 | 劇場感、龍虎大視覺 | 實用、輕量 |
| 素材 | 大量圖片：紅日、海浪、卷軸、繪馬、掛牌、Intro | CSS / HTML / SVG / 小 icon |
| 吉祥物 | 主視覺 | 只作品牌識別 |
| 頁面 | OPEN → ACTIVE 多階段 | 單頁、快速首屏 |

## 2. 視覺主題

- 單頁動態、Mobile-first、極簡快速實用
- 圓角卡片＋圓角表格
- 可愛龍虎貼紙風、粗黑外框、大色塊
- 白色／淺米背景
- 狀態色少量使用：橘、綠、藍、紅
- 不使用：浮世繪大背景、大量大型裝飾圖片

## 3. 頁面結構

1. **Header**：V9 Shuttle Logo、站點名稱、使用者名稱、LINE 登入狀態、聚會切換
2. **聚會摘要卡**：日期／時間／球種／費用／場地／人數（例：10/08、22:00–24:00、MS-101、$220、2場、14 / 22）。全部 CSS 圓角欄位，不用雲框圖。
3. **我的狀態卡**：季打／臨打、正取／備取、已報／尚未報名、已請假、本次費用、排位。一律小型 badge，不用大型身份牌。
4. **主操作區**：報名、告假、消假、代報、代退、帳單。CSS 圓角按鈕，不做 PNG。
5. **名單區**：Tab「正取 14／備取 3／請假 2」切換。寬版用表格 `# | 名稱 | 身分 | 狀態`；手機用 compact rounded row / card。
6. **帳單區**：只顯示 backend 回傳結果，V9 不自行計算。臨打費、歷史未收可展開明細。

```
Sammy 帳單
S4 季費              $2410
上季請假抵扣          -$760
臨打費                 $660
歷史未收               $220
----------------------------
本次應繳               $2530
狀態                   未繳
```

## 4. 圖片資產

MVP 必要（共 5 項）：
1. PWA Icon（可愛龍＋虎＋羽球，貼紙風）
2. V9 Shuttle Logo（由現有可愛龍虎風格延伸）
3. 龍單角色（小 mascot，提示／空狀態）
4. 虎單角色（小 mascot）
5. 龍虎雙人小圖（首頁／Welcome／空狀態）

可選（非 MVP）：尚無聚會、尚無帳單、登入提示、Loading、成功、錯誤。

V9 不重做的 V8 素材：紅日、四個雲框、山景、金箔、大型海浪背景、OPEN Dragon Rig、ACTIVE 大型龍虎、龍爪、羽球袋、繪馬、卷軸、大型名單板、名單浮標、身份牌、狀態章 PNG、大量 CTA 貼圖、Rope ornament、大型 Intro 視覺、其他裝飾性圖片。

## 5. 動畫

保留（輕量 CSS）：卡片 fade/slide、Tab transition、Button press、報名成功 bounce、數字 transition、小龍虎輕微 float、Toast、Modal transition。
需尊重 `prefers-reduced-motion`。

避免：大型影片 Intro、多圖層劇場動畫、image sequence、重型圖片動畫。

## 6. 技術原則

- Mobile-first、Single-page、Fast first paint
- Minimal image assets、CSS/SVG first
- Backend remains source of truth
- Reuse existing V8/V6 business APIs
- V9 只改 frontend presentation，除非明確要求

不重新發明（直接共用）：聚會資料、LINE 身分、報名、季打、臨打排序、請假、消假、代報、代退、帳單 backend、名單資料、聚會切換。

---

## 7. 既有 API 對照（依 repo 現況，2026-10-03）

API base：`…/api/v8-shuttle`（`src/lib/database-alpha.ts`）

| V9 功能 | 既有 function / endpoint |
|---|---|
| 聚會列表／切換 | `listAlphaEvents()` |
| 名單（正取／備取／請假） | `getAlphaRoster()` → `GET /events/:id/roster` |
| 報名（本人） | `createAlphaTempSignup(eventId, name, token, { selfSignup: true })` |
| 代報 | `createAlphaTempSignup(eventId, name, token)` |
| 代退 | `fetchV8CancellableTempSignups()` + `cancelAlphaTempSignup()` |
| 告假 | `fixedAlphaLeave()` |
| 消假 | `fixedAlphaReturn()` |
| 季打進度 | `fetchV8SeasonProgress()` |
| 個人帳單（正式 V8 使用中） | `useV8PersonalBillingTest()` → `fetchV8PersonalBilling()` → `GET /me/billing` |
| LINE 身分 | `src/lib/v8-line-auth.ts`、`v8-line-auth-storage.ts`（token 共用） |

帳單欄位對照（`/me/billing`，只顯示、不計算）：

| 畫面 | 欄位 |
|---|---|
| 季費 | `seasonPaymentHistory.items[].baseSeasonFee` |
| 上季請假抵扣 | `refundCreditTotal`（明細：`refundSources[]`） |
| 臨打費 | `totals.currentGuestOutstandingTotal`（明細：`currentGuestItems[]`） |
| 歷史未收 | `totals.otherGuestOutstandingTotal`（明細：`guestLedger`，分頁） |
| 本次應繳 | `totals.totalAmountDue` |

## 8. 已決定事項

**B1. API 路由判斷 — 決定：加入 v9 → V8 API**
`configuredFrontendVersion()` 加入 `v9`，`/v9` 走 `/api/v8-shuttle`。
屬共用檔案修改，不改變 /v8 行為；回報需標示並附 /v8 regression。

**B2. LINE 登入回跳 — 決定：修改 Worker 允許 /v9**
`badminton-signup` 的 `normalizeV8FrontendReturnUrl` 放寬為同源的 `/v8` 或 `/v9` 路徑。
使用者已明確授權此 backend 修改；Worker 需重新部署。LINE token 與 V8 共用。

**B3. 帳單 — 決定：完全沿用正式 V8 帳單，只改版面**
正式 `/v8` 已透過 `V8ActivePage` → `V8BillingTestPanel` → `useV8PersonalBillingTest()` → `GET /me/billing` 顯示完整帳單。
V9 直接共用同一個 hook 與資料，只重做 UI；不新增計算、不改 API。
付款狀態沿用 backend 回傳的 `status`（paid / unpaid），帳務由 V6 後台處理。

**D1. 季打確認 gate — 決定：MVP 先不做**
V9 第一版不含 `V8SeasonConfirmGate`；季打確認仍在 V8 完成。

**D2. Route — 決定：/v9 先當開發環境**
`/v9`、`/v9/kangxuan`、`/v9/rian`。上線前顯示「V9 PREVIEW」badge、可直接修改；
正式上線後再比照 V8 建立 `/v9test` 並鎖定 `/v9`。

**其他規則**
- `/v9` 使用正式後端，報名／請假／代報皆為真實操作。
- V9 必須與 legacy UI 及 V8 tuning panel 完全隔離；不得 import V8 劇場元件。
- `CLAUDE.md` 目前為 V8 規則，需新增 V9 段落。
- session key prefix 用 `v9:`；LINE token 與 V8 共用。

## 9. MVP

完成：Header、聚會摘要、我的狀態、報名／告假／消假、代報／代退、正取／備取／請假名單、聚會切換、LINE 身分、帳單入口、PWA Icon、龍虎小 Logo。

先不做：季打確認 gate、Intro、大型背景、複雜動畫、大量角色狀態圖、大量裝飾。

## 10. 開發順序

| Phase | 內容 |
|---|---|
| 1 | 建立 `/v9` route（B1） |
| 2 | 接 event / LINE / roster 資料（B2，含 Worker returnTo） |
| 3 | 聚會摘要卡＋我的狀態＋主操作區 |
| 4 | 名單 Tab |
| 5 | 帳單（沿用 V8 `useV8PersonalBillingTest`，只改版面） |
| 6 | PWA manifest＋icon |
| 7 | 小動畫與視覺 refinement |

驗收：`npx tsc --noEmit --pretty false`、`npm run build`、`git diff --check`、`/v8` regression smoke；real iPhone Safari 為最終驗收。
