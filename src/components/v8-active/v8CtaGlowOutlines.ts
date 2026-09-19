// Baked SVG outline paths for the CTA plaque glow-run reminder effect (see
// V8CtaGlowOutline in V8ActivePage.tsx). Generated OFFLINE (not at runtime)
// from each plaque's actual PNG alpha channel -- not an approximated
// rectangle/oval -- via:
//   1. cv2.findContours on the thresholded alpha channel of the plaque's
//      *-source.png (the crisp, un-letterboxed original art)
//   2. cv2.approxPolyDP to simplify the raw contour (~1700 points) down to
//      ~36-38 key vertices tracing the plaque's actual scalloped edge
//   3. the source-pixel-space points are then transformed into the SAME
//      pixel space as the *rendered* display .webp (700x589, letterboxed
//      onto a shared larger canvas then downscaled -- see the comment on
//      v8ActiveCtaPlaqueFiles in v8ActiveConfig.ts) via a scale+offset
//      solved by matching each image's own measured alpha content bounding
//      box, NOT by re-deriving the original letterbox recipe from memory --
//      verified by re-drawing each path directly on top of its own .webp
//      and confirming pixel-accurate alignment with the artwork's edge.
// Re-run the same pipeline if any of these 4 source/display assets change.
export const v8CtaGlowOutlines = {
  seasonLeave: {
    viewBoxWidth: 700,
    viewBoxHeight: 589,
    d: "M 12.0 281.22 L 24.67 326.17 L 42.96 339.75 L 65.47 340.22 L 84.71 379.09 L 113.79 391.73 L 138.18 417.95 L 181.34 427.32 L 257.8 413.74 L 305.17 431.53 L 354.89 420.29 L 390.54 432.0 L 443.55 413.74 L 520.48 427.79 L 550.03 423.1 L 613.82 380.02 L 633.99 340.22 L 649.47 342.1 L 671.52 329.45 L 687.0 291.52 L 679.96 260.62 L 629.77 208.17 L 619.45 184.76 L 596.47 167.44 L 563.16 163.22 L 510.16 184.29 L 464.66 187.57 L 412.12 166.5 L 390.08 169.31 L 350.67 137.0 L 307.99 169.31 L 286.41 166.5 L 233.4 187.57 L 185.56 183.36 L 137.24 163.22 L 103.0 167.44 L 46.71 225.03 Z",
  },
  seasonReturn: {
    viewBoxWidth: 700,
    viewBoxHeight: 589,
    d: "M 3.0 295.73 L 16.61 338.95 L 40.07 353.99 L 58.36 352.58 L 77.6 392.51 L 107.63 406.13 L 134.84 433.85 L 172.38 442.77 L 256.83 428.68 L 306.1 447.0 L 354.9 435.26 L 392.9 447.0 L 444.98 428.68 L 524.74 442.77 L 555.24 438.07 L 591.84 406.6 L 619.05 395.33 L 641.57 353.05 L 658.93 354.46 L 678.17 343.65 L 696.0 305.13 L 686.62 267.55 L 636.88 216.81 L 625.62 191.92 L 603.1 175.47 L 564.63 171.72 L 521.93 190.51 L 467.5 195.67 L 413.08 174.07 L 391.96 177.35 L 350.2 144.0 L 306.57 177.35 L 284.99 174.07 L 231.03 195.67 L 181.76 191.45 L 128.74 170.78 L 94.49 176.41 L 13.32 266.61 Z",
  },
  tempCancel: {
    viewBoxWidth: 700,
    viewBoxHeight: 589,
    d: "M 13.0 283.15 L 24.26 325.9 L 42.57 340.46 L 66.03 341.87 L 81.52 376.16 L 114.37 393.07 L 137.84 418.91 L 180.08 428.77 L 259.86 415.15 L 305.85 433.0 L 344.34 421.73 L 392.21 433.0 L 441.02 415.15 L 517.05 428.77 L 548.96 424.54 L 585.1 393.54 L 610.44 383.21 L 632.97 341.4 L 651.74 342.34 L 670.04 331.07 L 686.0 293.49 L 678.49 261.07 L 597.3 169.47 L 563.51 164.31 L 506.25 185.91 L 465.42 188.73 L 411.92 167.59 L 389.39 170.41 L 350.91 138.0 L 307.73 170.41 L 285.67 167.59 L 232.17 188.73 L 179.14 182.63 L 137.84 164.78 L 101.7 169.47 L 48.2 224.9 Z",
  },
  tempSignup: {
    viewBoxWidth: 700,
    viewBoxHeight: 589,
    d: "M 12.0 284.15 L 24.2 327.84 L 44.39 342.4 L 65.51 342.4 L 80.53 376.69 L 113.86 394.54 L 135.92 418.97 L 179.11 429.77 L 259.84 416.15 L 306.32 434.0 L 354.66 422.73 L 391.75 434.0 L 441.03 416.15 L 518.95 429.77 L 550.4 425.07 L 585.61 394.54 L 613.3 382.33 L 633.96 342.4 L 653.67 342.87 L 670.57 332.54 L 687.0 296.83 L 679.02 261.13 L 598.28 170.47 L 561.2 165.78 L 520.83 183.63 L 465.91 189.73 L 414.75 169.06 L 390.34 171.41 L 351.38 139.0 L 324.15 153.09 L 313.36 169.06 L 285.19 168.59 L 232.15 189.73 L 179.11 183.63 L 134.98 165.31 L 104.47 169.06 L 48.14 225.43 Z",
  },
  // Opening page's "進入戰局" plaque -- same pipeline, different source
  // image/viewBox: cta-plaque-enter-battle-v1-source.png is 2172x724, the
  // display webp is a plain uniform 700-wide downscale (no letterbox), so
  // the contour points only need a single scale factor (700/2172), no
  // bbox-matching offset like the 4 letterboxed identity-card plaques
  // above. Verified by redrawing this path over the display webp.
  enterBattle: {
    viewBoxWidth: 700,
    viewBoxHeight: 233,
    d: "M 20.95 124.08 L 23.20 141.48 L 37.71 159.85 L 72.51 165.33 L 89.27 190.47 L 115.70 196.59 L 143.42 215.93 L 173.71 218.19 L 259.12 202.39 L 303.91 217.54 L 330.99 214.64 L 350.32 225.92 L 369.66 214.96 L 398.66 217.22 L 442.17 202.39 L 529.51 218.51 L 555.29 216.25 L 583.33 196.59 L 610.41 190.15 L 626.84 165.33 L 660.04 160.17 L 677.12 131.17 L 667.45 102.16 L 586.56 30.62 L 555.94 26.75 L 506.63 46.41 L 461.51 49.31 L 408.01 29.01 L 387.38 32.55 L 351.93 4.83 L 312.29 32.87 L 290.38 29.33 L 236.23 49.63 L 193.69 46.41 L 145.99 27.07 L 114.73 30.29 L 34.16 98.94 Z",
  },
} as const;

export type V8CtaGlowOutlineKey = keyof typeof v8CtaGlowOutlines;
