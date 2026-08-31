# V8 精準素材拆層與 Rig 資產規則

**Version:** 1.1  
**Project:** V8 Remotion Opening  
**Purpose:** Composite Asset → Exact Layer Extraction → Rig-Ready Asset → Remotion Animation

---

# 0. 最高優先級原則

## Static reconstruction success does not imply animation readiness.

**靜態疊回成功 ≠ Rig 可以使用。**

V8 素材只有依序通過：

EXTRACTION PASS  
→ RIG PASS  
→ VISUAL PASS  
→ APPROVED FOR REMOTION

才可以進入正式 Remotion Timeline。

任何一個 Gate 失敗，都不得以：

- 看起來差不多
- 風格相似
- 可以先用
- 後面再修
- 動起來應該看不出來

作為通過理由。

---

# 1. 核心原則

本規則適用於 V8 開場動畫所有既有 Composite 素材的：

- 拆層
- Layer Extraction
- Character Rig Preparation
- Background Parallax Preparation
- Rig Asset Reconstruction

最重要定義：

**Exact Layer Extraction ≠ Image Regeneration**

「拆層」不是「重新生成相似圖片」。

目標是保留原始 Composite 的：

- 構圖
- 外輪廓
- 比例
- 座標
- Anchor 關係
- 色彩
- 材質
- 美術風格
- 原始細節
- 視覺識別特徵

只將原本黏在一起、無法獨立動畫的視覺元素，轉換成可獨立控制的透明 Layer。

---

# 2. Source of Truth

每一個拆層任務必須指定唯一：

**SOURCE OF TRUTH**

例如：

`public/v8-preview/display/ukiyoe-cloud-v1-display.webp`

所有拆出的 Layer 必須以 Source of Truth 為唯一視覺基準。

禁止：

- 重新想像構圖
- 重新設計
- 美化
- 改變比例
- 改變位置
- 改變造型
- 改變主要色彩
- 新增裝飾
- 新增不存在的元素
- 以「相似風格」替代原圖
- 依文字描述重新生成整個素材

---

# 3. Exact Extraction 定義

合格的拆層應符合：

Original Composite  
≈ Layer A + Layer B + Layer C + ...

所有 Layer 使用原始座標重新疊合後：

**Recomposed Result ≈ Original Composite**

這是 Exact Extraction 最重要的判定依據。

漂亮但不同，不算 PASS。

---

# 4. Canvas Lock

同一 Composite 拆出的所有 Layer：

- Canvas width 必須相同
- Canvas height 必須相同
- Coordinate System 必須相同
- Origin 必須相同

例如 Source：

700 × 700

則：

`cloud-main-v2.png`  
= 700 × 700

`cloud-gold-strokes-v2.png`  
= 700 × 700

不得為了節省空白而各自裁成內容大小。

---

# 5. Coordinate Lock

拆層後，元素必須保留原始 Composite 座標。

例如原始 Gold Stroke 位於：

x = 420  
y = 180

拆出後仍應位於：

x = 420  
y = 180

禁止為了讓單張 Layer 看起來置中而重新排列。

---

# 6. Anchor Lock

同一 Composite 的所有拆出 Layer 必須：

- Canvas 相同
- Origin 相同
- Anchor 邏輯相同
- Coordinate System 相同

目標是讓 Remotion 能使用相同：

- left
- top
- width
- scale
- transform-origin

直接重新組合原構圖。

---

# 7. Alpha Transparency Rule

所有正式拆層素材必須使用真正 Alpha Transparency。

允許：

- PNG Alpha
- 其他經專案確認支援 Alpha 的格式

禁止：

- 黑底
- 白底
- 灰底
- 漸層底
- 將棋盤格畫進圖片
- 模擬透明背景

背景必須是真正：

**alpha = 0**

---

# 8. No Asset Sheet Rule

每個 Layer 必須是獨立檔案。

禁止：

`[ Cloud Main | Gold Strokes ]`

放在同一張 Asset Sheet。

正確：

`cloud-main-v2.png`

`cloud-gold-strokes-v2.png`

一個動畫 Layer = 一個可獨立控制的 Asset。

---

# 9. No Regeneration Rule

Exact Extraction 任務中，禁止使用：

- Image Regeneration
- Approximation
- Similar Asset
- Stylistic Recreation
- Placeholder

取代真正拆層。

如果目前工具無法完成 Exact Extraction：

**STOP**

回報：

`EXTRACTION BLOCKED`

