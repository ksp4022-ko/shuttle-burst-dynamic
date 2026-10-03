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

## V8-ISSUE-IDENTITY-TAG-POSITION（待修正，user 回報 2026-10-01）

Status: CLOSED（57a3af5；production real iPhone PASS，user 2026-10-01）

- 現象（正式 /v8，iPhone Chrome，柯山米 季打請假）：季打旗跑到卷軸下方、被浪遮住（圖1，18:16）；
  正確位置應在卷軸左側、名字左邊（圖2，20:51）。
- 臨打：與季打是同一個元素（.v8-scroll-identity-tag），只換圖片 → 位置一定與季打旗相同（user 要求同位置：符合）。
- 程式確認：位置只由控制台參數 activeIdentityTagX/Y 決定（程式預設 X 40% / Y 96% = 卷軸下方），
  與請假等狀態無關（請假只讓名字變淡）。圖2 的位置推測來自該瀏覽器存過的控制台設定；兩張圖不同的原因未確認。
- 修正方向：把預設值改成圖2 的位置（需該位置的確切數值：控制台「複製設定」中的「身份吊牌 (tag)」一行）。
  先改 /v8test 驗證，再等 Cfm。
- 8e8194b（/v8test）：預設改為 user 提供的值 X 21 / Y 50 / Scale 1.36（Rotation 5 不變）。
  Local：/v8test 季打 正取、請假 位置相同（卷軸左側、名字旁）；/v8 仍在卷軸下方。
  臨打（local DB 暫時把 L2 改成 temp 驗證後還原）：/v8test 臨打旗與季打旗同位置；/v8 臨打旗在卷軸下方。user 無臨打帳號，以本機截圖驗證。

## V8-ISSUE-CLOUD-BADGE-ART-MISSING（待確認）

Status: CLOSED（user 2026-10-01：雲框已正常；未再重現，判定為一次性載入問題）

- 圖2（20:51，正式 /v8）ACTIVE 紅日四周雲朵徽章底圖沒出現，只剩文字（MS-101 / 22人 / 2場/2hr / $220）；圖1（18:16）正常。
- 可能是弱網路下雲朵圖載入失敗或還在載入；待確認是否可重現。

---

## V8TEST-CLOUD-BADGES-V2（新雲框 4 張）

Status: CLOSED（/v8test real iPhone PASS → Cfm 2026-10-03 套用 /v8 → production real iPhone PASS 2026-10-03）

- user 2026-10-03 提供新雲框 4 張（球種 / 費用 / 場時 / 上限），2172×724 PNG，各 2.6–3.4MB。
- 優化：裁掉透明邊 → 450px 寬 WebP（有損 + alpha），各約 21–24KB（4 張共 89KB；舊 450 版 4 張 128KB）。
  新檔名 `v8-cloud-*-display-v2-450.webp`，/v8 舊檔與快取不動。
- 只在 /v8test（`isV8TestRoute()`）：
  - `buildV8ActiveAssets` 換成 v2 檔（prewarm 用同一個 builder，自動跟著換）。
  - 新圖較扁（~3:1，舊 ~2:1）→ 顯示寬 86 → 100px（`.is-cloud-v2`），文字 inset 重新以像素掃描空白區
    （`BADGE_TEXT_INSETS_V8TEST`，往上移 ~10% 抵消既有 Text Offset Y +3/+4）。
- /v8 不變（本機 build 確認 /v8 仍載入舊 450 版、尺寸相同）。
- 第 2 輪（user real iPhone 調整後）：
  - /v8test 預設改為 user 調好的雲框參數（球種 X124/Y51/Scale1.55/Text -2,4；費用 X-29/Y97/Text -3,4；
    場地數 X90/Y82/Text 0,3；上限 X-55/Y61/Z0/Text 1,3/Shadow 0,5）。`previewDefaults` 在 /v8test 套用
    `v8TestCloudBadgeDefaults`，/v8 仍用原預設。
  - 「上限」雲壓在紅日後面：V8HeroComposition 新增 `sunUnderContent`（與紅日同位置、同 z-index、在紅日之前，
    跟著 Float 浮動），/v8test 把上限雲放這層。/v8 不變。
- Promotion（Cfm 2026-10-03）：所有 V8 路由都用 v2 雲框、100px、新 inset、新預設、上限雲在紅日後；
  `isV8TestRoute` 分支全部移除。新增一次性 migration `activeSunBadgeCloudV2`：清掉各裝置已存的
  activeSunBadge* 調整值（舊圖的數值不適用新圖），改用新預設。舊雲框檔案保留未刪。

---

## V8TEST-ACTIVE-VIEWPORT-CLIP（重整後下方版面被拉開）

Status: CLOSED（/v8test real iPhone PASS → Cfm 2026-10-03 套用 /v8 → production real iPhone PASS 2026-10-03）

