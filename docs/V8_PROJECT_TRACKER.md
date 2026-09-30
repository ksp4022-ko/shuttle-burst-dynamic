# V8 Project Tracker

Last reviewed: 2026-09-29

## Status

IN PROGRESS
= currently fixing

CODE PASS / VERIFY
= code/deploy done, real-device or visual acceptance pending

PENDING
= approved backlog

DEFERRED
= intentionally postponed

PAUSED
= waiting for dependency/decision

CLOSED
= completed and accepted

---

## Runtime Baseline

74313e0
ci: enforce TypeScript check before deploy

Documentation commit 不等於 runtime baseline 變更。

---

# P0

## V8TEST ENVIRONMENT

Status:
REAL DEVICE PASS（baseline）

Commit：

ca1bc53
feat(v8test): add isolated v8 test routes

Route family：

- production（LOCKED）：/v8/、/v8/kangxuan/、/v8/rian/
- test：/v8test/、/v8test/kangxuan/、/v8test/rian/
- 同一份 app / 同一個 Worker + D1；右上角「V8 TEST」badge 只在 /v8test。
- 規則與 storage 決策見 V8_SYSTEM_DESIGN.md「V8TEST Route Family」。

V8TEST URL：

https://ksp4022-ko.github.io/shuttle-burst-dynamic/v8test/
https://ksp4022-ko.github.io/shuttle-burst-dynamic/v8test/kangxuan/
https://ksp4022-ko.github.io/shuttle-burst-dynamic/v8test/rian/

Production /v8 locked：

- 對 7996e1d 做 regression：/v8、/v8/kangxuan、/v8/rian 的 OPEN + ACTIVE，
  390 / 1280 凍結畫面 pixel diff = 0（唯一差異是倒數條時間點，base 對 base 也會出現）。
- cold load / reload / CTA / Quick Pick current + different / ACTIVE switch / legacy UI / 430 cap 行為一致。
- 唯一會影響 /v8 的共用程式變更：
  LINE 回到 /v8 時，只有在存的 return URL 是 /v8test 才轉回 /v8test。
  （純 production 登入不會存 /v8test URL，行為不變。）

Verification：

- tsc PASS
- build PASS
- CI/deploy PASS（run #314）
- Local Chromium（390×844、1280）：/v8test 全流程 PASS
- WebKit：環境沒有，未測。
- real iPhone Safari：PASS（user 確認 /v8test/kangxuan/ baseline：
  cold load、reload、CTA → ACTIVE、Quick Pick current/different、ACTIVE switch、
  no legacy UI、V8 TEST badge）

---

## V8-AUTO-ENTER-COUNTDOWN

Status:
CLOSED（2026-09-30，production /v8 real iPhone Safari PASS，user 確認）

Promotion（Cfm）：

4c91ddd
fix(v8): stop open-only countdown once active owns the screen

- 拿掉 v8test 例外：所有 route 都用 preview && !v8MeetupConfirmed。
- CI/deploy PASS（run #324）。
- Local /v8：auto-enter 1 次、ACTIVE 32s 無重啟；CTA（含動畫）、Quick Pick current / different、ACTIVE switch、legacy 0、無錯誤。/v8test smoke 不變。
- production real iPhone Safari：PASS（user 確認）→ CLOSED。

Commit：

5ba6b66
fix(v8test): stop open-only countdown once active owns the screen

Root cause（confirmed）：

- V8 進 ACTIVE 只設 v8MeetupConfirmed=true，flow.phase 刻意維持 "meetup-preview"。
- countdown effect 與 pendingSwitch auto-fill 只檢查 preview，
  所以 ACTIVE 裡倒數會重啟，每 N 秒再呼叫 enterPreviewSelection。
  （本機 /v8：32s 內 auto-enter 觸發 4 次。）

Fix：

- /v8test：OPEN-only effects 改看 openOnlyEffectsActive = preview && !v8MeetupConfirmed。
- /v8：維持原本 preview gate，待 Cfm 後 promote。
- 不改 flow.phase、Quick Pick、storage、P-021。

Verification：

- tsc / build / CI（run #321）PASS
- Local Chromium /v8test：OPEN 倒數條正常遞減 → auto-enter 1 次 → ACTIVE 32s 無重啟、無重複 enter、無 OPEN UI；
  CTA（含 enter 動畫）、Quick Pick current / different、ACTIVE switch、legacy UI 0 PASS
- /v8 smoke：行為不變（仍保留原本重啟現象，符合 LOCKED）
- real iPhone Safari：/v8test PASS（user 確認）