不得自行改成「重新生成一張差不多的圖」。

---

# 10. Missing Pixel / Occlusion Classification

Composite 中若存在遮擋：

Layer A  
覆蓋  
Layer B

則 Source 本身可能沒有 Layer B 被遮住區域的完整 Pixel。

此時必須分類：

## A. EXACT VISIBLE-PIXEL EXTRACTION

原始可見 Pixel 可以直接分離。

## B. RECONSTRUCTION REQUIRED

被遮住的區域不存在完整 Source Pixel，需要補畫。

不得把 B 宣稱為 Exact Extraction。

---

# 11. Minimal Reconstruction Rule

如果 Rig 動畫需要露出原本被遮住的區域，可以執行：

**Minimal Reconstruction**

但必須：

- 只補必要遮擋區
- 不重新設計整個物件
- 延續鄰近紋理
- 延續原線條方向
- 延續原色彩
- 延續原材質
- 不增加新裝飾
- 不任意改變外輪廓

必須在 Asset Manifest 標示：

`Extraction Type: EXACT + MINIMAL RECONSTRUCTION`

---

# 12. Occlusion Recovery Rule

Character Rig 的關節、身體段落、尾巴、四肢等 Layer，不能只拆出目前可見區域。

如果動畫可能產生：

- Rotation
- Bend
- Follow
- Serpentine Motion
- Limb Movement
- Tail Swing

則必須補出必要的 Hidden Pixels。

補圖範圍至少應覆蓋預期最大動畫活動範圍。

補出的隱藏區域稱為：

**Reconstructed Bleed Zone**

---

# 13. Edge Quality Rule

拆層完成後必須檢查 Alpha Edge。

禁止：

- White Halo
- Black Halo
- Color Contamination
- Jagged Edge
- Excessive Edge Erosion
- Hard Cut on Soft Material

必須特別保護：

- 毛髮
- 鬍鬚
- 羽毛
- 飄帶
- 雲霧
- 浪花
- 墨氣
- 半透明材質

Soft Alpha 必須盡可能保留。

---

# 14. Motion Margin Rule

Layer 不得只依可見內容緊貼裁切。

必須保留透明 Motion Margin。

建議：

Background Layer：
至少保留約 5–10% 合理透明安全區。

Character Joint：
依 Pivot 與最大 Rotation Range 保留足夠安全區。

Long Element：
例如：

- Tail
- Whisker
- Ribbon
- Strap
- Mane

必須考慮最大擺動範圍。

任何：

- rotation
- scale
- spring
- follow-through
- procedural wave

都不得因 Canvas 邊界造成裁切。

---

# 15. Native Resolution Rule

正式拆層素材不得因目前手機顯示尺寸而過度縮小。

原則：

- 不低於 Source of Truth 可用解析度
- 優先保留 Source intrinsic resolution
- 若正式動畫可能 Scale > 1.2×，必須檢查解析度
- Camera Push-in 時不得出現明顯 Pixelation / Blur

手機是主要輸出目標，但不代表 Asset 可以低解析。

---

# 16. Visual Identity Lock

拆層、補圖、去背、清邊過程不得改變原始角色／背景的 Visual Identity。

必須鎖定：

- Hue
- Saturation relationship
- Material
- Ink density
- Gold-line thickness
- Scale texture
- Fur texture
- Brush character
- Original silhouette
- Character facial features
- Ukiyo-e visual language

補圖不能讓同一角色看起來像另一個版本。

---

# 17. Procedural Element Rule

適合由 Remotion 產生的元素，不必硬拆成 Bitmap。

優先考慮 Procedural：

- loose gold flecks
- tiny particles
- atmospheric haze
- subtle mist
- paper noise
- temporary glow
- ripple
- secondary ink drift
- collision particles
- impact flash
- shockwave

分類時標示：

`PROCEDURAL`

---

# 18. Asset / Animation Separation

Asset 負責：

**WHAT IT LOOKS LIKE**

Remotion 負責：

**HOW IT MOVES**

正式 Bitmap Asset 原則上不得烘焙：

- Speed Line
- Motion Blur
- Projectile Trail
- Temporary Glow
- Impact Flash
- Explosion
- Camera Blur
- Temporary Particle Effect

除非它本來就是 Source of Truth 不可分割的永久美術內容。

---

# 19. Background World Architecture

Background 使用：

**Multi-plane Parallax Scene Rig**

目標架構：

