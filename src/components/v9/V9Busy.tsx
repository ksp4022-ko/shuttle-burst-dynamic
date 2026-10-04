// Loading screen art: the dragon and tiger hold still and rally a shuttle
// between their rackets (public/v9/mascot/rally-*.webp + shuttle.webp).
// The flight is pure CSS: the span follows a parabola between the racket
// heads, the image turns to lead with its cork, and each player rocks back
// on its hit.
export function V9Busy({ label = "讀取聚會中…" }: { label?: string }) {
  const base = `${import.meta.env.BASE_URL}v9/mascot/`;
  return (
    <div className="v9-busy" role="status" aria-live="polite">
      <div className="v9-busy-art" aria-hidden="true">
        <img
          className="v9-busy-dragon"
          src={`${base}rally-dragon.webp`}
          alt=""
          width={143}
          height={120}
        />
        <img
          className="v9-busy-tiger"
          src={`${base}rally-tiger.webp`}
          alt=""
          width={137}
          height={120}
        />
        <span className="v9-busy-x">
          <img
            className="v9-busy-shuttle"
            src={`${base}shuttle.webp`}
            alt=""
            width={40}
            height={34}
          />
        </span>
      </div>
      <p className="v9-busy-label">{label}</p>
    </div>
  );
}