Promotion 到 /v8 需要 user 回覆 Cfm / 確認；promote 並驗證後才 CLOSED。

---

## V8TEST-STORAGE-ISOLATION

Status:
CLOSED（user 確認 real iPhone PASS）

Commit：

dac033c
fix(v8test): isolate tuning storage

- MUST ISOLATE（/v8test 用 "v8test:<key>"，production key 不變）：
  v8-preview-controls-v4（+ :migrations）、
  v8-red-sun-autofill-experiment-v1、v8-identity-envelope-experiment-v1
- 第一次在 /v8test 讀取時從 production seed；之後各自獨立；
  只刪 v8test key → 下次從目前 production 重新 seed。
- SHARED：LINE auth、handoff lab（V8 無法編輯）、tutorial seen。
- 驗證：tsc / build / CI（run #319）PASS；
  module 隔離測試 16/16、瀏覽器隔離測試 13/13（含真的調整面板編輯）；
  /v8 與 /v8test smoke（CTA、Quick Pick、ACTIVE switch、legacy UI）PASS。
- real iPhone Safari：PASS（user 確認）。

---

## V8-OPEN-STARTUP

Status:
CLOSED

User 已確認 real iPhone Safari：390bae2 之後 OPEN 可穩定啟動。

Commit：

390bae2
fix(v8): recover open startup flow

Issue：

Real iPhone Safari：/v8/kangxuan/ cold load 停在 loading cover，
OPEN 無法使用，reload 無效；發生在任何 Quick Pick 操作之前。
P-021 已 rollback（920389e）後仍發生，所以不是 P-021 image gate 問題。

Root cause（source + local reproduction）：

- OPEN 要離開 phase "loading-particles"，
  必須等 use-homepage-flow.ts 的 startup effect 依序完成：
  listAlphaEvents → getAlphaRoster。
- alphaFetch 沒有 timeout。
  request 一直不回應時，phase 永遠停在 loading-particles，
  不會進 load-error。
- V8LoadingCover 在 20s 上限後放行，
  底下只剩空白頁（只有 Replay Intro），無法操作；reload 同樣卡住。
- request 若是「失敗」（500 / network error），約 1s 內就會顯示既有的
  「database-alpha 讀取失敗 / 重新整理」畫面，不是這次症狀。
- 這條 startup path（flow startup effect、database-alpha、
  V8LoadingCover、V8IntroVideo）從 e9563cc 到 08f7066 都沒有改動。
  meetup picker / quick-pick commits（3150080、79e6475、9a16515、a1f61a3）
  都不在這條 path 上。
  → 找不到 frontend 的 first bad commit。
- 尚未確認：為什麼這台 iPhone 上的 startup request 不回應。
  需要 real-device Web Inspector 的 Network 記錄。

Fix：

- events / 第一份 roster 的 startup request 各自 8s timeout，
  換新 request 重試 1 次（間隔 0.8s）。
- 仍失敗 → 進既有的 load-error 畫面（連線逾時，請重新整理。）。
  worst case 約 17s，在 cover 的 20s 上限之內。
- Quick Pick 維持啟用（audit 證實與 startup 無因果關係）。

Verification：

- tsc PASS
- build PASS
- CI/deploy PASS（run #312）
- Local Chromium（iPhone-size）：
  - healthy
  - 第一次 events / roster 不回應 → 約 9s 後重試成功，進入 OPEN
  - 一直不回應 → 約 17s 顯示 timeout 錯誤畫面
  - 500 → 錯誤畫面
  - /v8/、/v8/kangxuan/、/v8/rian/
  - quick pick current / different
  - 進入戰局 CTA
  - ACTIVE switch
  - legacy UI frames = 0
  - desktop 430 置中
- WebKit：環境沒有，未測。
- real iPhone Safari：pending。

Do NOT mark CLOSED until user confirms real-device PASS.

---

## V8-ASSET-READY

Status:
IN PROGRESS — REAL DEVICE FAIL / ROLLED BACK

Attempted implementation：

6367bbb
fix(v8): gate reveal on required image readiness

（tsc / build / CI / Playwright iPhone-size + desktop 全部 PASS，
但 real device FAIL。）

Real-device result：

FAIL — real iPhone Safari became stuck behind V8LoadingCover.
The 12-second "載入較久，重新整理" state appeared and reload did not recover.

Rollback：

920389e
Revert "fix(v8): gate reveal on required image readiness"

Runtime 回到 pre-P-021（src 與 2be4c61 相同）。

Reason for rollback：

Production usability takes priority.
Exact Safari failing/stalled required asset is not yet identified.

