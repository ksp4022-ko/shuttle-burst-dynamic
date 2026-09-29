import type { V8OpeningSunControls } from "./V8OpeningSunContent";

// Re-uses the SAME public asset files Active's sun badges/arrows already
// load (see V8OpeningSunContent).
export function buildV8OpeningSunAssets(baseUrl: string) {
  const activeBase = `${baseUrl}v8-preview/active`;
  const statusAssetBase = `${baseUrl}v8-status-assets`;
  return {
    sunBadgeBallType: `${activeBase}/sun-info-badge-balltype-v2.webp`,
    sunBadgeTempFee: `${activeBase}/sun-info-badge-tempfee-v2.webp`,
    sunBadgeCourtCount: `${activeBase}/sun-info-badge-courttime-v1.webp`,
    sunBadgeCapacity: `${activeBase}/sun-info-badge-capacity-v1.webp`,
    sunSwitchArrowPrev: `${statusAssetBase}/v8-meetup-switch-prev-v2.webp`,
    sunSwitchArrowNext: `${statusAssetBase}/v8-meetup-switch-next-v2.webp`,
    sunTitleKangxuan: `${statusAssetBase}/v8-kangxuan-calligraphy-ivory-square-v2-640.webp`,
  };
}

// The images V8OpeningSunContent shows on OPEN's first screen, for the
// stage's readiness gate. The text itself is the Auto-Fill layer (no
// images), the info badges are off (SHOW_INFO_BADGES) and the calligraphy
// title only appears in the Auto-Fill failure fallback -- so only the
// switch arrows.
export function v8OpeningSunRequiredSrcs({
  canSwitchMeetup,
  controls,
}: {
  canSwitchMeetup: boolean;
  controls: Pick<V8OpeningSunControls, "switchArrows">;
}) {
  if (!canSwitchMeetup || !controls.switchArrows.show) return [];
  const assets = buildV8OpeningSunAssets(import.meta.env.BASE_URL);
  return [assets.sunSwitchArrowPrev, assets.sunSwitchArrowNext];
}
