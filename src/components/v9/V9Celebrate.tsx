import { useEffect, useState, type CSSProperties } from "react";

// 操作成功 celebration: the dragon + tiger pop up in the middle of the
// screen with party poppers (public/v9/mascot/celebrate.webp) and CSS
// confetti bursts out of both poppers (twice) while more confetti rains
// from the top. Plays once per `playKey` change, ~2.3s; a tap closes it early. With reduced motion only the art shows.

const ART = { width: 260, height: 164 };
// Popper mouths, in % of the art box; confetti flies up-left / up-right.
const POPPERS = [
  { x: 11.6, y: 34.6, angle: -105 },
  { x: 90.2, y: 35.9, angle: -75 },
];
const COLORS = ["#4cb782", "#f59a3c", "#ffd45c", "#e2554b", "#4a90d9", "#ff8fb1"];
// Two pops per popper (a big burst, then a smaller second one), plus a
// shower of confetti falling from the top of the screen.
const BURSTS = [
  { count: 24, spread: 70, delay: [0, 90], distance: [70, 170] },
  { count: 14, spread: 90, delay: [320, 440], distance: [50, 130] },
];
const RAIN_COUNT = 30;
const SHOW_MS = 2300;
const LEAVE_MS = 260;

type Shape = "strip" | "dot" | "ribbon";
type Piece = { id: string; style: CSSProperties; shape: Shape };

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)] as T;
const between = ([low, high]: readonly number[]) => low! + Math.random() * (high! - low!);
const randomShape = (): Shape => {
  const roll = Math.random();
  return roll < 0.5 ? "strip" : roll < 0.8 ? "dot" : "ribbon";
};

function makeBursts(): Piece[] {
  const pieces: Piece[] = [];
  POPPERS.forEach((popper, side) => {
    BURSTS.forEach((burst, wave) => {
      for (let i = 0; i < burst.count; i += 1) {
        const angle = ((popper.angle + (Math.random() - 0.5) * burst.spread) * Math.PI) / 180;
        const distance = between(burst.distance);
        pieces.push({
          id: `b${side}-${wave}-${i}`,
          shape: randomShape(),
          style: {
            left: `${popper.x}%`,
            top: `${popper.y}%`,
            background: pick(COLORS),
            animationDelay: `${Math.round(between(burst.delay))}ms`,
            animationDuration: `${Math.round(1150 + Math.random() * 500)}ms`,
            ["--dx" as string]: `${Math.round(Math.cos(angle) * distance)}px`,
            ["--dy" as string]: `${Math.round(Math.sin(angle) * distance)}px`,
            ["--rot" as string]: `${Math.round((Math.random() - 0.5) * 720)}deg`,
          },
        });
      }
    });
  });
  return pieces;
}

function makeRain(): Piece[] {
  return Array.from({ length: RAIN_COUNT }, (_, i) => ({
    id: `r${i}`,
    shape: randomShape(),
    style: {
      left: `${Math.round(Math.random() * 100)}%`,
      background: pick(COLORS),
      animationDelay: `${Math.round(150 + Math.random() * 650)}ms`,
      animationDuration: `${Math.round(1500 + Math.random() * 800)}ms`,
      ["--sway" as string]: `${Math.round((Math.random() - 0.5) * 120)}px`,
      ["--rot" as string]: `${Math.round((Math.random() - 0.5) * 900)}deg`,
    },
  }));
}

// dismissible: a tap closes it early (the 操作成功 celebration). The logo
// easter egg passes false so the whole party plays out.
export function V9Celebrate({
  playKey,
  dismissible = true,
}: {
  playKey: number;
  dismissible?: boolean;
}) {
  const [shown, setShown] = useState<{
    key: number;
    pieces: Piece[];
    rain: Piece[];
    leaving: boolean;
  } | null>(null);

  // Fetch the art early so the first celebration doesn't pop in empty.
  useEffect(() => {
    const image = new Image();
    image.src = `${import.meta.env.BASE_URL}v9/mascot/celebrate.webp`;
  }, []);

  useEffect(() => {
    if (!playKey) return;
    setShown({ key: playKey, pieces: makeBursts(), rain: makeRain(), leaving: false });
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
      onClick={dismissible ? close : undefined}
    >
      {shown.rain.map((piece) => (
        <span key={piece.id} className={`v9-confetti-rain is-${piece.shape}`} style={piece.style} />
      ))}
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
