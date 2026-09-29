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

## V8-ASSET-READY

Status:
CODE PASS / VERIFY

Commit：

6367bbb
fix(v8): gate reveal on required image readiness

Verification：

- tsc PASS
- build PASS
- CI/deploy PASS
- Playwright iPhone-size/desktop tests PASS
- real iPhone Safari verification still pending
- do NOT mark CLOSED until user confirms real-device PASS

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

Next：

Asset Readiness patch 已實作（6367bbb）。

待 iPhone real-device test；user 確認 PASS 後才可 CLOSED。

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

1. V8-ASSET-READY
2. iPhone Quick Pick final verify
3. Desktop + P-023 final verify
4. V6/D1 Billing Audit
5. P-022 Data/API decision
6. P1-3 Control Console Reorganization
7. Lazy Load / Sun Motion / lower-priority backlog

User 可以隨時重新指定 priority。
