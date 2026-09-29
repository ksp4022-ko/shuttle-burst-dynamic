# V8 System Design

Last reviewed: 2026-09-29

## Source of Truth

三層真相來源：

1. Source code = implementation truth
2. V8_SYSTEM_DESIGN.md = architecture truth
3. V8_PROJECT_TRACKER.md = project-status truth

若三者衝突：
不要自行推論或修正。
先回報衝突。

文件分工（不重複內容）：

- `CLAUDE.md` = execution rules
- `docs/V8_CURRENT_STATE.md` = concise current state
- `docs/V8_PROJECT_TRACKER.md` = detailed project history / status
- `docs/V8_SYSTEM_DESIGN.md` = architecture

一般任務先讀 `CLAUDE.md` + `V8_CURRENT_STATE.md`，再只看相關 source；
架構變更、狀態衝突、歷史查證或任務要求時才讀完整 design / tracker。

---

## Repository

Frontend:
ksp4022-ko/shuttle-burst-dynamic

Production V8 routes:

/v8/
/v8/kangxuan/
/v8/rian/

主要環境：
mobile-first
real iPhone Safari 為最終 UI / interaction 驗收環境。

Desktop / wide viewport：
real OPEN / ACTIVE stage 目前 maxStageWidth = 430px，
置中顯示，
不可因桌機重新調整內部 mobile composition。

---

## Backend Boundary

V6 Admin / Worker / D1 屬於另一個系統：

ksp4022-ko/badminton-signup

V8 可以共用：
- event data
- roster
- signup
- queue
- leave / return
- selected event
- Worker API

但 V8 UI 修改不得自行重新定義 backend business rules。

---

## V8TEST Route Family

Production：

/v8/
/v8/kangxuan/
/v8/rian/

= LOCKED，不直接修改。

Test：

/v8test/
/v8test/kangxuan/
/v8test/rian/

