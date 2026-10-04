import { useEffect, useState, type CSSProperties } from "react";

// 操作成功 celebration: the dragon + tiger pop up in the middle of the
// screen with party poppers (public/v9/mascot/celebrate.webp) and CSS
// confetti bursts out of both poppers. Plays once per `playKey` change,
// ~1.8s; a tap closes it early. With reduced motion only the art shows.

const ART = { width: 260, height: 164 };
// Popper mouths, in % of the art box; confetti flies up-left / up-right.
const POPPERS = [
  { x: 11.6, y: 34.6, angle: -105 },
  { x: 90.2, y: 35.9, angle: -75 },
];
const COLORS = ["#4cb782", "#f59a3c", "#ffd45c", "#e2554b", "#4a90d9", "#ff8fb1"];
const PIECES_PER_POPPER = 18;
const SHOW_MS = 1800;
const LEAVE_MS = 260;

type Piece = { id: number; style: CSSProperties; shape: "strip" | "dot" };

function makePieces(): Piece[] {
  const pieces: Piece[] = [];
  POPPERS.forEach((popper, side) => {
    for (let i = 0; i < PIECES_PER_POPPER; i += 1) {
      const angle = ((popper.angle + (Math.random() - 0.5) * 70) * Math.PI) / 180;
      const distance = 60 + Math.random() * 100;
      pieces.push({
        id: side * PIECES_PER_POPPER + i,
        shape: Math.random() < 0.6 ? "strip" : "dot",
        style: {
          left: `${popper.x}%`,
          top: `${popper.y}%`,
          background: COLORS[Math.floor(Math.random() * COLORS.length)],
          animationDelay: `${Math.round(Math.random() * 90)}ms`,
          animationDuration: `${Math.round(1150 + Math.random() * 450)}ms`,
          ["--dx" as string]: `${Math.round(Math.cos(angle) * distance)}px`,
          ["--dy" as string]: `${Math.round(Math.sin(angle) * distance)}px`,
          ["--rot" as string]: `${Math.round((Math.random() - 0.5) * 720)}deg`,
        },
      });
    }
  });
  return pieces;
}

export function V9Celebrate({ playKey }: { playKey: number }) {
  const [shown, setShown] = useState<{ key: number; pieces: Piece[]; leaving: boolean } | null>(
    null,
  );

  // Fetch the art early so the first celebration doesn't pop in empty.
  useEffect(() => {
    const image = new Image();
    image.src = `${import.meta.env.BASE_URL}v9/mascot/celebrate.webp`;
  }, []);

  useEffect(() => {
    if (!playKey) return;
    setShown({ key: playKey, pieces: makePieces(), leaving: false });
    const leave = window.setTimeout(
      () => setShown((current) => (current ? { ...current, leaving: true } : current)),
      SHOW_MS,
    );
    const done = window.setTimeout(() => setShown(null), SHOW_MS + LEAVE_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, [playKey]);

  if (!shown) return null;

  const close = () => {
    setShown((current) => (current ? { ...current, leaving: true } : current));
    window.setTimeout(() => setShown(null), LEAVE_MS);
  };

  return (
    <div
      key={shown.key}
      className={`v9-celebrate${shown.leaving ? " is-leaving" : ""}`}
      role="presentation"
      onClick={close}
    >
      <div className="v9-celebrate-art" style={ART}>
        <img
          src={`${import.meta.env.BASE_URL}v9/mascot/celebrate.webp`}
          alt=""
          width={ART.width}
          height={ART.height}
        />
        {shown.pieces.map((piece) => (
          <span key={piece.id} className={`v9-confetti is-${piece.shape}`} style={piece.style} />
        ))}
      </div>
    </div>
  );
}
