// OnCourt mark: the dragon + tiger sticker (public/v9/brand/logo.webp, 224px).
export function V9Logo({ size = 40 }: { size?: number }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}v9/brand/logo.webp`}
      alt=""
      width={size}
      height={size}
      className="v9-logo"
      decoding="async"
    />
  );
}

// Lockup: sticker + "OnCourt" lettering (public/v9/brand/lockup.webp, 469×144).
export function V9Lockup({ height = 36 }: { height?: number }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}v9/brand/lockup.webp`}
      alt="OnCourt"
      width={Math.round((469 / 144) * height)}
      height={height}
      className="v9-lockup"
    />
  );
}