= 所有後續修正先放這裡，部署到 GitHub Pages，user 用 iPhone Safari 實測。
User 回覆「Cfm / 確認」後，才把已驗證內容同步到 /v8/*。

Implementation（src/lib/v8-route-family.ts）：

- 同一份 app、同一份 bundle、同一個 Worker / D1（不是測試資料庫）。
- route family："v8"（production）/ "v8test"（test）。
- isV8Route = 兩個 family 都算 V8（legacy hard isolation 同樣適用 /v8test）。
- isV8TestRoute()：只在 /v8test/* 為 true。
- 右上角「V8 TEST」badge 只在 /v8test/*。

Rules：

1. 新修正一律包在 isV8TestRoute 裡，只在 /v8test 生效。
   Cfm 後才移除條件，讓 /v8 也採用（= promotion）。
2. 必須修改共用程式時，回報中明確標示「會影響 /v8」，並附 /v8 regression 結果。
3. 每次部署前比對 /v8 修改前後（pixel + Quick Pick / CTA / ACTIVE flow）。
   /v8 有非預期差異 → 不部署，先回報。

Storage：

- selected event / orientation restore（sessionStorage）：
  production 維持原本 "v8:" key；/v8test 用 "v8test:" key。
- LINE token / identity：共用（不需登入兩次）。
- LINE login return URL：共用 key，值本身帶 route family。
  Worker 只接受 /v8/* returnTo，所以從 /v8test 登入會先回到 /v8，
  /v8 只在「存的 return URL 是 /v8test」時轉回 /v8test。
- intro played / tutorial / tuning（v8-preview-controls-v4、Auto-Fill、Identity Envelope）：
  共用。注意：在 /v8test 的隱藏調整面板存檔，也會改到同一台裝置上 /v8 的畫面。

注意：/v8test 使用正式後端，報名 / 請假 / 代報都是真實操作。

---

## Legacy Isolation

/v8/* 可以共用 business logic，
但不能出現 legacy visual UI。

尤其不得回退到舊：

HomepageRoster

Legacy UI 可以留在非 V8 routes，
但 V8 必須 hard isolate。

---

## OPEN

OPEN 為聚會選擇狀態。

包含：

- 紅日聚會資訊
- Previous / Next
- Horizontal Swipe
- ▼ 1/N picker
- 進入戰局 CTA

Arrow / Swipe：
只 preview event，
保持 OPEN。

▼ 1/N Quick Picker：
可直接進入選定聚會 ACTIVE。

---

## Quick Pick Architecture

Quick Pick 必須是 deterministic transaction。

### Current Event

如果 quick pick 點的是目前 selected event：

不要為了選同一場再呼叫 switch API。

直接：

enter V8 ACTIVE

### Different Event

如果點另一場：

1. load / commit exact target event
2. suppress shared automatic active transition
3. target event commit 成功
4. 才進 V8 ACTIVE

Failure：
保持 OPEN。

禁止：
- wrong-event flash
- legacy UI flash
- 重新使用過去 effect + cancelled cleanup 的 quick-pick 架構

Atomic quick-pick core fix：

a1f61a3b334b0ed4bb4814b3e24a26e77a81aecb

---

## ACTIVE

ACTIVE 負責：

- current meetup roster
- identity
- CTA
- helper actions
- Season Attendance
- ACTIVE meetup switching
- ACTIVE visual composition

UI 工作不得順便修改：

- signup business rules
- leave / return
- waiting ordering
- 30-minute grace
- Worker/D1 behavior

---

## Asset Readiness Contract

這是正式 architecture invariant。

V8 stage 只有在：

DATA READY
+
REQUIRED VISIBLE ASSETS READY
=
REVEAL

才可以顯示。

以下全部「不等於 ready」：

- timer timeout
- image error
- entering animation flag
- flow.phase === active

Background prewarm 只是 optimization。
不能作為 correctness condition。

Required behavior：

- loading / transition treatment 保持到 required visible assets 完成
- 不可 black gap
- 不可 partial artwork
- 不可 required first-screen assets 在 reveal 後逐張 pop-in

目前 production 有 Asset Readiness regression，
記錄在 Project Tracker，
尚待正式修復與 iPhone 驗收。

---

## Desktop Rule

Real OPEN / ACTIVE：

maxStageWidth = 430px

只限制 outer stage。

不要重新 tuning：
- sun
- dragon
- tiger
- cards
- roster
- CTA

Desktop fix commit：

653f55f683d3bc591ffcd8139aefe0f57562cf8b

---

## P-023 Locked Behavior

P-023 已完成程式修改，剩 real-device final verify。

包含：

1.
ACTIVE INFO ALT SLOT
outer:
X29
Y38
Scale2
Rotation2

waiting horse inner:
translateX(6.67%)

2.
Season Attendance 使用 claimedMemberId 修正 identity mapping。

3.
Real OPEN / ACTIVE 移除舊 V8SunSwipeHint。

Core commit：

883c4dc9d103eb4712bd9fd8159b0c2cf392cba4

---

## Tuning Console Architecture

控制台有兩個不同主題：

A. Control Console UX
B. Lazy Load / performance

禁止把兩者混在一起。

### P1-3 Control Console Reorganization

真正已討論的控制台優化：

- OPEN / ACTIVE 清楚分離
- UI 文字簡化 / 中文化
- internal target IDs 不變
- 按鈕不要整排撐滿
- 不需要 Search
- V1 / V2 experiment 可以並存
- 每個 version 各保留設定
- 複製設定必須保留未啟用版本
- formal / V1-V2 / fallback / debug / legacy 清楚分類
- Full Panel + Fine Tune floating controller

Fine Tune：

- REAL stage 保持 1:1
- controller 可拖曳
- 可縮小
- 可 dock 四角
- 避免遮住 tuning target
- 顯示目前 target 真正有效參數
- 不固定只有 X / Y / Scale / Rotation

P1-3 目前 Deferred。

### V8TuningPanel Lazy Load

這是獨立 performance item。

一般訪客不應 eager-download hidden debug/editor panel。

只有開啟控制台時才 dynamic import。

---

## Billing Architecture

P-022 個人帳單：

V8 = READ ONLY

目標：

V6 Admin financial records
→ D1
→ Worker Billing API
→ V8 personal bill

V8 不得重新生成 official season charges。

實作 P-022 前必須先完成：

V6 / D1 S4 Billing Source Audit

不可自行猜 payment allocation / credit / snapshot rules。

---

## CI

Production CI 已有：

npm install
→ npx tsc --noEmit --pretty false
→ npm run build
→ prerender verify
→ GitHub Pages deploy

TypeScript error 必須阻止 deployment。

禁止：

continue-on-error
|| true
任何 suppress tsc failure 方法

CI gate commit：

74313e0

---

## Validation Policy

CODE PASS
不等於
VISUAL CLOSED。

V8 visual / animation / image / touch task 必須：

- tsc PASS
- build PASS
- CI PASS
- deploy PASS
- production sanity PASS
- real iPhone Safari PASS

沒有真正做 iPhone test，
不得回報 real-device PASS。

---

## Change Discipline

每個 task：

1. Read latest main
2. Read V8_SYSTEM_DESIGN.md
3. Read V8_PROJECT_TRACKER.md
4. Read relevant source
5. Minimal delta
6. Preserve unrelated locked behavior
7. tsc
8. build
9. commit / push
10. CI
11. update Project Tracker
12. real-device visual task 等 user 驗收後才能 CLOSED
