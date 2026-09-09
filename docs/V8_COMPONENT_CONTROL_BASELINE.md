# V8 Component Control Baseline

Status: LOCKED
Scope: V8 frontend only

This document is the single source of truth for all new V8 visual components.

Before creating or modifying a V8 visual component, read and follow this document.

## 1. Standard Visual Controls

Every independently positioned V8 visual component must support:

- X
- Y
- Scale
- Rotation
- Opacity
- Z-index

Do NOT add a per-component Visible control.

Visibility is managed by the existing shared/global visibility control in the V8 control panel.

### Parameter meaning

X:
Horizontal position.

Y:
Vertical position.

Scale:
Overall component scale.

Rotation:
Component rotation angle.

Opacity:
Component transparency.

Z-index:
Stacking order. When adjusting z-index, also verify ancestor stacking contexts.

## 2. Text Controls

Any component containing adjustable text must additionally support:

- Font Size
- Max Width
- Letter Spacing
- Line Height
- Text Align
- Font Weight

### Font Size
Base text size.

### Max Width
Maximum horizontal space available to the text.

For complete-name display, long names should auto-fit / shrink instead of using ellipsis.

### Letter Spacing
Controls spacing between characters.

### Line Height
Controls vertical text space.

Must preserve descenders such as:
y, g, p, q, j.

### Text Align
Supported values as appropriate:
- left
- center
- right

### Font Weight
Controls text weight.

Recommended control-panel options:
- Normal
- Semi Bold
- Bold
- Black

Numeric CSS font-weight values may be used internally.

## 3. Visibility

Do not create local Visible toggles for individual components.

Use the V8 control panel's existing shared visibility system.

## 4. Guides

Do NOT implement:
- Safe Area guides
- Center Line guides
- Anchor guides
- Component Bounds guides

Guide systems are not part of the current V8 control baseline.

## 5. New Component Requirement

When adding a new independently positioned V8 visual component:

1. Implement the component.
2. Register the standard visual controls.
3. If it contains adjustable text, register the text controls.
4. Use the existing shared visibility system.
5. Preserve the mobile-first V8 layout.
6. Do not modify V7 unless explicitly requested.
7. Do not modify API / D1 / signup business logic unless explicitly requested.

## 6. Identity / Meeting Status Semantics

Identity:
- 季打
- 臨打

Meeting Status:
- 正取
- 備取
- 季打請假

Identity and meeting status are separate concepts.

Do not merge them into a combined text label such as:
季打｜正取

## 7. Source of Truth

This document is authoritative for V8 visual-component control parameters.

AGENTS.md and CLAUDE.md must reference this document rather than duplicating separate baseline definitions.
