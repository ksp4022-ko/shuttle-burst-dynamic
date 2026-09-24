# V8 Shuttle 互動更新交接（Active 頁與開場轉場）

## 共用規則（所有任務適用）
- 只改前端顯示與互動，嚴禁修改後端邏輯（D1 schema、付款、grace rules）與任何 API 呼叫
- 所有結果（正取／候補、名次、人數）一律以 API 回傳為準，前端不自行推算
- 不把共用模組抽成共用元件（Shared Component）；OPEN-SUN-COPY 照原計畫進行
- 素材以預先合成的圖片為主，不用 CSS 拼裝複雜圖像；缺素材先回報，不要自行修圖
- 所有動畫支援減少動態（prefers-reduced-motion）：改為 200–300ms 淡入淡出
- 驗收一律在 iPhone Safari 實機
- 依下列順序逐項執行，每項完成後回報一次 TASK / STATUS / LINK / NEXT，再進行下一項

參考原型（只看互動與時間，外觀以實際素材為準）：
- ENTER-MORPH：https://claude.ai/artifact/X9qbn7z67MMbaQtXPgzKJg
- SCROLL-FEEDBACK：https://claude.ai/artifact/7HqNXzFBrt6rqXTvaHcvmk（彈窗部分忽略）
- CTA-DRUM：https://claude.ai/artifact/9nkFmrRccfZmBwt7JZtxeh（第 4 格）
- LIST-BUOYS：https://claude.ai/artifact/1W1RrqAgFbTkXJWeheTP9b

---

## 1. CTA-DRUM — 告假 CTA 晃動改為「戰鼓輕敲」
- 移除現有搖擺（Sway）動畫；保留現有光影特效，不改其效果與時間
- 套用在 CTA 所有狀態（告假、消假，以及日後新增的文字狀態）
```css
@keyframes drum-knock {
  0%, 78%, 100% { transform: scale(1); }
  82% { transform: scale(1.07); }
  86% { transform: scale(0.99); }
  90% { transform: scale(1.05); }
  95% { transform: scale(1); }
}
/* animation: drum-knock 3.6s ease-out infinite; transform-origin: 50% 50%; */
```
- 與光影並存：若光影也用 transform 或 filter，戰鼓放在外層包裹元素（Wrapper）；若光影是週期性，錯開兩者高峰
- 暫停條件（結束後恢復）：彈窗開啟、送出中（Loading）、印章或翻牌等回饋動畫播放中、停用（disabled）
- 按下回饋：覆蓋戰鼓，scale 1 → 0.93 → 1、brightness(1.2)，280ms ease-out
- 減少動態：關閉戰鼓，光影依現有設定

## 2. SCROLL-FEEDBACK — 告假／消假／代報／代退 同頁動態回饋
- 沿用現有彈窗（Modal），不改外觀、文字與確認流程；只加「送出中」與「成功後」回饋
- 送出中：確認按鈕顯示轉圈＋「送出中」並停用；失敗時彈窗不關閉、顯示錯誤、按鈕恢復
- 成功後（彈窗關閉約 200ms 後開始）：
  - 告假：「正取」章淡出 160ms → 紅色「請假」章蓋下 scale(2.3) rotate(-24deg) → 62% scale(.9) → scale(1) rotate(-12deg)，420ms cubic-bezier(.5,0,.6,1) → 畫面輕震 ±2px 180ms；名字透明度降約 45%（400ms）；按鈕換「消假」；木牌翻牌；Toast「已告假，名額已釋出」
  - 消假：依 API 結果，回正取 → 紅章淡出、「正取」章重新蓋下（角度 0）；排入候補 → 蓋「候補」章、Toast 顯示候補名次；名字恢復、按鈕換回「告假」、木牌翻牌
  - 代報：木牌翻牌；Toast「已代報 {名字}，正取第 N 位」或「候補第 N 位」
  - 代退：木牌翻牌；Toast「已代退 {名字}」
- 木牌翻牌（Flip）：rotateX 0→90deg（160ms ease-in）→ 換數字 → -90deg→0（420ms ease-out），過程中金色 text-shadow 閃一下
- Toast：深藍底、金邊、米色字，位於名單浮標上方，2.6 秒自動消失（可沿用現有樣式）
- 數字若烤在木牌圖裡，改為圖上疊文字；做不到先回報
- 「請假」「候補」印章素材若需新增，先回報所需尺寸，不要用 CSS 硬畫
- 先確認：代退若後端有復原 API，Toast 加「復原」停留 5 秒；沒有就不做，回報即可
- 驗收：四個操作不離開頁面、不整頁重新整理；連點只送出一次；網路失敗時頁面狀態不變；實際結果與改動前一致

## 3. LIST-BUOYS — 頁面鎖定＋名單浮標
素材：`list-buoys/` 資料夾（header-leave.png、header-main.png、header-wait.png、wave-band.png、layout.json），名單元件沿用現有整張 PNG（1448×1086，透明底）。座標全部在 layout.json。

