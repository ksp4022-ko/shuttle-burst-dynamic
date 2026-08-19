# Shuttle Dynamics

# 🏸 羽球報名 PWA 極致動態 UI/UX 設計方案

## 1. 設計核心概念 (Design Concept)

本方案旨在打破傳統網頁的方形表單格式，創造一個完全非方正、流線型、實物融合，且具備 Flash 時代極致動態質感的高級運動 App 體驗。透過物體聚合與轉場動態，強化使用者的情境代入感。

*   **視覺風格**：高級運動風（風格 B - 深碳灰背景 + 碳纖維質感 + 金屬金/螢光綠點綴）。

*   **技術路徑**：SVG（向量結構） + Pixi.js (Canvas 高性能聚合動態) + GSAP (轉場與智慧按鈕)。

---

## 2. 核心視覺流程與動態描述 (Visual Flow)

### 階段 1：進場聚合 - 分子拍框成型 (載入中 $\rightarrow$ 完成)

*   **讀取中（分子漂入）**：使用者進入頁面，畫面上即出現數百個金色與螢光綠的微小幾何顆粒（小分子）。這些分子由畫面**左右兩側以流體、不規則的方式飄入**，在中央形成紊流。此時下方輸入框與名單皆不顯示。

*   **讀取完成（聚合）**：數據載入完成的瞬間，所有小分子精準**聚合**到預先設計好的、由金色細線構成的**橫躺羽球拍**路徑上。球拍瞬间成型，並產生輕微的發光震動（暗示成型）。

### 階段 2：初始入口 - 選擇聚會

*   **畫面呈現在**：球拍聚合完成後，在球拍下方（原本按鈕位置）顯示一個單一的、簡約的圓角膠囊按鈕，文字為**「選擇聚會」**（螢光綠）。

*   **互動**：點擊按鈕，彈出磨砂質感的清單彈窗。使用者確認後，進入核心轉場。

### 階段 3：核心過場 - 球拍斜立與多聚會陰影

*   **球拍立起動態**：橫躺的分子球拍進行 3D 旋轉與縮放，緩慢但充滿能量地**斜立起來**（取代原本中央數據樞紐的位置），同時「選擇聚會」按鈕消失。

*   **陰影產生（多聚會象徵）**：球拍斜立完成後，在主球拍後方生成 2～4 個金色細線的**球拍陰影圖騰**（非實心）。這些陰影輕微上下漂浮，象徵其他可用聚會。

### 階段 4：功能狀態呈现

*   **橢圓拍框資訊（數據樞紐）**：斜立球拍的橢圓拍框中浮現顯示聚會資訊（日期、上限、費用、用球）。數據成圓環狀排列，數據圍繞著羽球拍。

*   **拍桿與手把流線區（身分與操作整合）**：

    *   **左側 (季打請假/消假)**：整合「金色金屬環鎖」智慧按鈕。顯示超大清晰的**「季打請假 / 消假」**字樣。

    *   **右側 (臨打報名)**：上方保留姓名輸入框，下方是螢光綠的**「我要報名」**智慧按鈕。

---

## 3. Lovable 溝通指令集 (Prompting Guide)

請將以下結構化指令提供給 Lovable 的 AI，以實現正確的動態與邏輯：

### A. 第一階段：分子聚合與初始按鈕

```text

我要建立一個非方正、打破方形排版格局、具備極致 Flash 動態質感的羽球報名網頁。不純粹用 CSS 完成。

**具體動態要求（開場與聚合）**：

1. **載入中（分子漂入）**：進到頁面時，畫面上應有數百個金色與螢光綠的**幾何小分子**，由畫面**左右兩側以流體飄入**。

2. **聚合（成型）**：讀取完成後，所有小分子精準**聚合成一隻橫躺的簡約線條球拍**（黑金美學）。聚合後球拍產生發光震動。

3. **聚合後**：橫躺球拍下方顯示一個簡約的螢光綠『**選擇聚會**』入口按鈕。

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shuttle-burst-dynamic.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/32ed1a1f-fed5-4bd5-b60b-572e9a48e759).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