BackgroundWorldRoot
├─ Paper / Base
├─ Far Landscape
├─ Red Sun
├─ Mountains
├─ Clouds
├─ Mist
├─ Ocean
├─ Back Waves
├─ Mid Waves
├─ Foreground Waves / Foam
├─ Foreground Ink
└─ Gold / Atmosphere

不是所有 Layer 都必須 Bitmap。

可依內容分類：

- BITMAP PLANE
- PROCEDURAL LAYER

---

# 20. Time Sequence ≠ Z-Index

時間順序與 Z-index 是兩個不同概念。

V8 鎖定 Sequence：

WORLD ENTER  
↓  
WORLD SETTLE  
↓  
DRAGON / TIGER ENTER  
↓  
CHARACTER SETTLE  
↓  
ATTACK  
↓  
COLLISION

即使：

- Foreground Foam
- Foreground Ink
- Gold Flecks
- Mist

最終 Z-index 位於 Dragon / Tiger 前方，

仍然可以屬於 Background World，並在：

**WORLD ENTER**

階段完成進場。

不得因 Z-index 高就自動延後到角色進場。

---

# 21. Character Rig Architecture

Dragon / Tiger 使用：

**2D Articulated Character Rig / 2D Puppet Rig**

不能再將完整角色 Composite 當成最終動畫 Rig。

---

# 22. Dragon Rig Target

Dragon 建議結構：

DragonRoot
├─ Head
├─ Neck01
├─ Neck02
├─ Body01
├─ Body02
├─ Body03
├─ Body04
├─ Tail01
├─ Tail02
├─ TailTip
├─ FrontClaw
├─ RearClaw
├─ BagBase
└─ BagStrap

實際 Segment 數量可依 Source 調整。

不得為了符合此範例而過度拆分。

---

# 23. Dragon Motion Terminology Lock

未來要求 Dragon 蛇行時，正式 Motion System 定義為：

**Head-led Spline Follow**  
→ **Follow-the-Leader Chain**  
→ **Serpentine Wave Propagation**  
→ **Tail Follow-through**

「Dragon circles / coils / snakes / spirals」等視覺描述，不得被視為已自動包含上述 Rig。

禁止用：

**整張 Dragon Composite 沿 S-curve 移動**

冒充真正 Serpentine Body Motion。

---

# 24. Character Overlap / Bleed Rule

相鄰 Character Segment 不得只沿可見輪廓硬切。

必須保留：

**Overlap / Bleed Area**

目的：

當執行：

- Rotation
- Spline Follow
- Follow-the-Leader
- Serpentine Wave
- Delayed Follow
- Joint Bending

時，不得露出：

- transparent seam
- hole
- broken body connection

---

# 25. Pivot Planning Rule

每個 Rig Layer 必須記錄建議 Pivot。

例如：

Head  
→ neck connection

Front Claw  
→ shoulder / attachment joint

Tail01  
→ body-tail connection

Bag Strap  
→ strap attachment point

Pivot 不一定寫入圖片 Metadata，但必須記錄於：

**Asset Manifest**

---

# 26. Secondary Motion

適合使用 Secondary Motion 的元素包括：

- Tail
- Mane
- Fur Accent
- Whisker
- Bag
- Bag Strap
- Ribbon
- Loose Decoration

可使用：

- Follow-through
- Overlapping Action
- Inertial Follow
- Drag
- Damped Oscillation

不得全部與 Character Root 完全同步。

---

# 27. Rig Compatibility Validation

Character Asset 完成後，不得只做 Static Overlay Test。

必須進行 Rig Compatibility Test。

最低測試：

- Pivot Rotation +10°
- Pivot Rotation -10°
- Pivot Rotation +20°
- Pivot Rotation -20°
- Scale 0.9
- Scale 1.1
- Segment Follow
- Tail Swing（適用時）
- Limb / Claw Articulation（適用時）
- Seam Inspection
- Gap Inspection
- Exposed Hidden Region Inspection

只要一動就露洞：

RIG FAIL

---

# 28. Background Motion Validation

Background Layer 完成後至少驗證：

- independent translation
- restrained scale change
- parallax offset
- layer overlap
- foreground/background stacking
- no unintended cropping
- WORLD ENTER timing compatibility

不能只驗證靜態疊合。

---

# 29. Mandatory File Test

每組 Extraction 必須檢查：

[ ] 每 Layer 獨立檔案  
[ ] Alpha Transparency  
[ ] Canvas 正確  
[ ] Coordinate Lock  
[ ] Anchor Lock  
[ ] 無假透明背景  
[ ] 無 Asset Sheet  
[ ] 無意外 Crop  
[ ] Resolution 合格  