- user 2026-10-03：ACTIVE 重整後頁面往下捲，名單浪下方露出龍尾/浪花（未完成的版面）。
- 原因：ACTIVE 舞台 390/800（393 寬 → 806px）比 iPhone 可視高度（約 660）高；平常靠 page lock
  停在頂部，重整時 Safari 捲動了頁面（WebKit 模擬未重現捲動本身，只確認下方有 ~150px 可捲）。
- 修正（/v8test only）：`.v8-active.is-viewport-clip { max-height: 100svh; overflow: clip }`，
  頁面高度 = 螢幕高度，下面沒有東西可捲。本機：/v8test scrollHeight 659 = 視窗；/v8 仍 806。
- Promotion（Cfm）：`.v8-active` 本身 max-height 100svh + overflow clip（所有 V8 路由），移除 isV8TestRoute 分支。
- 另：重整時的「app not started after 10s」紅框（/v8test 診斷）出現在載入中畫面，先記錄。

---

## V8TEST-HELPER-DIALOG-V2（代報/代退彈窗動態，item 1–4）

Status: PRODUCTION DEPLOYED / VERIFY（/v8test real iPhone PASS → Cfm 2026-10-03 套用 /v8，等 production real iPhone）

只在 /v8test（`.v8-active.is-dlg-v2`）；/v8 不變（本機確認：/v8 仍瞬開、blur 14px）。後端、取消規則不變。
1. 開關：卡片由下滑入帶彈性（300ms）、關閉滑出（190ms，關閉中仍保留卡片，不閃）；背景去掉 blur(14px)，改半透明 0.42。
2. 代報：有輸入名字時「確認報名」輕彈一下；送出中按鈕上朱印轉動（按鈕不淡化、整頁藍色遮罩改透明但仍擋點擊）；
   成功蓋「完成」停 0.52s 後滑出；失敗卡片左右輕搖（WAAPI translate，不重播滑入），保留輸入。
3. 代退：選中那列蓋「選」、其他列變淡；「確認取消 ○○」從下方滑出、按「重新選擇」收回；
   成功時該名字被劃掉並淡出，蓋「完成」停 0.65s 後關閉；失敗輕搖、保留選擇。
4. 彈窗底部浪花左右緩慢飄動（整塊 translate ±7px，7s）。
- 減少動態效果：全部不動。
- 本機 WebKit（測試瀏覽器內假造登入與 API，寫入請求全在瀏覽器內回應、未送到後端）：
  代報 送出中 → 完成 → 帶著完成滑出 → 關閉；代退 失敗搖晃且保持開啟、成功 劃掉 → 完成 → 關閉；
  重新選擇後確認鈕高度 0；無錯誤。

---

## V8TEST-LIST-NAMES-MOTION（名單面板名字動畫）

Status: ABANDONED（user 2026-10-03 real iPhone：看不出效果、被彈窗擋住，放棄；程式已移除，回到原本名單）

- 打開名單面板：名字依序淡入上浮（每個間隔 35ms，最多 0.45s），約 0.6s 全部到位。
- 名單內容在面板開著時變動：新名字淡入、移除的淡出，其他名字滑到新位置；同一人換名單/換欄位以 layoutId 滑過去。
  註：V8 目前面板開著時不會重新抓名單（輪詢只在舊版 phase=active），所以這部分平常看不到；程式已就緒，未實測。
- 只在 /v8test：`V8ListNamesMotion` 在 ACTIVE 掛上時背景先下載（React.lazy 會先閃一次一般名單，已改掉）；
  /v8 不下載。減少動態效果時不做動畫。
- 本機 WebKit：打開正取名單 → 0ms 全為 0，140ms 起由上往下依序出現，630ms 全部 1.0；無錯誤。

---

## V8TEST-VIEW-TRANSITION-HIDDEN（紅框：View transition was skipped）

Status: PRODUCTION DEPLOYED（Cfm 2026-10-03 套用 /v8；本機模擬 /v8 無 rejection）

- user 2026-10-03 real iPhone（/v8test，4G）：紅框 `rejection: View transition was skipped because document visibility state is hidden`。
- 原因：OPEN → ACTIVE 自動進場時頁面剛好在背景（切 App/分頁），Safari 跳過 view transition 並讓 `transition.ready` reject；
  程式沒接 `ready` → 未處理的 rejection。ACTIVE 仍正常掛上（update callback 照跑），只是多一個錯誤。
- /v8 也有同樣的未處理 rejection，但正式版沒有紅框，使用者看不到、功能不受影響。
- 修正（/v8test only）：`transition.ready?.catch(() => {})`。
- 本機模擬（假造被跳過的 transition）：/v8test 無 rejection、ACTIVE 正常；/v8 仍有 rejection（未改）。

---

## V8TEST-SUN-SWIPE-MOTION（紅日跟手滑動切換聚會）

Status: PRODUCTION DEPLOYED / VERIFY（/v8test real iPhone PASS → Cfm 2026-10-03 套用 /v8，等 production real iPhone）