### 頁面鎖定
- Active 頁整頁不可上下左右滑動：html、body `overflow: hidden; overscroll-behavior: none; height: 100dvh`
- `touchmove` 在名單捲動區以外一律 `preventDefault`（passive: false）

### 收合狀態
- 畫面最底部放 wave-band.png（寬 100%、貼齊底部；上緣已做波浪淡出，底部縫隙已補滿）
- 三張標頭貼圖浮在海浪帶上，位置與寬度見 layout.json 的 collapsedHeaders_viewportPercent
- 浮動（Bob）：
```css
@keyframes bob {
  0%, 100% { transform: translateY(0) rotate(-1.4deg); }
  50% { transform: translateY(-7%) rotate(1.4deg); }
}
/* 2.8s ease-in-out infinite；transform-origin: 50% 70%；
   animation-delay 依序 -0.6s / -1.3s / -2.0s，三個錯開像隨浪起伏 */
```
- 三張貼圖為按鈕（button），aria-label：季打請假名單、正取名單、備取名單

### 展開（點任一標頭）
- 名單元件寬 100%、底部貼齊畫面底部
- 元件：translateY(+37.6% 元件高) opacity 0 → 25% 時 opacity 1 → 75% 時 translateY(-1.3%) → 0；520ms cubic-bezier(.25,.8,.35,1)
- 三張貼圖同時以相同時間與曲線，移動到元件上對應標頭位置（layout.json headers.center，用 getBoundingClientRect 換算），到位後隱藏，由元件本身的標頭接手
- 背景遮罩 rgba(14,20,34,.4) 淡入
- 被點的那一欄閃一下金框（1.4s）
- 元件透明區域不攔截點擊（pointer-events: none），只有名單捲動區可互動

### 名單捲動區
- 位置見 layout.json listAreas，疊在元件上的 HTML 文字
- `overflow-y: auto; overscroll-behavior: contain; touch-action: pan-y`，隱藏捲軸
- 上下邊緣用 mask-image 淡出，暗示還有內容
- 正取名單兩欄，其餘一欄；自己的名字金底標示
- 備取無人時顯示「目前沒有人候補」

### 收回
- 6 秒無操作自動收回（捲動、觸碰名單區會重新計時）；元件底部一條金色細線隨倒數縮短
- 點遮罩立即收回
- 收回動畫 380ms cubic-bezier(.5,0,.8,.4)：元件下沉、貼圖從標頭位置回到海浪帶，恢復浮動
- 展開與收回動畫進行中忽略點擊

### 驗收
- 整頁無法捲動，名單內可捲且不會帶動整頁
- 收合時海浪帶與畫面無切割線
- 展開、收回時貼圖與元件標頭交接無跳動

## 4. ENTER-MORPH — 「進入戰局」轉場（Opening → Active）
- 保留兩個路由，進入時使用 TanStack Router 的 viewTransition 選項
- 開場頁停留時預載（Preload）Active 頁主要圖片，避免轉場卡頓或閃白

動畫順序（ms，從點擊起算）：
1. 按下回饋 0–420：匾額放大 1.08、提亮加金光，再放大 1.18 淡出
2. 紅日移動 120–940：兩頁紅日設同一 view-transition-name（如 v8-sun），cubic-bezier(.6,0,.2,1)
3. 水墨換景 150–1000：::view-transition-new(root) 以 clip-path: circle() 從按鈕中心擴散 0% → 130%，外圈深藍半透明墨環同步擴散淡出；cubic-bezier(.5,0,.3,1)
4. 資訊雲飄入 700 起，間隔 90、各 560：球種、場時從右 +55px；上限、費用從左 -55px；opacity 0→1、blur(6px)→0；cubic-bezier(.2,.7,.2,1)
5. 木牌垂落 880–1640：transform-origin 約 30% 0%；translateY(-35%) rotate(-5deg) → 55% translateY(2%) rotate(2.5deg) → 80% rotate(-1.2deg) → 歸位
6. 卷軸展開 1050–1700：clip-path inset(0 0 100% 0) → inset(0)；cubic-bezier(.3,.6,.2,1)
7. 名單浮標升起 1300–1780：海浪帶從底部升起（translateY(100%) → 0），三張標頭貼圖隨後依序浮出（間隔 80），落定後開始浮動

- 步驟 4–7 只在從「進入戰局」進入時播放（router state 旗標）；直接開網址或重新整理直接顯示最終畫面
- 動畫中點擊畫面：全部跳到結束狀態
- 不支援 View Transitions（iOS 18 以前）：直接切換，步驟 4–7 照常播放
- 動畫期間禁止重複點擊「進入戰局」
- 雲朵、木牌、卷軸若不是獨立 DOM 元素，先回報，不要自行拆圖
- 驗收：紅日平滑移動、無閃白、無版面跳動；返回鍵回 Opening 正常，可重播；所有功能與改動前一致
