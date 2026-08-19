// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  vite: {
    // GitHub Pages 專案網址需要 repository base path。
    // Lovable / local preview 則維持根目錄 /。
    base: isGitHubPagesBuild
      ? "/shuttle-burst-dynamic/"
      : "/",
  },

  tanstackStart: {
    // 保留 Lovable 原本的 server entry。
    server: {
      entry: "server",
    },

    // 只有 GitHub Actions build 才切換為純靜態 SPA。
    ...(isGitHubPagesBuild
      ? {
          spa: {
            enabled: true,
            prerender: {
              // GitHub Pages 需要真正的 index.html。
              outputPath: "/index.html",
              crawlLinks: false,
            },
          },

          // GitHub Pages 不需要因額外 SSR prerender 問題
          // 讓整個 static build 直接失敗。
          prerender: {
            failOnError: false,
          },
        }
      : {}),
  },
});