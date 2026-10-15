---
name: codex-round
description: 要交給 Codex 的 Worker（badminton-signup）審查／部署指令時用：產生 V6-0xx 更新回合的複製區塊（審查重點、npm run check、部署、部署後 HTTP 驗證、回報 Cloudflare version id）。不索取也不使用管理密碼。
---

# /codex-round — Codex 審查＋部署指令

Worker repo `ksp4022-ko/badminton-signup`（本機 clone：`/home/user/badminton-signup`），規則見該 repo `AGENTS.md`。

## 1. 取回合號
- `git -C /home/user/badminton-signup log --oneline -30 | rg -o "V6-0[0-9]+" | sort -u | tail -1` → +1。
- 2026-10-15 最新是 V6-042（Cloudflare version 45212577）；下一個 V6-043。
- 審查修正沿用同一個號（`V6-0xx review` / `review 2`）；已部署後的修正用新號。
- 只有討論、沒改程式的回合不佔號。

## 2. Claude 先做
- 在 Worker repo 實作 → `cd worker && npm run check` 通過 → commit（訊息 `V6-0xx (T-xx/V9-xxx): 一句說明`）→ push main。
- 前端有對應改動時一起列出前端 commit。
- 不 force push、不 hard reset。

## 3. 交給 Codex 的區塊（一個 ```text 區塊，可直接複製）

```text
UPDATE ROUND: V6-0xx
MODE: xtog-audit → deploy-lite（審查通過才部署）
EXPECTED HEAD: <worker main commit>

審查重點：
- <這次改了什麼、哪些情況要特別看（例：批次寫入前重新檢查狀態）>
- 不可動：rearrangeSignups、順位、請假／回歸、30 分鐘寬限、計費公式、D1 schema（除非本回合明列）

步驟：
1. git pull --ff-only，確認 HEAD = EXPECTED HEAD（不符就停）
2. cd worker && npm run check（失敗就停，不部署）
3. 若有新 migration：npx wrangler d1 migrations apply badminton_signup_v6_alpha --remote
4. 審查有問題：回報問題，不部署
5. 通過：cd worker && npm run deploy
6. 部署後 HTTP 驗證（不需要管理密碼）：
   curl -s https://badminton-signup-v6-alpha.badminton-signup-v6-worker.workers.dev/api/v6-alpha/health
   curl -s -o /dev/null -w "%{http_code}\n" https://badminton-signup-v6-alpha.badminton-signup-v6-worker.workers.dev/admin
   <本回合相關的公開 API，例：/api/v8-shuttle/sites/kangxuan/season-confirm>
7. 回報：AGENTS.md 標準格式，含 CLOUDFLARE VERSION ID

注意：不要向使用者索取、也不要使用管理密碼（ADMIN_PASSWORD）；需要管理權限的驗證留給使用者在 V10 自己點。
```

## 4. Codex 回報之後
- 讀 Codex 回報：check PASS、HEAD 對、version id 有值才算部署成功。
- 文件：在對應 T-xx／V9-xxx 狀態寫「Worker V6-0xx 已部署 <version id 前 8 碼>」，commit `docs: …`。
- 接著給使用者 iPhone 驗收清單（放在程式碼區塊外）。