- 整顆紅日（圓盤＋雲框＋紅日後的上限雲）跟著手指左右滑（手指位移 ×0.45），文字轉盤同時轉（0.28°/px，轉越多越淡）。
  沒有上一場/下一場的方向有橡皮筋阻力（最多約 32px 手指位移 → 紅日約 14px、文字約 9°）。
  （第 2 版，user：以為紅日本身也會位移；V8HeroComposition 的紅日後層加 `data-v8-sun-under` 標記，/v8 畫面不變。）
- 放開：拖超過 56px 或快速甩（≥420px/s 同方向）→ 切換；否則以放開速度彈簧回正（Motion `animate` spring）。
  拖超過 120px 時在移動中就切換（避免 Safari 中途 pointercancel 吃掉手勢）。方向同舊版：左→右 = 下一場。
- 第 3 版（user）：滑動判定擴大 + 加到 OPEN + 拖曳時暫停倒數：
  - 手勢改掛在整個舞台（`[data-v8-hero-stage]`）：OPEN 整個畫面、ACTIVE 螢幕上半部（clientY ≤ 視窗高 / 2）。
    點按（沒有水平移動）照常點到按鈕；拖曳後的那次 click 會被吞掉，避免從按鈕開始滑也按到按鈕。
    輸入框、對話框、身份確認、`[data-no-sun-swipe]` 不起算；場次選單是 portal，不在舞台內。
  - OPEN 共用同一個 `V8SunSwipeMotion`（lazy，只在 /v8test）。
  - OPEN 拖曳中暫停 9 秒倒數（`openSunDragging`），放開後從剩餘秒數繼續。
  - 本機 WebKit：OPEN 在 y=560（老虎上）滑 → 換場；拖住 12 秒不會自動進 ACTIVE，放開後倒數走完才進；
    ACTIVE y=280 滑 → 換場，y=500（下半部）滑 → 不換；點 1/14 開選單、點進入戰局 正常。
- Cfm 2026-10-03：套用到所有 V8 路由（/v8 現在也會在進入後 lazy 下載 Motion ~22KB gzip）。原本：只在 /v8test：`V8SunSwipeMotion` 用 React.lazy 載入，載入前用舊的滑動區；/v8 不下載 Motion
  （本機實測 /v8 啟動 JS 前後皆 911KB）。/v8test 多 ~22KB gzip（Motion 共用 chunk 16.6KB + 滑動 5.9KB）。
- prefers-reduced-motion：不跟手、不彈簧，只保留切換。
- 本機 WebKit（滑鼠模擬）：30px 彈回不切換（紅日 13.5px）；80px 切換到 2/14（紅日 36px）；反向切回 1/14；第一場往前拖只有橡皮筋。

---

## MOTION-TRIAL（CTA / 彈窗效果比較，/v8test/motion-lab）

Status: TRIAL DONE（user 選 B CSS）；套用到 ACTIVE = PENDING

- 加入 `motion`（bun add；引用 `motion/react`）。bun.lock 原本落後 package.json（缺 remotion 等），一併補齊。
  注意：用 bun 重裝的 node_modules 會讓 Pages prerender 失敗（listen ::）；CI 用 npm install，正常。
- 新頁 `/v8test/motion-lab`（`src/routes/v8test_.motion-lab.tsx`，不掛在 /v8test 底下）：
  同一顆告假牌、代報牌、代報彈窗，三組效果切換：A 現在 / B 純 CSS / C Motion；可模擬送出失敗；不打後端。
- Bundle：Motion 只在試驗頁的 chunk（140KB raw / 45KB gzip，含試驗頁本身）。
  /v8 啟動 JS 前後相同（WebKit 實測 911KB）。試驗頁不可 import v8ActiveConfig（會打亂正式 chunk）。
- ACTIVE / OPEN / /v8 沒有任何改動。
- 結果（user real iPhone 2026-10-03）：選 **B CSS**。
- V8-CTA-DIALOG-CSS（user：先記錄、不實作）；其中代報/代退彈窗部分已做 → 見 V8TEST-HELPER-DIALOG-V2：
  - CTA（告假/代報/代退/帳單）：按住即壓下（scale .92 + 下沉，80ms），放開 overshoot 回彈（320ms cubic-bezier(.34,1.56,.64,1)）。
  - 送出中：按鈕上朱印轉動 → 成功蓋「完成」、失敗輕搖；取代整頁藍色遮罩。
  - 彈窗（代報/代退/帳單/身份確認）：滑入/滑出 + 退場動畫；背景改輕遮罩，拿掉 blur(14px)。
- Motion 套件與試驗頁暫時保留（B 不需要 Motion；之後若不用可移除）。
  Motion 較適合：紅日跟手滑動切換聚會（慣性/回彈）、名單增減補位動畫。

---

## V8-INTRO-VIDEO-V2（新影片 Intro，PAUSED）

Status: PAUSED（user 2026-10-02：非必須，之後有空再試）

正式 /v8 與 /v8test 仍是原本的影片 Intro（intro_web_crf27_muted.mp4），沒有任何變更。

