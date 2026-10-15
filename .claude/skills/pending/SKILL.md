---
name: pending
description: 使用者說「pending」或要記錄待辦時用：V9（球員端 /v9）記到 docs/V9_PENDING.md（V9-NNN），V10 控制台（/v10CtlPanel）記到 docs/V6_ADMIN_BASELINE.md §8（T-NN）。只記錄、不改程式；使用者說「開工」才實作。
---

# /pending — 記錄待辦（不改程式）

## 1. 判斷歸屬
- 球員端 V9 畫面／流程（/v9、/v9test）→ `docs/V9_PENDING.md`，編號 `V9-NNN`。
- V10 控制台（/v10CtlPanel，管理端）→ `docs/V6_ADMIN_BASELINE.md` §8 表格，編號 `T-NN`。
- 同時牽涉兩邊：記在主要那一邊，另一邊的「內容」寫「見 V9-xxx／T-xx」。
- 分不出來就問使用者一句。

## 2. 取號（不重複、不重用）
- V9：`rg -o "V9-[0-9]{3}" docs/V9_PENDING.md | sort -u | tail -1` → 最大號 +1。
- V10：最大 T 號要同時看 §8 和歷史檔 `docs/V6_ADMIN_HISTORY.md`：
  `rg -o "\| T-[0-9]+" docs/V6_ADMIN_BASELINE.md docs/V6_ADMIN_HISTORY.md | sort -t- -k2 -n | tail -1` → +1。
- 撞號過（V9-030→035、V9-037→043）：改號時在問題欄註明「原編號 …，日期 改號」。

## 3. 記錄格式
- V9：`| V9-NNN | 問題（含日期、裝置、截圖描述） | （確認後填） | 待討論 | |`
- V10：`| T-NN | YYYY-MM-DD | 內容 | Pending |`
- 寫使用者的原話重點＋可觀察到的現象；不要寫還沒查證的原因。

## 4. 狀態流程
待討論 → 討論中（提方案，可附本機截圖但不上線）→ 已確認（定案寫進方案欄）→ 使用者說「開工」才實作 → 完成（寫 commit、部署／驗收狀態）。
- 「開工」沒指定編號 = 做所有「已確認」的項目。
- 使用者沒說 pending 的一般要求照平常流程，不進清單。

## 5. 完成後
- V9：狀態「完成」、Commit 欄填 hash；/v9test 驗收後才上 /v9。
- V10：狀態寫「已完成並驗收（日期 iPhone）」後，把整列搬到 `docs/V6_ADMIN_HISTORY.md`，§8 只留未完成項目。

## 6. 規則
- 記錄這一步只改文件，commit 訊息 `docs: pending V9-NNN …` / `docs: pending T-NN …`。
- 回覆繁體中文、簡短：編號＋一句摘要＋下一步（等討論／等開工）。
