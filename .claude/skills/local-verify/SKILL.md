---
name: local-verify
description: 本機驗證前端＋Worker 改動時用：本機 wrangler dev（--persist-to，ADMIN_PASSWORD=localdemo）、vite dev 5173、假 LINE token、Playwright 用 page.route 把正式 Worker 轉到 127.0.0.1:8787、測前備份測後還原本機 D1，最後產生 iPhone 驗收清單。
---

# /local-verify — 本機驗證（不碰正式資料）

腳本在 Worker repo：`/home/user/badminton-signup/worker/tools/local-verify/`（說明看同目錄 README.md）。
沒有 clone：先 `add_repo ksp4022-ko/badminton-signup` 再 clone 到 `/home/user/badminton-signup`。

## 步驟（在 /home/user/badminton-signup/worker）
1. `npm ci`；前端 repo 沒有 node_modules 就 `npm install --no-audit --no-fund --no-package-lock`。
2. 第一次：`tools/local-verify/bootstrap-d1.sh`（本機 D1 在 `~/.badminton-local/state`，repo 外）。
3. 測前備份：`tools/local-verify/d1-backup.sh`。
4. Worker（背景）：`setsid tools/local-verify/start-worker.sh > <scratchpad>/worker.log 2>&1 &`，等 log 出現 `Ready on`。
   管理密碼 = `localdemo`（只在本機；正式密碼絕不索取、不使用）。
5. 前端（背景，在 /home/user/shuttle-burst-dynamic）：`setsid npx vite dev --port 5173 --strictPort --host 127.0.0.1 > <scratchpad>/vite.log 2>&1 &`。
6. 假 LINE 登入：`node tools/local-verify/fake-line-token.mjs [--admin] [--member <id> --site <site> --slot <slotKey>]` → 拿 token。
7. 截圖／操作：`node tools/local-verify/playwright-local.mjs /v9test/kangxuan/ --token <token> --out <scratchpad>/x.png`（375 寬；`--width 320` 測窄螢幕）。
   自己寫流程時保留 `page.route(正式 Worker 網址 → 127.0.0.1:8787)`，否則會打到正式資料。
8. 測完：`pgrep -fa wrangler` 找 PID 後 `kill`（不要 `pkill -f`），再 `tools/local-verify/d1-restore.sh`。

## 注意
- 種子資料只有一場舊聚會：V9 報名頁可能停在「讀取聚會中…」，需要時先用本機 V10（/v10CtlPanel，密碼 localdemo）開賽季／聚會。
- 只測 /v9test、/v10CtlPanel；/v9、/v8 正式頁只做「沒被影響」的回歸檢查。
- 必跑：`npx tsc --noEmit --pretty false`、`npm run build`、`git diff --check`；Worker 有改則 `npm run check`。
- 瀏覽器自動化不是 iPhone 驗收。

## iPhone 驗收清單（回報時放在程式碼區塊外）
- 寫成 3～6 條，每條：網址（/v9test/… 或 /v10CtlPanel）＋要點哪裡＋應該看到什麼。
- 一定包含：375／PWA 版面不爆版、相關按鈕實際送出一次、/v9 正式頁照舊。
- 驗收通過前不標 CLOSED／已驗收。
