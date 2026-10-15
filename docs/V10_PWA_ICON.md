# V10 PWA icon

狀態：已完成資產與程式設定，等待 PR 合併／部署及 iPhone 實機確認。

- 原圖：使用者提供的龍虎羽球控制面板 JPEG（1254×1254）；原檔未修改，沒有重新繪製角色。
- 資產：public/v10-pwa/icon-180.png、icon-192.png、icon-512.png、icon-maskable-512.png、favicon-32.png。
- Maskable：保留米色不透明背景，原圖縮至畫布的78%；已檢視產出並檢查彩色圖案／黑線位於中央40%半徑安全圈。
- 設定：獨立 manifest，id／start_url／scope 均指向 ../v10CtlPanel（符合 Router 去除尾斜線後的實際 URL）。資產路徑相對 manifest，支援本機與 GitHub Pages repo 子路徑。
- iPhone：route head 設定 apple-touch-icon 180×180、主畫面名稱 V10 控制台，以及 standalone／viewport-fit=cover。
- 驗證：TypeScript、GitHub Pages 模式 build、局部 ESLint、diff check；Chrome 實際 DOM確認 manifest／apple icon，V9test沒有V10圖示；PNG尺寸與alpha均確認。
- 限制：沒有新增離線模式或保存管理密碼；iPhone 主畫面安装、圓角裁切與既有图示缓存仍待實機確認。
- Worker、D1、V7/V8/V9程式、共用root及部署workflow未修改。