已驗證的做法（Gemini 生成 + Claude 剪接）：
- 問題：Gemini 依「結尾畫面」生成時，結尾對不上 OPEN、龍虎長相差異大。
- 解法 = 兩段：
  - 第 2 段「聚合」：以 OPEN 截圖（9:16、紅日文字拿掉）為「起始畫面」，請 Gemini 做「散成墨水金粉、只剩紙面與紅日」，Claude 倒放 → 聚合成 OPEN，最後 0.6s 淡入真正的 OPEN（含日期）。已成功（龍虎與網站一致）。
  - 第 1 段「打鬥」：結尾畫面 = 紙面＋紅日；Claude 在接縫處把紅日平滑移位/放大對齊（兩段紅日位置大小不同），逐格確認無重影。
- 草稿 15s、1.8MB（crf33）；定案後需再壓到 ~1MB 並先放 /v8test。
- 待重做：第 1 段打鬥。user 不要直立擬人老虎，要日式動漫風；不要用 OPEN 截圖當起始畫面（截圖老虎是直立擬人）。
  已給 Gemini 指令：anime action、四腳真老虎、龍虎爭奪發光羽球、最後 2 秒墨水掃光到紙面＋紅日。
- 注意：草稿與素材都在暫存環境，不會保留；重啟時由 user 重新提供 Gemini 影片，Claude 重新截 OPEN 起始畫面。

---

## V8 PROMOTION（Cfm 全部，2026-10-01）

4c1f87b
feat(v8): promote the verified /v8test load-speed work to production

Status: CLOSED（production real iPhone PASS，user 2026-10-01：Intro / 龍順序 / 倒數 / 自動進場 / ACTIVE 首屏 / 名單面板 / 返回 全 OK）

- 套用到所有 V8 路由：Step 1（f5207d9）、Step 2A（5943420）、Step 2B（b967175，影片 Intro contain + 緩衝完才載圖；取代舊的 fetch 預載）、
  647f677（龍載入順序 / bfcache 返回重置 / 自動進場動畫）、名單面板（5008630 + 4f5b669）、縮圖 Batch 1（5ed870c）、Batch 2（051d7dc）。
- 只留在 /v8test：錯誤紅框、?intro=fresh、?intro=code（程式 Intro）、V8 TEST 標籤。
- Local（/v8）：family PASS；影片 Intro、?intro 參數在 /v8 無效；縮圖檔全部是新檔、無破圖、紅日 Auto-Fill；
  1500kbps Quick Pick：身分圖在 ACTIVE 前已預載、首屏 +3.4s、0 重複請求；自動進場走動畫路徑、ACTIVE 只進一次；
  bfcache 返回重置 OK；名單面板：圖未到名字隱藏、圖失敗時紙底顯示名字。
- production real iPhone：PASS

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
P-021 v2 Step 1 / 2A / 2B CLOSED（4c1f87b，production real iPhone PASS）（6367bbb 仍為 ROLLED BACK，不可恢復）

P-021 v2 step 1（OPEN countdown readiness，/v8test only）：

f5207d9
fix(v8test): start OPEN auto-enter countdown only after critical art loads

- Real iPhone：OPEN 還在載入時 9s auto-enter 就觸發，ACTIVE 下載與 OPEN 搶頻寬。
- OPEN critical set：龍身、目前顯示的老虎（依 tigerVariant）、進入戰局 CTA 圖。
  裝飾（浪/雲/山/金墨/前浪花/爪/袋/箭頭）可漸進載入，不等。
- 判斷：畫面上的 <img> complete + naturalWidth>0（沿用 ?v8r 重試）；
  無 timeout、error 不算 ready；critical 失敗 → 不自動進場，手動 CTA / Quick Pick 可用。
- 不加 global gate、不改 cover、不改 ACTIVE preload；/v8 不變。
- Local（Chromium 限速）：
  - /v8test 600kbps：critical 全載完（40.7s）才開始倒數，ACTIVE 於 +9.06s 進場
  - /v8test 20Mbps：2.2s 開始倒數，11.3s 進場（完整 9s）
  - /v8test 龍身 error：25s 內不倒數、不自動進場；手動 CTA → ACTIVE PASS
  - /v8 600kbps：原行為（資料好即倒數）不變
  - Regression /v8、/v8/kangxuan（390/1280）、/v8test/kangxuan PASS，legacy 0，無 pageerror
- real iPhone Safari：/v8test PASS（user 確認 2026-09-30）
- Promotion 到 /v8 需要 user 回覆 Cfm / 確認。

P-021 v2 Step 2A（ACTIVE preload optimization，/v8test only）：

5943420
perf(v8test): warm ACTIVE's first-visible art as soon as OPEN is usable

Status: CLOSED（Cfm 全部 2026-10-01，4c1f87b；production real iPhone PASS，user）

- 開始時機：Step 1 critical OPEN art ready 後（不再等全部 OPEN 圖／15s）；不用 timer，
  避免與 OPEN critical 搶頻寬（試過 8s fallback → 600kbps 倒數延後 ~22s，已移除）。
- new Image() + ACTIVE <img> 的 exact URL（無 ?v8r），整頁去重；
  舊 fetch() 預熱與 <img> 不共用，ACTIVE 會重抓 ~22 張。
