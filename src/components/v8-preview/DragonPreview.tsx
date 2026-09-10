import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  activeTargetOrder,
  bagBaseBaseline,
  bagStrapBaseline,
  buildPreviewAssets,
  buildV8ActiveCapacityBadgeControls,
  buildV8ActiveHeroOverrides,
  buildV8ActiveIdentityCardControls,
  buildV8ActiveInfoCardsControls,
  buildV8ActiveRopeOrnamentsControls,
  buildV8ActiveRosterListsControls,
  buildV8ActiveSunBadgesControls,
  buildV8ActiveSunMessagesControls,
  clawBaseline,
  decorBaseline,
  heroBaseline,
  loadSavedControls,
  openingTargetOrder,
  previewDefaults,
  rearClawBaseline,
  safeZoneBaseline,
  saveControls,
  tigerRacketBaseline,
  tigerRigBaseline,
} from "./dragonPreviewConfig";
import type { PreviewControls, PreviewMode, PreviewTargetId } from "./dragonPreviewConfig";
import { V8TuningPanel } from "./V8TuningPanel";
import { V8ActiveStyles, V8ActiveSunContent, V8IdentityScrollContent } from "@/components/v8-active/V8ActivePage";
import { V8ActiveInfoCards } from "@/components/v8-active/V8ActiveInfoCards";
import { V8ActiveRosterLists, type V8ActiveRosterPerson } from "@/components/v8-active/V8ActiveRosterLists";
import { buildV8ActiveAssets, v8ActiveStageAspectRatio } from "@/components/v8-active/v8ActiveConfig";
import { V8HeroComposition } from "@/components/v8-hero/V8HeroComposition";
import type { CurrentIdentity } from "@/hooks/use-current-identity";

const mockRosterConfirmed: V8ActiveRosterPerson[] = [
  { id: "mock-c1", name: "柯Sammy" },
  { id: "mock-c2", name: "陳大文" },
  { id: "mock-c3", name: "林小美" },
  { id: "mock-c4", name: "王志明" },
  { id: "mock-c5", name: "張家豪" },
];
const mockRosterLeave: V8ActiveRosterPerson[] = [{ id: "mock-l1", name: "李國強" }];
const mockRosterWaiting: V8ActiveRosterPerson[] = [
  { id: "mock-w1", name: "黃亭亭" },
  { id: "mock-w2", name: "吳建宏" },
];

const preloadPreviewImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    image.onload = () => {
      if (!image.decode) {
        finish();
        return;
      }
      image.decode().catch(() => undefined).finally(finish);
    };
    image.onerror = finish;
    image.decoding = "async";
    image.src = src;
  });

const preloadPreviewImages = (sources: string[]) => Promise.all([...new Set(sources)].map(preloadPreviewImage));

// Safety net matching V8HeroComposition's preloadHeroImagesWithTimeout --
// this preview canvas's own preloadPreviewImage still calls image.decode()
// (unlike V8HeroComposition's, which dropped it after decode() was found
// to stall indefinitely on a backgrounded/hidden tab), so it's exposed to
// that same hang risk plus the flaky-network case. Racing against a
// timeout caps how long a stuck load can leave the OPENING preview canvas
// invisible.
const PREVIEW_ASSET_PRELOAD_TIMEOUT_MS = 4000;
const preloadPreviewImagesWithTimeout = (sources: string[]) =>
  Promise.race([
    preloadPreviewImages(sources),
    new Promise<void>((resolve) => window.setTimeout(resolve, PREVIEW_ASSET_PRELOAD_TIMEOUT_MS)),
  ]);

function HeroCopy({ controls, highlighted }: { controls: PreviewControls; highlighted: boolean }) {
  return (
    <div
      data-highlight-target="HERO"
      style={{
        ...heroStyle,
        ...(highlighted ? selectedTargetStyle : {}),
        left: heroBaseline.centerX,
        top: heroBaseline.top,
        width: controls.heroWidth,
        transform: `translate(calc(-50% + ${controls.heroX}px), ${controls.heroY}px) scale(${controls.heroScale})`,
      }}
    >
      <div style={heroInnerStyle}>
        <p style={eyebrowStyle}>龍虎交鋒・戰局未定</p>
        <h1 style={titleStyle}>SHUTTLE V8</h1>
        <p style={{ ...dateStyle, transform: `translateY(${controls.heroEventY}px)` }}>
          8.29｜康軒
          <br />
          19:00–22:00
        </p>
        <div style={{ ...ctaStyle, transform: `translateY(${controls.heroCtaY}px)` }}>進入戰局</div>
      </div>
    </div>
  );
}

