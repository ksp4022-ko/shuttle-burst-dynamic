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

## V8-OPEN-STARTUP

Status:
CODE PASS / VERIFY

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
PAUSED

Personal bill read-only UI。

必須等 Billing Source Audit / Data API source-of-truth 決定完成後才繼續。

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

0. V8-OPEN-STARTUP real-device verify（先確認 OPEN 能穩定啟動）
1. V8-ASSET-READY
2. iPhone Quick Pick final verify
3. Desktop + P-023 final verify
4. V6/D1 Billing Audit
5. P-022 Data/API decision
6. P1-3 Control Console Reorganization
7. Lazy Load / Sun Motion / lower-priority backlog

User 可以隨時重新指定 priority。