Do NOT mark CLOSED.

Issue:

Real iPhone recording confirmed:

OPEN quick-pick → ACTIVE
會先 reveal 半成品，
required image 後續才逐張出現。

Confirmed code causes：

1.
V8ActivePage：

revealImmediately={entering}

會 bypass assetsReady preload gate。

2.
V8HeroComposition：

ASSET_PRELOAD_TIMEOUT_MS = 5000

Promise.race timeout 會被當成 ready。

3.
preloadHeroImage：

onerror 也 resolve，
所以 failed required asset 會被當完成。

4.
V8LoadingCover：

ready 主要依 flow.phase，
不是 real visual asset readiness。

Target:

DATA READY
+
REQUIRED VISIBLE ASSETS READY
=
REVEAL

Timeout != Ready
Error != Ready
Entering != Ready
Active Phase != Ready

Required：

- bounded retry
- failure 不能 partial reveal
- loading cover / transition 等真正 asset ready
- no progressive pop-in

Next action：

Read-only diagnostic audit first.
Identify the exact asset(s) and state transition causing Safari readiness to stall before implementing P-021 v2.

---

## V8-QUICK-PICK

Status:
CODE PASS / VERIFY

Core commit：

a1f61a3b334b0ed4bb4814b3e24a26e77a81aecb

已完成：

- atomic quick pick
- current-event direct ACTIVE
- different-event exact target commit first
- removed cancelled-effect deadlock
- legacy UI 不可漏出

Remaining：

Asset Readiness 修完後測：

- current event
- different event
- no black screen
- no wrong-event flash
- no partial artwork

---

# P1

## V8-DESKTOP-CAP

Status:
CODE PASS / VERIFY

Commit：

653f55f683d3bc591ffcd8139aefe0f57562cf8b

Implemented：

real OPEN / ACTIVE：

maxStageWidth = 430

Remaining：

visual verify：

- 1024px
- 1440px
- 1920px
- iPhone 390–430px regression

---

## P-023

Status:
CODE PASS / VERIFY

Commit：

883c4dc9d103eb4712bd9fd8159b0c2cf392cba4

Includes：

- ACTIVE INFO ALT SLOT
- Season Attendance claimedMemberId
- remove old V8SunSwipeHint

Remaining：

Asset Readiness 修完後 final real-device verify。

---

## P1-3 V8 CONTROL CONSOLE REORGANIZATION

Status:
DEFERRED

這才是原本真正討論的「控制台優化」。

Scope：

- OPEN / ACTIVE 分離
- 中文化 / 簡化
- internal target IDs 不改
- 控制按鈕不整排撐滿
- 不做 Search
- V1 / V2 coexist
- version-specific settings preserved
- copy output 保留 inactive version
- formal / V1-V2 / fallback / debug / legacy 分類
- Full Panel
- Fine Tune floating controller

Fine Tune：

- REAL stage 1:1
- draggable
- minimizable
- dock corners
- avoid covering target
- target-specific effective controls

不要在 Asset Readiness production bug 關閉前開始，
除非 user 主動 reprioritize。

---

# P2

## DEV-ENV-ACCESS

Status:
PENDING

Owner：user（環境設定只能由 user 在 claude.ai/code 修改，Claude 無法代改）

Why：

雲端開發環境目前連不到 production，只能本機重建 + Chromium 測試。
P-021 / OPEN startup 都是「本機 PASS、實機 FAIL」，無法直接看線上站或 API。

To do（建議用電腦瀏覽器開 https://claude.ai/code；手機 App 可能找不到此設定）：

1. Session 標題列的雲端環境名稱 → Edit → Network access：
   選較寬等級（例如 Full），或加入允許清單：
   - ksp4022-ko.github.io
   - badminton-signup-v6-alpha.badminton-signup-v6-worker.workers.dev
   - fonts.googleapis.com、fonts.gstatic.com
   - cdn.playwright.dev、playwright.download.prss.microsoft.com、playwright.azureedge.net
   - archive.ubuntu.com、security.ubuntu.com
2. 同一個 Edit → Setup script 加入：

   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD= PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx -y playwright@1.56.1 install --with-deps webkit

   （1.56.1 = 環境內建 Playwright 版本）
3. 開新 session（舊 session 不會套用），跟 Claude 說「驗證環境」：
   - curl 線上 /v8test/kangxuan/ 與 API（只做唯讀）
   - WebKit 啟動並跑一次 /v8test startup

Optional（user 端）：

Mac Safari Web Inspector 連 iPhone，可直接看實機 Network / Console。

---

## V8-TUNING-LAZY