function SafeZoneOverlay({ controls }: { controls: PreviewControls }) {
  if (!controls.showSafeZone) return null;
  return (
    <div
      style={{
        ...safeZoneStyle,
        left: safeZoneBaseline.left + controls.safeZoneX,
        top: safeZoneBaseline.top + controls.safeZoneY,
        width: controls.safeZoneWidth,
        height: controls.safeZoneHeight,
      }}
    >
      <div style={safeZoneLabelStyle}>SAFE ZONE</div>
    </div>
  );
}

// Live-tunes the same V8ActivePage.tsx components the real Active page
// uses -- same isolation principle as the rest of this preview tool.
function ActiveCanvas({
  controls,
  assets,
}: {
  controls: PreviewControls;
  assets: ReturnType<typeof buildV8ActiveAssets>;
}) {
  // Mirrors V8ActivePage's composition so this console previews the exact
  // same output, just fed by this slider state instead of the frozen
  // defaults -- "複製" then hands back the numbers to bake into that frozen
  // object. No more season/casual (B_fix/B_temp) branching -- the real
  // page always renders this same layout regardless of identity now, so
  // there's nothing left for a mock character toggle to preview.
  // Built from the SAME shared functions the real Active page's own
  // embedded tuning panel uses (see dragonPreviewConfig.ts) -- fed this
  // slider state instead of the real page's live controls, so the two
  // can't drift out of sync with each other.
  const heroOverrides = buildV8ActiveHeroOverrides(controls);
  const mockIdentity: CurrentIdentity = {
    signupId: "mock-self",
    name: "柯Sammy",
    signupType: "fixed",
    status: "confirmed",
  };

  const infoCardsControls = buildV8ActiveInfoCardsControls(controls);
  const rosterListsControls = buildV8ActiveRosterListsControls(controls);
  const sunBadgeControls = buildV8ActiveSunBadgesControls(controls);
  const sunMessageControls = buildV8ActiveSunMessagesControls(controls);
  const identityCardControls = buildV8ActiveIdentityCardControls(controls);
  const capacityBadgeControls = buildV8ActiveCapacityBadgeControls(controls);
  const ropeOrnamentControls = buildV8ActiveRopeOrnamentsControls(controls);
  const extraPreloadSrcs = [
    assets.sunInfoBadge,
    assets.sunBadgeBallType,
    assets.sunBadgeTempFee,
    assets.sunBadgeCourtCount,
    assets.sunBadgeCapacity,
    assets.infoCardRegistered,
    assets.infoCardNeeded,
    assets.infoCardWaitlist,
    assets.infoRope,
    assets.ropeOrnamentA,
    assets.ropeOrnamentB,
    assets.ropeOrnamentC,
    assets.rosterFrame,
  ];

  return (
    <div className="v8-active" style={{ position: "relative", width: "100%" } as CSSProperties}>
      <V8ActiveStyles />

      <V8HeroComposition
        confirmed
        controlOverrides={heroOverrides}
        stageAspectRatio={v8ActiveStageAspectRatio}
        extraPreloadSrcs={extraPreloadSrcs}
        sunContent={
          <V8ActiveSunContent
            assets={assets}
            eventDate="2026-09-10"
            eventName="康軒(預覽資料)"
            eventNote="備註預覽文字"
            courtCount={2}
            hours={3}
            ballType="MS 101"
            tempFee={245}
            capacity={22}
            badgeControls={sunBadgeControls}
            capacityBadgeControls={capacityBadgeControls}
            messageControls={sunMessageControls}
          />
        }
        scrollContent={
          <V8IdentityScrollContent
            identity={mockIdentity}
            assets={assets}
            controls={identityCardControls}
            busy={false}
            pendingLabel={undefined}
            onPrimaryAction={() => {}}
            onForget={() => {}}
            onHelperSignup={() => {}}
            onHelperCancel={() => {}}
          />
        }
        infoCardsContent={
          <V8ActiveInfoCards
            assets={assets}
            controls={infoCardsControls}
            ropeOrnamentControls={ropeOrnamentControls}
            counts={{ registered: 16, needed: 6, waiting: 0 }}
          />
        }
        rosterListsContent={
          <V8ActiveRosterLists
            frameSrc={assets.rosterFrame}
            confirmed={mockRosterConfirmed}
            leave={mockRosterLeave}
            waiting={mockRosterWaiting}
            controls={rosterListsControls}
          />
        }
      />
    </div>
  );
}

