// Little dragon + tiger duo (CSS/SVG only, stand-in for the final sticker
// art). Mood follows the viewer's status: happy (正取), wait (備取 / 尚未報名),
// rest (請假).

import { useEffect, useState, type CSSProperties } from "react";
import type { V9MascotMood } from "@/lib/v9-display";

function Eyes({ cx, mood }: { cx: [number, number]; mood: V9MascotMood }) {
  if (mood === "rest") {
    return (
      <>
        {cx.map((x) => (
          <path
            key={x}
            d={`M${x - 3} 49q3 2.6 6 0`}
            stroke="var(--v9-ink)"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </>
    );
  }
  return (
    <>
      {cx.map((x) => (
        <g key={x}>
          <circle cx={x} cy="48" r="3.4" fill="var(--v9-ink)" />
          <circle cx={x + 1.1} cy="46.8" r="1.1" fill="#fff" />
        </g>
      ))}
    </>
  );
}

function Mouth({ x, y, mood }: { x: number; y: number; mood: V9MascotMood }) {
  if (mood === "happy") {
    return (
      <path
        d={`M${x - 4.5} ${y}q4.5 5 9 0`}
        stroke="var(--v9-ink)"
        strokeWidth="2.6"
        fill="#ff8f7a"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  if (mood === "rest") {
    return <circle cx={x} cy={y + 1.5} r="2" fill="var(--v9-ink)" />;
  }
  return (
    <path
      d={`M${x - 3.5} ${y + 1.5}h7`}
      stroke="var(--v9-ink)"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  );
}

export function V9Mascot({ mood = "happy", size = 112 }: { mood?: V9MascotMood; size?: number }) {
  return (
    <svg
      className={`v9-mascot is-${mood}`}
      width={size}
      height={size * 0.78}
      viewBox="0 0 128 100"
      aria-hidden="true"
    >
      {/* shuttlecock between them */}
      <g className="v9-mascot-shuttle">
        <path
          d="M58 8 L70 8 L67 26 L61 26 Z"
          fill="#fff"
          stroke="var(--v9-ink)"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path d="M62 9v16M66 9v16" stroke="var(--v9-ink)" strokeWidth="1.6" />
        <circle
          cx="64"
          cy="29"
          r="4.5"
          fill="var(--v9-red)"
          stroke="var(--v9-ink)"
          strokeWidth="2.6"
        />
      </g>

      {/* dragon */}
      <g className="v9-mascot-dragon">
        <path
          d="M22 26 L18 12 L30 22 Z"
          fill="#ffe38a"
          stroke="var(--v9-ink)"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M46 24 L52 10 L40 21 Z"
          fill="#ffe38a"
          stroke="var(--v9-ink)"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <ellipse
          cx="35"
          cy="54"
          rx="27"
          ry="27"
          fill="var(--v9-green)"
          stroke="var(--v9-ink)"
          strokeWidth="3"
        />
        <ellipse
          cx="35"
          cy="63"
          rx="15"
          ry="10"
          fill="#bfe9cf"
          stroke="var(--v9-ink)"
          strokeWidth="2.4"
        />
        <circle cx="31" cy="61" r="1.4" fill="var(--v9-ink)" />
        <circle cx="39" cy="61" r="1.4" fill="var(--v9-ink)" />
        <Eyes cx={[25, 45]} mood={mood} />
        <circle cx="19" cy="56" r="3.4" fill="#ff9e8c" opacity=".75" />
        <Mouth x={35} y={65} mood={mood} />
      </g>

      {/* tiger */}
      <g className="v9-mascot-tiger">
        <circle
          cx="76"
          cy="31"
          r="7"
          fill="var(--v9-orange)"
          stroke="var(--v9-ink)"
          strokeWidth="2.6"
        />
        <circle
          cx="110"
          cy="31"
          r="7"
          fill="var(--v9-orange)"
          stroke="var(--v9-ink)"
          strokeWidth="2.6"
        />
        <ellipse
          cx="93"
          cy="54"
          rx="27"
          ry="27"
          fill="var(--v9-orange)"
          stroke="var(--v9-ink)"
          strokeWidth="3"
        />
        <path
          d="M93 28v8M86 29l2 7M100 29l-2 7M67 50h6M67 57h5M119 50h-6M119 57h-5"
          stroke="var(--v9-ink)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <ellipse
          cx="93"
          cy="62"
          rx="12"
          ry="9"
          fill="#fff6e5"
          stroke="var(--v9-ink)"
          strokeWidth="2.4"
        />
        <path d="M90 58h6l-3 3z" fill="var(--v9-ink)" />
        <Eyes cx={[83, 103]} mood={mood} />
        <circle cx="109" cy="56" r="3.4" fill="#ff9e8c" opacity=".75" />
        <Mouth x={93} y={64} mood={mood} />
      </g>
    </svg>
  );
}

// Sticker-art animation (docs/V9_MASCOT_BRIEF.md): a 6-frame sprite sheet
// played with CSS steps(). The CSS/SVG duo above shows until the sheet has
// loaded; with reduced motion only the first frame shows.
export type V9MascotSprite = "confirmed";

const SPRITE_FRAMES = 6;
const SPRITE_W = 106;
const SPRITE_H = 120;

export function V9MascotArt({
  sprite,
  mood,
  size = 104,
}: {
  sprite: V9MascotSprite | null;
  mood: V9MascotMood;
  size?: number;
}) {
  const src = sprite ? `${import.meta.env.BASE_URL}v9/mascot/${sprite}.webp` : "";
  const [loadedSrc, setLoadedSrc] = useState("");

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) setLoadedSrc(src);
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!src || loadedSrc !== src) return <V9Mascot mood={mood} size={size} />;
  return (
    <span
      className="v9-sprite"
      role="presentation"
      style={
        {
          width: SPRITE_W,
          height: SPRITE_H,
          backgroundImage: `url(${src})`,
          backgroundSize: `${SPRITE_W * SPRITE_FRAMES}px ${SPRITE_H}px`,
          "--v9-sprite-end": `-${SPRITE_W * SPRITE_FRAMES}px`,
        } as CSSProperties
      }
    />
  );
}