- Tier 1（high）：tiger scroll、CTA assembly（舊版漏掉）、identity 章/牌/CTA 字
  （cached LINE identity + roster，mirror useCurrentIdentity）、紅日標題/徽章、繩/牌、B1 名單、list buoy。
  Tier 2（low）：其他狀態圖、候補牌、list panel。
- 不加 ACTIVE gate；Step 1 不變；/v8 保留舊預熱（未改）。
- Local 量測（Chromium，真 HTTP cache max-age=600，cached identity；first-visible 23 張）：
  - 1500kbps Quick Pick（倒數 +3s）：ACTIVE+0.3s ready 3→7；全部 +12.8s→+7.9s
  - 1500kbps auto-enter：4→16；+7.7s→+2.9s
  - 600kbps Quick Pick：2→4；>30s→+26.6s
  - 600kbps auto-enter：3→6；>30s→+22.7s
  - 重複 request 22–24→0；?v8r 0；倒數開始時間不變（17.1s / ~40s）
  - 600kbps 仍受頻寬限制（9s 內載不完 ACTIVE）→ 之後 Intro-Time preload 另議
- Regression：/v8、/v8/kangxuan、/v8test/kangxuan PASS；Step 1（慢網路倒數、critical error 手動進場）PASS；
  /v8 預熱行為 before/after 相同。
- real iPhone Safari：pending

P-021 v2 Step 2B（Intro-time preload + Intro sizing，/v8test only）：

b967175
perf(v8test): preload during the Intro and keep the Intro video smooth

Status: CLOSED（Cfm 全部 2026-10-01，4c1f87b；production real iPhone PASS，user）

- Intro 影片完整 buffer 後依序預載：OPEN critical → OPEN/ACTIVE 共用背景 → ACTIVE first-visible
  （Step 2A tier 1）→ 裝飾。沿用 Step 2A warm()/dedup（startV8PrewarmQueue）；exact URL、無 ?v8r。
- buffer 完成前，Intro 底下看不到的 OPEN 圖與 Step 2A 預載先等，讓影片優先；
  buffer 完成、略過、播完或失敗即放行。
- Intro 尺寸：contain，限制在可見 viewport + safe area 內（移除 iOS 會裁掉底部的 100vh min-height）。
- Step 1 readiness 邏輯不變；無 global / ACTIVE gate；/v8 不變。
- Local 量測（Chromium 無 H.264 → 用同尺寸 846KB / 10s / 512x910 WebM 代替 Intro；真 HTTP cache）：
  - 1500kbps：Intro 卡頓 21 次 / 10.9s → 0；倒數 30.7s → 21.1s；進 ACTIVE 40.1s → 29.9s
  - 1000kbps：卡頓 21 次 / 22.2s → 3 次 / 0.4s；倒數 47.1s → 32.6s；進 ACTIVE 56.5s → 41.9s
  - 4000kbps：兩者皆 0 卡頓，時間不變
  - Intro 框 390x664 = 可見 viewport，object-fit contain
- Regression：/v8/kangxuan、/v8test/kangxuan PASS；Step 1 critical error 手動進場 PASS；/v8 行為不變；legacy 0。
- real iPhone Safari：pending

Step 2B hotfix：024e420 fix(v8test): start the Intro-time preload only after startup data loads
- Real iPhone /v8test 出現 load-error（連線逾時）。Step 2B 在影片 buffer 完就開始預載，
  可能早於啟動 API（local 4000kbps：預載 7.7s、events 8.9s、roster 11.9s），~2.5MB 圖片搶 API 頻寬。
- 修正：預載另需 startup data 完成（v8OpenReady 且非 load-error）；預載改在 roster 回來後才開始。
- Intro 仍 0 卡頓；1500kbps 倒數 21.1s → 18.1s。

ACTIVE gate 未開始，需另行指示。

V8TEST 空白畫面（iPhone Chrome，只有底色、無 V8 TEST 標籤、無載入中）：

3d05337
fix(v8test): on-page error report for blank screens; Intro can never take the page down

Status: V8TEST DEPLOYED / 未再重現（user：重開後正常）

- 95cbb4e：紅框「app not started」誤報修正（影片 Intro 播放中 10s 時 OPEN/cover/ACTIVE 都還沒掛上 → 改以 V8 TEST 標籤判斷 app 已啟動）。
- 2026-10-01 user 重開 /v8test：正常（未出現紅框）。判定為一次性主程式未啟動（載入/網路），保留紅框以便再發生時定位。

- 判讀：只有 v8-boot 底色 = app 主程式沒有啟動（沒 render 任何東西）。本機擋掉主 JS 檔 → 畫面完全一致；
  程式內錯誤則會顯示「This page didn't load」文字頁，與截圖不符。真正原因未確認（主 JS 載入失敗 / 弱網還在下載 / iOS 特有錯誤）。