Status:
PENDING

這是 performance task，
不是 P1-3 本體。

Goal：

一般 visitor 不 eager load V8TuningPanel。

只有開啟 tuning/debug 時 dynamic import。

---

## V8-SUN-MOTION

Status:
PENDING

Effects：

- Float
- Pulse
- Halo
- Ring
- Energy

Principle：

- CSS keyframes
- prefers-reduced-motion
- OPEN / ACTIVE independent controls
- multiple effects allowed

---

## P-022 DATA/API

Status:
PAUSED

Blocker：

V6 / D1 S4 Billing Source Audit

Rule：

V8 不重新算 official billing。

---

## P-022 UI

Status:
V8TEST DEPLOYED / VERIFY（/v8 未改）

Commit：

00d971d
feat(v8test): read-only season bill behind the 帳單 plaque

- User 指示開始（2026-09-30），使用 Worker 既有 API（badminton-signup 4c986d5）：
  GET /api/v8-shuttle/events/:eventId/me/season-payment
- 入口：CTA 按鍵組「帳單」plaque（/v8test、季打 claimed member、季打 event 才啟用）
  → 本季帳單 dialog（沿用 代報/代退 blur-gate card）。
- 顯示：原始季費、上季請假抵扣、請假 X 次（展開 leaveDetails 日期，請假/備取）、
  本季應付、狀態 已繳/未繳、paidAt（已繳時）。
- V8 不算帳：全部顯示 backend 值；只送 Bearer token，不送 memberId；
  no-store、無 local snapshot/cache；換場次即關閉並重新讀取。
- 狀態處理：loading / 無紀錄（SEASON_PAYMENT_NOT_FOUND）/ auth error（401、
  FIXED_MEMBER_REQUIRED、SEASON_MEMBER_REQUIRED、LINE_IDENTITY_DISABLED）/
  其他錯誤 / detailCountMatchesPayment=false 警告。非季打 event 不啟用。
- 測試 event 明細由 API 過濾（本機驗證：test event 的請假不出現）。
- /v8：帳單維持灰色 placeholder，不呼叫 API（本機驗證）。

Verification：

- tsc / build PASS
- Local Chromium /v8test（本機 Worker = badminton-signup origin/main）：
  未繳+明細不一致警告、已繳+paidAt、無紀錄、auth error、loading→ready、
  請假明細展開、關閉 PASS；legacy UI 0；無 pageerror
- /v8 smoke：帳單 disabled、無 season-payment request
- real iPhone Safari：pending

Promotion 到 /v8 需要 user 回覆 Cfm / 確認。

---

# CROSS-REPO

## V6-D1-S4-BILLING-AUDIT

Status:
PENDING EXTERNAL RESULT

Repo：

ksp4022-ko/badminton-signup

READ ONLY AUDIT。

Known S4：

14 events
2026/10/01–2026/12/31
14 season members
revision 3
season fee 2410
per-event basis 172
temp fee 220

Audit needs：

- persisted season payment rows?
- row count
- 14-member coverage
- 2410 vs 2240
- V6 UI/API/SQL read path
- persisted / preview / mixed?
- refund credit source
- revision relationship
- charge source of truth
- payment source of truth
- would generating S4 rows duplicate existing data?

NO D1 WRITES。

---

# CLOSED

## P-020

Status:
CLOSED

Commit：

8e17e06

56 TypeScript diagnostics
→ 0

tsc exit 0。

---

## P-020B

Status:
CLOSED

Commit：

74313e0

TypeScript gate before build。
Type error blocks deployment。

---

## V8 LEGACY ISOLATION

Status:
CLOSED

Relevant commit：

9a165157e79d85fcec25acb67217bc0e09df7698

/v8/* 不再 fallback 到 legacy active visual UI。

---

## P1-2 COPY PARAMETER OUTPUT

Status:
CLOSED

Commit：

b8e1b10bf84dacd0b380fcc0dd68f767db21d4c4

Auto-Fill / experimental control values 已納入 copy output。

---

# CURRENT EXECUTION ORDER

（精簡現況與目前順序以 docs/V8_CURRENT_STATE.md 為準：
P-022 UI V8TEST verify → P-021 v2（先 read-only 診斷，經 V8TEST）→ 其他）

1. V8-ASSET-READY
2. iPhone Quick Pick final verify
3. Desktop + P-023 final verify
4. V6/D1 Billing Audit
5. P-022 Data/API decision
6. P1-3 Control Console Reorganization
7. Lazy Load / Sun Motion / lower-priority backlog

User 可以隨時重新指定 priority。
