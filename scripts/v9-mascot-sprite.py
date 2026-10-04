#!/usr/bin/env python3
"""Clean a ChatGPT mascot sheet into a V9 sprite (docs/V9_MASCOT_BRIEF.md).

Usage:
  python3 scripts/v9-mascot-sprite.py SRC.png OUT.webp [--frames 1,2,3,2] [--slots 6] [--height 240]

- Splits SRC into --slots equal columns; every connected shape goes to the
  slot holding its centre, so rackets / tails that cross a slot edge stay
  with their own frame and stray pieces of neighbours are dropped.
- Drops faint haze and makes the character body fully opaque.
- Aligns the chosen --frames (1-based, repeats allowed) on one shared
  canvas, scales to --height px (2x of the on-page height) and writes a
  horizontal WebP strip.
Prints the per-frame size and frame count for V9Mascot.tsx.

Needs: pip install pillow numpy scipy
"""

import argparse
import os

import numpy as np
from PIL import Image
from scipy import ndimage


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("src")
    parser.add_argument("out")
    parser.add_argument("--frames", default="1,2,3,4,5,6")
    parser.add_argument("--slots", type=int, default=6)
    parser.add_argument("--height", type=int, default=240)
    args = parser.parse_args()

    src = np.array(Image.open(args.src).convert("RGBA")).astype(np.float32)
    height, width = src.shape[:2]
    slot_w = width / args.slots
    alpha = src[:, :, 3]
    mask = alpha > 24

    labels, count = ndimage.label(mask, structure=np.ones((3, 3)))
    ids = range(1, count + 1)
    centres = ndimage.center_of_mass(mask, labels, ids)
    sizes = ndimage.sum(mask, labels, ids)
    slot_of = np.full(count + 1, -1)
    for index, (centre, size) in enumerate(zip(centres, sizes), 1):
        if size >= 30:
            slot_of[index] = min(args.slots - 1, int(centre[1] // slot_w))

    solid = np.clip((alpha - 24) / (170 - 24), 0, 1) * 255
    margin = 200
    frames, boxes = [], []
    for slot in range(args.slots):
        keep = np.isin(labels, np.nonzero(slot_of == slot)[0])
        keep = ndimage.binary_dilation(keep, iterations=2)
        frame = src.copy()
        frame[:, :, 3] = np.where(keep, solid, 0)
        ys, xs = np.nonzero(frame[:, :, 3] > 0)
        origin = slot * slot_w
        boxes.append((xs.min() - origin, ys.min(), xs.max() - origin, ys.max()))
        padded = Image.new("RGBA", (width + 2 * margin, height), (0, 0, 0, 0))
        padded.alpha_composite(Image.fromarray(frame.astype(np.uint8), "RGBA"), (margin, 0))
        frames.append(padded)

    order = [int(value) - 1 for value in args.frames.split(",")]
    used = sorted(set(order))
    pad = 6
    x0 = min(boxes[i][0] for i in used) - pad
    y0 = min(boxes[i][1] for i in used) - pad
    x1 = max(boxes[i][2] for i in used) + pad
    y1 = max(boxes[i][3] for i in used) + pad
    canvas_w, canvas_h = int(x1 - x0 + 1), int(y1 - y0 + 1)
    out_h = args.height
    out_w = round(canvas_w * out_h / canvas_h)

    sheet = Image.new("RGBA", (out_w * len(order), out_h), (0, 0, 0, 0))
    for position, slot in enumerate(order):
        left = int(round(slot * slot_w + x0)) + margin
        top = int(y0)
        crop = frames[slot].crop((left, top, left + canvas_w, top + canvas_h))
        sheet.alpha_composite(crop.resize((out_w, out_h), Image.LANCZOS), (position * out_w, 0))

    sheet.save(args.out, "WEBP", quality=88, method=6)
    print(
        f"frame {out_w}x{out_h} (display {out_w // 2}x{out_h // 2}), "
        f"{len(order)} frames, {os.path.getsize(args.out)} bytes"
    )


if __name__ == "__main__":
    main()