- /v8test 加頁面錯誤回報：JS 錯誤、script/style 載入失敗、10 秒未啟動（列出已載入的 JS）→ 頁面底部紅框。/v8 不加。
- 程式動畫 Intro：Web Animations 呼叫加保護 + 獨立 error boundary，任何瀏覽器差異只會略過 Intro。
- Local：正常流程無紅框；擋主 JS → 紅框顯示原因；introflow / family PASS。

V8TEST ACTIVE 紅日回到 Auto-Fill 版（user 回報 ACTIVE 紅日變舊版）：

ce9eb2d
fix(v8test): ACTIVE red sun uses the OPEN Auto-Fill layout again

Status: CLOSED（Cfm 2026-10-01，bdbbb21；production real iPhone PASS，user）

- 原因：ACTIVE 紅日版型只存在各瀏覽器 localStorage（v8-red-sun-autofill-experiment-v1），預設 CURRENT（舊版、\n 原樣顯示）；
  且 Auto-Fill 任何一次錯誤會把 CURRENT 永久寫回。程式碼無法確認是哪次觸發，本機無法重現。
- 修正（/v8test only）：預設改為 OPEN 紅日同一組 Auto-Fill 數值；改用 v2 key（舊 v1 的 CURRENT 不再生效）；錯誤只在當頁退回 CURRENT、不寫入。
- 截圖：/v8test ACTIVE 紅日 = OPEN 紅日版型；/v8 不變。Regression PASS。
- real iPhone：pending

V8TEST Intro 改回影片（user 決定維持舊 Intro）：

984fab9
revert(v8test): play the video Intro again; 程式 Intro only with ?intro=code

Status: V8TEST DEPLOYED / VERIFY

- /v8test 預設回到影片 Intro（含 Step 2B contain + 緩衝完才預載）。
- 8d12425：/v8test 網址加 ?intro=fresh → 影片 Intro 每次載入都播（冷開測試用）；/v8 忽略此參數。
- 「程式 Intro」（bc29cbc，OPEN 圖層動畫）保留，只在 /v8test 網址加 ?intro=code 時播放，供比較；其預載也會啟動。
- /v8 不變。Local：預設 → 影片、?intro=code → 程式 Intro、/v8 → 影片；family PASS、0 errors。

Intro 載入速度比較（local，同一份 Batch 3 資產：d04ae40 影片 Intro vs 3d05337 程式 Intro；cold、真 HTTP cache）：

| 網速 | 影片：Intro / OPEN 完整 | 程式：Intro / OPEN 完整 | 到倒數前下載 |
| 4000kbps | 2.9→13.7s / 13.7s | 3.3→13.3s / 13.3s（完整播放） | 5032 → 4216KB |
| 1500kbps | 6.2→17.5s / 17.8s | 6.6→12.6s / 15.5s（關鍵圖 6s 未到 → 未播） | 2757 → 2305KB |
|  600kbps | 14.2→33.5s / 46.9s | 14.7→20.8s / 37.2s（未播） | 2896 → 2305KB |

- 省下影片 ~830KB；弱網 OPEN 提早 2.3s（1500）/ 9.7s（600）；好網路差不多。
- 缺點：弱網時程式 Intro 等關鍵圖最多 6s（期間舞台隱藏），之後直接顯示 OPEN、不播動畫。

V8TEST code-driven Intro（方案 A，/v8test only）：

bc29cbc
feat(v8test): code-driven Intro on the OPEN stage that ends exactly on OPEN

Status: CLOSED（Cfm 全部 2026-10-01，4c1f87b；production real iPhone PASS，user）

- /v8test 以 OPEN 本身圖層做 ~7s 開場（不再播影片）：墨染 → 雲/山/浪 → 龍入場 → 虎入場揮拍 → 羽球擊入太陽 → 太陽蓋章 → 進入戰局；最後一幀即 OPEN。
- 略過（1s 後出現）/ 點畫面略過 / Replay Intro / 每分頁一次 維持；Intro 期間倒數暫停，結束後開始。
- 關鍵圖 6s 未到 → 直接顯示 OPEN；prefers-reduced-motion → 不播。
- Intro 中離開 OPEN（進入戰局）→ Intro 立即結束，不留在 ACTIVE 上。
- /v8 不變（仍為影片 Intro）。Local：introflow / family（v8test、v8 kangxuan）PASS、0 page errors。
- real iPhone：pending

P-021 asset Batch 3（/v8test only）：

d04ae40
perf(v8test): resized plaques, rope ornaments, CTA parts and titles (asset Batch 3)

Status: CLOSED（Cfm 2026-10-01，bdbbb21；production real iPhone PASS，user）

- 新檔（原檔不動、/v8 仍用原檔）：plaque ×3 → 460px；繩飾 a/b → 220/300px；
  CTA blank + 文字 ×4 → 300px、帳單 → 220px、代報/代退 → 190px；康軒標題 640 → 420px；
  OPEN 進入戰局 700 → 480px（/v8test Step 1 critical URL 同步，同一 builder）。516KB → 273KB。