---

# 30. Mandatory Overlay Test

所有拆出 Layer 使用：

x = 0  
y = 0  
scale = 1  
rotation = 0

重新疊合。

輸出：

`recomposed-preview.png`

---

# 31. Mandatory Difference Test

比較：

Original Composite  
vs  
Recomposed Preview

至少檢查：

- silhouette
- position
- scale
- major color
- major detail
- missing region
- unexpected new pixel
- edge contamination
- reconstructed region

必要時輸出：

`difference-preview.png`

---

# 32. Three-Gate Acceptance

## GATE 1 — EXTRACTION PASS

要求：

- Source 正確
- Layer 分離正確
- Alpha 正確
- Canvas / Coordinate / Anchor 正確
- 無重新生成替代
- Reconstruction 有標記

## GATE 2 — RIG PASS

要求：

- Pivot 可用
- Overlap 足夠
- Motion Margin 足夠
- Hidden Pixel Recovery 足夠
- Rotation / Follow 不露洞
- Character / Background 動態測試成功

## GATE 3 — VISUAL PASS

要求：

- Recomposed Result 接近 Original
- Visual Identity 未改變
- 沒有不合理新元素
- 邊緣品質合格
- 動態時仍保持原美術語言

只有：

EXTRACTION PASS  
+ RIG PASS  
+ VISUAL PASS

才能標記：

**APPROVED FOR REMOTION**

---

# 33. Cloud v2 Reference Case

SOURCE OF TRUTH:

`ukiyoe-cloud-v1-display.webp`

Target Bitmap Layers:

`cloud-main-v2.png`

`cloud-gold-strokes-v2.png`

Procedural Later:

`cloud-small-flecks`

`cloud-depth-mist`

要求：

cloud-main-v2.png  
+ cloud-gold-strokes-v2.png  
≈ ukiyoe-cloud-v1-display.webp

並保持：

- Same Canvas
- Same Origin
- Same Coordinate System
- Same Composition

禁止：

- 重新畫另一朵雲
- 改變雲團排列
- 重新設計金線
- 左右排列成 Asset Sheet
- 黑底
- 漸層底
- 棋盤格假透明
- 生成「類似浮世繪雲」

---

# 34. Tool Failure Rule

如果目前工具無法完成 Pixel-Level Exact Layer Extraction：

立即停止。

回報：

**EXTRACTION BLOCKED**

並說明原因。

例如：

- Cannot preserve source pixels
- Cannot create independent alpha layers
- Cannot preserve canvas/coordinates
- Overlapping artwork requires reconstruction
- Tool is regenerating instead of extracting

禁止連續使用 Image Generation 嘗試「生成得更像」。

應改用適合：

- Pixel-Level Editing
- Mask Extraction
- Alpha Matting
- Layer Separation

的工具／流程。

---

# 35. Codex Rule

Codex 主要負責：

- Repository Audit
- Asset Manifest
- Layer Integration
- Rig Implementation
- Procedural Animation
- Render Verification
- Build / Verify
- Git Diff
- Commit / Push

Codex 不應自行：

- 重新生成缺少的正式美術 Asset
- 用 Placeholder 冒充正式 Layer
- 將 Similar Asset 視為 Exact Extraction

缺 Asset：

**BLOCKED**

而不是自行替換。

---

# 36. Asset Manifest Minimum Fields

每個正式 Layer 至少記錄：

Asset Name  
Source of Truth  
Extraction Type  
Canvas Size  
Coordinate System  
Anchor  
Suggested Pivot（Rig asset）  
Overlap / Bleed  
Motion Margin  
Resolution  
Z-index / Layer Group  
Bitmap / Procedural  
Reconstruction Region  
Extraction Status  
Rig Status  
Visual Status

---

# 37. Final Principle

對 V8 而言：

**漂亮但不同 ≠ PASS**

**相似風格 ≠ PASS**

**重新生成 ≠ 拆層**

**靜態看起來正確 ≠ Rig Ready**

真正完成是：

> 原本的作品沒有被重新設計，而是從一張不能獨立動畫的 Composite，轉換成多張可獨立控制、可建立 Rig、可程序化動畫，並且重新疊合後仍保持原始作品視覺身份的 Layer。

只有完成：

EXTRACTION PASS  
→ RIG PASS  
→ VISUAL PASS

才是：

# APPROVED FOR REMOTION
