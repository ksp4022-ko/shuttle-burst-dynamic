// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubPagesBuild = process.env["GITHUB_ACTIONS"] === "true";

export default defineConfig({
  vite: {
    // GitHub Pages 使用 repository 子路徑。
    // Lovable / local preview 維持原本根目錄。
    base: isGitHubPagesBuild
      ? "/shuttle-burst-dynamic/"
      : "/",
  },

  tanstackStart: {
    // 保留 Lovable 原本 server entry。
    server: {
      entry: "server",
    },

    // GitHub Pages build 才啟用純靜態 SPA shell。
    ...(isGitHubPagesBuild
      ? {
          spa: {
            enabled: true,
            prerender: {
              outputPath: "/index.html",
              crawlLinks: false,
            },
          },

          prerender: {
            failOnError: false,
          },
        }
      : {}),
  },

  // 關鍵修正：
  // GitHub Actions 建置 GitHub Pages 時不要讓 Lovable Nitro
  // 把 server 輸出改到 .output/server。
  // Lovable 本身的 build / preview 則維持原設定。
  ...(isGitHubPagesBuild
    ? {
        nitro: false,
      }
    : {}),
});