- 截圖 /v8 vs /v8test 一致。
- Local before（Batch 2）→ after：1500kbps Quick Pick 全部首屏 +5.1s → +3.8s；600kbps auto +13.0s → +10.4s。
- Step 1：600kbps 新 CTA 載完才倒數；CTA error 不自動進場、手動可進 PASS。Regression PASS。
- 註：600kbps 有 ~3 個 CTA 零件重複請求（預載進行中 ACTIVE 就 mount 的時間競爭，約 25KB，非本批造成）。
- real iPhone：pending

P-021 asset Batch 2（/v8test only，user 指示繼續）：

051d7dc
perf(v8test): resized identity tags, status stamps and CTA base (asset Batch 2)

Status: CLOSED（Cfm 全部 2026-10-01，4c1f87b；production real iPhone PASS，user）

- 新檔（原檔不動、/v8 仍用原檔）：
  identity 牌 ×2 → 200px 寬；狀態章 ×4 → 140px；cta-assembly base → 576px、front → 64px。580KB → 170KB。
- 截圖 /v8 vs /v8test 一致（平均差 0.9/255）。
- Local before → after（真 cache、cached identity）：
  1500kbps Quick Pick：ACTIVE+0.3s 7/23 → 11/23；全部 +5.9s → +4.7s
  1500kbps auto：23/23 維持
  600kbps auto：5/23 → 10/23；+15.6s → +13.0s；倒數時間不變
- Regression /v8/kangxuan、/v8test/kangxuan PASS。real iPhone：/v8test PASS（user 驗收 2026-10-01）；待 Cfm 才上 /v8

Real-iPhone issues（Batch 2 曾暫停）：

1. /v8 ACTIVE 雲朵框不見、數值有顯示 — c491044 fix(v8): serve the 450px ACTIVE cloud badges on all routes
   - Root cause（local 1500kbps 實測）：/v8 舊預熱要等全部 OPEN 圖（最多 15s），9s 自動進場前從未請求雲朵；
     ACTIVE mount 才請求，原圖 568KB，ACTIVE 後 11.0s 才畫出 → 數值浮在空白上。
     URL / 請求 / CSS / z-index / 檔案格式皆正常（本機 /v8 最終都 complete、可見）。
   - 修正：/v8 也改用已驗證的 450px 版（同圖，125KB）→ 11.0s → 7.1s。箭頭與其他圖仍只在 /v8test。
   - 剩餘 7.1s：/v8 沒有 Step 2A 預載（ACTIVE 才請求）；完整解法 = Step 2A 上 /v8（需 Cfm）。
   - Status：CLOSED — production /v8 real iPhone PASS（多次重整雲朵皆正常顯示，user 確認 2026-09-30）
2. /v8test ACTIVE 名單姓名在底圖前浮出 — 5008630 fix(v8test): keep list-panel names hidden until the panel art loads
   - Root cause：list panel 展開最多只等 1.5s panel 圖（452KB），timeout / error 都當 ready → 姓名浮在頁面上。
   - 修正（/v8test）：panel 內姓名等 panel <img> 真的 load 才顯示；失敗則改用紙色底板顯示。展開時機不變、無全域 gate。
   - Local：1500kbps 展開時 names hidden（圖未到）；擋掉圖 → 紙色底 + 姓名可讀；/v8 不變。
   - Status：V8TEST DEPLOYED / VERIFY
   - 實機錄影（4G）：面板第一次打開底圖 error → 紙色備援；約 6s 後 ?v8r 重試才出現。原版無此問題 → /v8test regression。
   - 4f5b669：面板底圖移出 Step 2A/2B 預載（只走 V8ListBuoys 原本的 3s / 點擊載入）；預載完成的 Image 物件釋放（保留 URL 去重）。
     根因未在實機證實（最可能：預載的第二個 loader + 常駐 ~40 個 Image 物件的記憶體壓力）。
     real iPhone（4G 2–3 格）：/v8test PASS — 名單面板正常、整體順暢（user 確認）。待 Cfm 才上 /v8。

V8TEST 3 fixes（/v8test only）：

647f677
fix(v8test): dragon load order, bfcache restore reset, animated auto-enter

Status: CLOSED（Cfm 全部 2026-10-01，4c1f87b；production real iPhone PASS，user）

1. OPEN dragon 載入順序：body（fetchpriority high）→ 爪 → 袋/背帶；每步等上一步 load 或 error；
   裝飾層 low priority；Step 2B intro queue 同順序。
   Local 1500kbps：/v8 爪/袋 10.7s 先出現、body 在自動進場前都沒出現；/v8test body 12.2s → 爪 13.4s → 袋 15.8s。
2. ACTIVE → Back → OPEN：本機 Chromium 重現不了（Back 為 fresh load，版面正常，TanStack 存的 scrollY=0）。
   程式上確認的缺口：bfcache 還原（pageshow persisted）不會觸發 scroll/touch，
   page lock 的 snap-to-top 與 viewport listener 都不跑，停在離開時的狀態（morph class、root scroll、visual viewport 位移）。
   修正：還原時結束 view transition、移除 morph class、scrollTo(0,0)、觸發 resize 重新量測（無任何 offset）。
   模擬測試：stale scrollY=400 + morph class → 還原後 scrollY=0、stageTop=0、class 清除。
   若 iPhone 仍重現，需要截圖 + 操作步驟（從哪個頁面進入、是否經過 LINE 登入）。