function DecorLayer({
  target,
  src,
  show,
  x,
  y,
  scale,
  rotation,
  opacity,
  blur,
  zIndex,
  highlighted,
}: {
  target: PreviewTargetId;
  src: string;
  show: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blur: number;
  zIndex: number;
  highlighted: boolean;
}) {
  if (!show) return null;
  return (
    <img
      data-highlight-target={target}
      src={src}
      alt={`${target} preview asset`}
      decoding="async"
      loading="eager"
      style={{
        ...decorImageStyle,
        ...(highlighted ? selectedTargetStyle : {}),
        left: decorBaseline.left,
        top: decorBaseline.top,
        width: decorBaseline.width,
        opacity: opacity / 100,
        filter: blur > 0 ? `blur(${blur}px)` : "none",
        transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`,
        zIndex,
      }}
    />
  );
}

export function DragonPreview() {
  const [controls, setControls] = useState<PreviewControls>(() =>
    typeof window === "undefined" ? previewDefaults : loadSavedControls(),
  );
  const [assetsReady, setAssetsReady] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<PreviewTargetId>("TIGER RIG");
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("OPENING");

  const assets = useMemo(() => buildPreviewAssets(import.meta.env.BASE_URL), []);
  const activeAssets = useMemo(() => buildV8ActiveAssets(import.meta.env.BASE_URL), []);
  const currentTargetOrder = previewMode === "OPENING" ? openingTargetOrder : activeTargetOrder;

  // Autosave -- fires on every slider/toggle change so a refresh or a
  // backgrounded tab getting reclaimed never loses in-progress tuning.
  useEffect(() => {
    saveControls(controls);
  }, [controls]);

  const setPreviewModeAndTarget = (mode: PreviewMode) => {
    setPreviewMode(mode);
    setSelectedTarget(mode === "OPENING" ? "DRAGON RIG" : "ACTIVE SUN INFO");
  };
  const targetHighlightStyle = (target: PreviewTargetId): CSSProperties =>
    highlightEnabled && selectedTarget === target ? selectedTargetStyle : {};
  const decorBlur = (value: number) => (controls.decorMode === "LIGHT" ? 0 : value);
  const tigerRigTransform = `translate(${controls.tigerX}px, ${controls.tigerY}px) scale(${controls.tigerScale}) rotate(${controls.tigerRotation}deg)`;

  useEffect(() => {
    let cancelled = false;
    setAssetsReady(false);
    preloadPreviewImagesWithTimeout(Object.values(assets)).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [assets]);

  return (
    <main style={pageStyle}>
      <section style={stageShellStyle} aria-label="V8 mobile composition preview">
        <div style={previewMode === "ACTIVE" ? stageStyleActive : stageStyle}>
          {previewMode === "OPENING" ? (
          <div style={{ ...artworkFadeStyle, opacity: assetsReady ? 1 : 0 }}>
          <div style={paperStyle} />
          <DecorLayer target="FRONT FOAM" src={assets.frontFoam} show={controls.frontFoamShow && controls.decorMode === "FULL"} x={controls.frontFoamX} y={controls.frontFoamY} scale={controls.frontFoamScale} rotation={controls.frontFoamRotation} opacity={controls.frontFoamOpacity} blur={decorBlur(controls.frontFoamBlur)} zIndex={2} highlighted={highlightEnabled && selectedTarget === "FRONT FOAM"} />
          <DecorLayer target="GOLD / INK" src={assets.goldInk} show={controls.goldInkShow} x={controls.goldInkX} y={controls.goldInkY} scale={controls.goldInkScale} rotation={controls.goldInkRotation} opacity={controls.goldInkOpacity} blur={decorBlur(controls.goldInkBlur)} zIndex={3} highlighted={highlightEnabled && selectedTarget === "GOLD / INK"} />
          <div style={sunStyle} />
          <DecorLayer target="CLOUD" src={assets.cloud} show={controls.cloudShow} x={controls.cloudX} y={controls.cloudY} scale={controls.cloudScale} rotation={controls.cloudRotation} opacity={controls.cloudOpacity} blur={decorBlur(controls.cloudBlur)} zIndex={5} highlighted={highlightEnabled && selectedTarget === "CLOUD"} />
          <DecorLayer target="MOUNTAIN" src={assets.mountain} show={controls.mountainShow} x={controls.mountainX} y={controls.mountainY} scale={controls.mountainScale} rotation={controls.mountainRotation} opacity={controls.mountainOpacity} blur={decorBlur(controls.mountainBlur)} zIndex={6} highlighted={highlightEnabled && selectedTarget === "MOUNTAIN"} />
          <DecorLayer target="BACK WAVE" src={assets.backWave} show={controls.backWaveShow} x={controls.backWaveX} y={controls.backWaveY} scale={controls.backWaveScale} rotation={controls.backWaveRotation} opacity={controls.backWaveOpacity} blur={decorBlur(controls.backWaveBlur)} zIndex={7} highlighted={highlightEnabled && selectedTarget === "BACK WAVE"} />
          {controls.dragonShow ? (
          <div
            data-highlight-target="DRAGON RIG"
            aria-label="Dragon rig"
            style={{
              ...dragonRigStyle,
              ...targetHighlightStyle("DRAGON RIG"),
              width: `${74 * controls.dragonScale}%`,
              right: `${100 - controls.dragonX}%`,
              top: `${controls.dragonY}%`,
              transform: `translate(44%, -8%) rotate(${controls.dragonRotation}deg)`,
              zIndex: 8,
            }}
          >
            {controls.rearClawShow ? (
              <img
                data-highlight-target="REAR CLAW"
                src={assets.rearClaw}
                alt="Rear claw preview asset"
                decoding="async"
                loading="eager"
                style={{
                  ...rigImageStyle,
                  ...targetHighlightStyle("REAR CLAW"),
                  left: `${rearClawBaseline.left + controls.rearClawX}%`,
                  top: `${rearClawBaseline.top + controls.rearClawY}%`,
                  width: `${rearClawBaseline.width * controls.rearClawScale}%`,
                  transform: `rotate(${controls.rearClawRotation}deg)`,
                  zIndex: 0,
                }}
              />
            ) : null}
                <img src={assets.body} alt="Dragon body preview asset" decoding="async" loading="eager" style={{ ...rigImageStyle, inset: 0, width: "100%", zIndex: 1 }} />
            {controls.bagBaseShow ? (
            <img
                data-highlight-target="BAG BASE"
                src={assets.bagBase}
                alt="Bag Base A preview asset"
                decoding="async"
                loading="eager"
              style={{
                ...rigImageStyle,
                ...targetHighlightStyle("BAG BASE"),
                left: `${bagBaseBaseline.left + controls.bagBaseX}%`,
                top: `${bagBaseBaseline.top + controls.bagBaseY}%`,
                width: `${bagBaseBaseline.width * controls.bagBaseScale}%`,
                transform: `rotate(${bagBaseBaseline.rotation + controls.bagBaseRotation}deg)`,
                zIndex: 2,
              }}
            />
            ) : null}
            {controls.bagStrapShow ? (
            <img
                data-highlight-target="BAG STRAP"
                src={assets.bagStrap}
                alt="Bag Strap E preview asset"
                decoding="async"
                loading="eager"
              style={{
                ...rigImageStyle,
                ...targetHighlightStyle("BAG STRAP"),
                left: `${bagStrapBaseline.left + controls.bagStrapX}%`,
                top: `${bagStrapBaseline.top + controls.bagStrapY}%`,
                width: `${bagStrapBaseline.width * controls.bagStrapScale}%`,
                transform: `rotate(${bagStrapBaseline.rotation + controls.bagStrapRotation}deg)`,
                zIndex: 3,
              }}
            />
            ) : null}
            {controls.clawShow ? (
            <img
              data-highlight-target="FRONT CLAW"
              src={assets.claw}
              alt="Throw claw preview asset"
              decoding="async"
              loading="eager"
              style={{
                ...rigImageStyle,
                ...targetHighlightStyle("FRONT CLAW"),
                left: `${clawBaseline.left + controls.clawX}%`,
                top: `${clawBaseline.top + controls.clawY}%`,
                width: `${clawBaseline.width * controls.clawScale}%`,
                transform: `rotate(${controls.clawRotation}deg)`,
                zIndex: 4,
              }}
            />
            ) : null}
          </div>
          ) : null}
          {controls.tigerShow ? (
          <div
            data-highlight-target="TIGER RIG"
            aria-label="Tiger body rig"
            style={{
              ...tigerRigStyle,
              ...targetHighlightStyle("TIGER RIG"),
              left: tigerRigBaseline.left,
              top: tigerRigBaseline.top,
              width: tigerRigBaseline.width,
              transform: tigerRigTransform,
              zIndex: 9,
            }}
          >
            <img
              src={assets.tigerBody}
              alt="Tiger body preview asset"
              decoding="async"
              loading="eager"
              style={{ ...stageImageStyle, inset: 0, width: "100%", transform: `rotate(${tigerRigBaseline.bodyRotation}deg)`, zIndex: 0 }}
            />
          </div>
          ) : null}
          <DecorLayer target="MID WAVE" src={assets.midWave} show={controls.midWaveShow} x={controls.midWaveX} y={controls.midWaveY} scale={controls.midWaveScale} rotation={controls.midWaveRotation} opacity={controls.midWaveOpacity} blur={decorBlur(controls.midWaveBlur)} zIndex={10} highlighted={highlightEnabled && selectedTarget === "MID WAVE"} />
          {controls.heroShow ? <HeroCopy controls={controls} highlighted={highlightEnabled && selectedTarget === "HERO"} /> : null}
          {controls.tigerShow && controls.tigerRacketShow ? (
            <div
              data-highlight-target="TIGER RACKET"
              aria-label="Tiger racket rig"
              style={{
                ...tigerRigStyle,
                left: tigerRigBaseline.left,
                top: tigerRigBaseline.top,
                width: tigerRigBaseline.width,
                transform: tigerRigTransform,
                zIndex: 12,
              }}
            >
              <img
                src={assets.tigerRacket}
                alt="Tiger racket preview asset"
                decoding="async"
                loading="eager"
                style={{
                  ...stageImageStyle,
                  ...targetHighlightStyle("TIGER RACKET"),
                  left: `${tigerRacketBaseline.left + controls.tigerRacketX}%`,
                  top: `${tigerRacketBaseline.top + controls.tigerRacketY}%`,
                  width: `${tigerRacketBaseline.width * controls.tigerRacketScale}%`,
                  transform: `rotate(${tigerRacketBaseline.rotation + controls.tigerRacketRotation}deg)`,
                  zIndex: 0,
                }}
              />
            </div>
          ) : null}
          <SafeZoneOverlay controls={controls} />
          </div>
          ) : (
            <ActiveCanvas controls={controls} assets={activeAssets} />
          )}
        </div>
      </section>

      <V8TuningPanel
        controls={controls}
        setControls={setControls}
        targetOrder={currentTargetOrder}
        selectedTarget={selectedTarget}
        onSelectTarget={setSelectedTarget}
        showModeToggle
        mode={previewMode}
        onModeChange={setPreviewModeAndTarget}
        highlightEnabled={highlightEnabled}
        onHighlightChange={setHighlightEnabled}
      />
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100svh",
  width: "100%",
  overflowX: "hidden",
  background: "#15110e",
  color: "#24170d",
  fontFamily: "'Noto Sans TC', 'Chakra Petch', system-ui, sans-serif",
  padding: "12px 12px calc(72px + env(safe-area-inset-bottom, 0px))",
};

const stageShellStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
};

const stageStyle: CSSProperties = {
  position: "relative",
  width: "min(100%, 390px)",
  aspectRatio: "390 / 844",
  overflow: "hidden",
  borderRadius: 20,
  background: "#f1e4ca",
  boxShadow: "0 18px 48px rgba(0,0,0,0.38)",
  isolation: "isolate",
};

// ACTIVE mode's content (roster tokens included) grows taller than one
// phone-screen's worth, unlike OPENING's fixed single-card composition --
// the fixed aspectRatio + overflow:hidden above silently clipped anything
// past 844px, which is exactly why the token roster disappeared entirely.
// Same visual chrome, just sized by its own content instead of a locked
// ratio.
const stageStyleActive: CSSProperties = {
  ...stageStyle,
  aspectRatio: "auto",
  overflow: "visible",
  minHeight: 844,
};

const paperStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  background:
    "radial-gradient(circle at 24% 18%, rgba(255,255,255,0.35), transparent 28%), linear-gradient(135deg, #f4e8cf 0%, #e2c795 54%, #f2dfb8 100%)",
};

const artworkFadeStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  transition: "opacity 200ms ease",
};

const sunStyle: CSSProperties = {
  position: "absolute",
  zIndex: 4,
  left: "23%",
  top: "29%",
  width: "52%",
  aspectRatio: "1",
  borderRadius: "50%",
  background: "#c64325",
  opacity: 0.9,
  boxShadow: "0 0 0 12px rgba(198,67,37,0.08)",
};

const dragonRigStyle: CSSProperties = {
  position: "absolute",
  aspectRatio: "1024 / 1536",
  transformOrigin: "50% 38%",
  zIndex: 4,
};

const tigerRigStyle: CSSProperties = {
  position: "absolute",
  aspectRatio: "1122 / 1402",
  transformOrigin: "50% 45%",
  zIndex: 5,
};

const rigImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "center center",
};

const stageImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "center center",
};

const decorImageStyle: CSSProperties = {
  position: "absolute",
  height: "auto",
  userSelect: "none",
  pointerEvents: "none",
  transformOrigin: "top left",
};

const safeZoneStyle: CSSProperties = {
  position: "absolute",
  zIndex: 13,
  border: "2px dashed rgba(20, 125, 92, 0.78)",
  background: "rgba(40, 191, 138, 0.08)",
  color: "#10523d",
  fontWeight: 800,
  pointerEvents: "none",
};

const safeZoneLabelStyle: CSSProperties = {
  position: "absolute",
  top: 8,
  left: 0,
  right: 0,
  textAlign: "center",
  fontSize: 11,
  letterSpacing: 1.4,
};

const heroStyle: CSSProperties = {
  position: "absolute",
  zIndex: 11,
  textAlign: "center",
  color: "#20150d",
  transformOrigin: "50% 0",
};

const heroInnerStyle: CSSProperties = {
  position: "relative",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 15,
  fontWeight: 800,
  letterSpacing: 1.4,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 42,
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: 1.6,
};

const dateStyle: CSSProperties = {
  margin: "17px 0 0",
  fontSize: 20,
  lineHeight: 1.35,
  fontWeight: 800,
};

const ctaStyle: CSSProperties = {
  width: 150,
  height: 42,
  margin: "24px auto 0",
  border: "2px solid #20150d",
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(245, 237, 219, 0.7)",
  fontSize: 16,
  fontWeight: 900,
};

const selectedTargetStyle: CSSProperties = {
  border: "1px solid rgba(184, 242, 46, 0.72)",
  boxShadow: "0 0 0 1px rgba(24, 17, 13, 0.18), 0 0 18px rgba(184, 242, 46, 0.24)",
  borderRadius: 8,
};