3. 倒數自動進場：改走手動「進入戰局」同一路徑（confirmV8MeetupSelection → enterV8Active：
   plaque launch → morph → staged entrance）。v8MorphBusyRef 防重複；自動動畫中連點 6 次 → ACTIVE 只進 1 次。
- Step 1 readiness 不變（龍身 error 仍不自動進場、手動 CTA 可進）；無新 gate；billing 未動；/v8 不變。
- Regression /v8/kangxuan、/v8test/kangxuan PASS。
- real iPhone Safari：pending

P-021 asset Batch 1（/v8test only）：

5ed870c
perf(v8test): resized sun badges and switch arrows (asset Batch 1)

Status: CLOSED（Cfm 全部 2026-10-01，4c1f87b；production real iPhone PASS，user）

- 新檔（原檔不動、/v8 仍用原檔）：
  - v8-cloud-shuttle/fee/court-time/limit-display-450.webp：450px 寬；568KB → 125KB
  - v8-meetup-switch-prev/next-v3-96.webp：96x98 lossy；172KB → 6KB
- 透明與比例保留；/v8 vs /v8test 截圖一致（ACTIVE 平均差 2.5/255，多為動畫；OPEN 0.3/255）。
- 不改 preload / readiness 邏輯（URL 來源 builder 自動帶入新檔名）。
- Local（Chromium 真 cache，cached identity）before → after：
  - 1500kbps Quick Pick：全部首屏 +7.5s → +5.5s；倒數 16.9s → 16.3s
  - 1500kbps auto-enter：ACTIVE+0.3s 16/23 → 23/23；+2.9s → +0.3s
  - 600kbps auto-enter：+22.7s → +16.5s；倒數 39.8s → 38.3s
- Regression /v8/kangxuan、/v8test/kangxuan PASS。
- real iPhone Safari：pending

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
CLOSED（user 2026-10-01：日常使用正常）

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
CLOSED（user 2026-10-01：日常使用正常）

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
CLOSED（user 2026-10-01：日常使用正常）

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
CLOSED（48bf75a；production real iPhone PASS，user 2026-10-01）

這是 performance task，
不是 P1-3 本體。

Goal：

一般 visitor 不 eager load V8TuningPanel。

只有開啟 tuning/debug 時 dynamic import。

570a8b4（/v8test）：V8TuningPanel 獨立 chunk（LazyV8TuningPanel）；控制台專用設定（targetControlKeys / targetVisibilityKeys / controlRanges / 複製設定格式化）移到 dragonPreviewPanelConfig.ts。
/v8test 開啟控制台才下載；/v8 仍在啟動時下載（等 Cfm）。Local 啟動 JS：967KB → 868KB；控制台開啟、複製設定（210 行）與 /v8 相同；family PASS。

---

## V8-SUN-MOTION

Status:
DONE（d9de47a，已在使用：Float / Pulse / Halo / Ring 開，Energy 關；由控制台 ACTIVE SUN MOTION 調整）

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
PAUSED — 帳單第二階段由 Codex 處理（user 2026-10-01）

Blocker：

V6 / D1 S4 Billing Source Audit

Rule：

V8 不重新算 official billing。

---

## P-022 UI — P-022 BASIC BILLING

Status:
PRODUCTION DEPLOYED / VERIFY

Promotion（Cfm，2026-09-30）：

f16a337
feat(v8): promote read-only season bill to production

- /v8test 版本 as-is 上 /v8：只拿掉 V8TEST gate，行為不變。
- 範圍（basic）：個人季費、上季請假抵扣、可展開請假日期、本季應付、已繳/未繳、paidAt。
- 不含（P-022 phase 2）：臨打費、歷史未繳、新的 total-due 邏輯。
- Local /v8 regression：帳單 未繳+警告 / 已繳+paidAt / 無紀錄 / auth / loading PASS；
  /v8、/v8/kangxuan、/v8test/kangxuan：cold / reload / CTA→ACTIVE / ACTIVE switch /
  Quick Pick current+different PASS，legacy UI 0，無 pageerror。
- production real iPhone Safari：pending → PASS 後才 CLOSED。

V8TEST（已驗證）：

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
- real iPhone Safari：/v8test PASS（user 核准 Cfm）

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
P-022 BASIC BILLING production verify / P-021 v2 step 1（/v8test PASS，待 Cfm）→ P-021 v2（先 read-only 診斷，經 V8TEST）→ 其他）

1. V8-ASSET-READY
2. iPhone Quick Pick final verify
3. Desktop + P-023 final verify
4. V6/D1 Billing Audit
5. P-022 Data/API decision
6. P1-3 Control Console Reorganization
7. Lazy Load / Sun Motion / lower-priority backlog

User 可以隨時重新指定 priority。
