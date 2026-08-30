export type PreviewControls = {
  dragonX: number;
  dragonY: number;
  dragonScale: number;
  dragonRotation: number;
  clawX: number;
  clawY: number;
  clawScale: number;
  clawRotation: number;
  rearClawShow: boolean;
  rearClawX: number;
  rearClawY: number;
  rearClawScale: number;
  rearClawRotation: number;
  bagBaseX: number;
  bagBaseY: number;
  bagBaseScale: number;
  bagBaseRotation: number;
  bagStrapX: number;
  bagStrapY: number;
  bagStrapScale: number;
  bagStrapRotation: number;
  tigerX: number;
  tigerY: number;
  tigerScale: number;
  tigerRotation: number;
  tigerRacketShow: boolean;
  tigerRacketX: number;
  tigerRacketY: number;
  tigerRacketScale: number;
  tigerRacketRotation: number;
  heroX: number;
  heroY: number;
  heroScale: number;
  heroWidth: number;
  heroEventY: number;
  heroCtaY: number;
  showSafeZone: boolean;
  safeZoneX: number;
  safeZoneY: number;
  safeZoneWidth: number;
  safeZoneHeight: number;
};

export type PreviewTargetId =
  | "DRAGON RIG"
  | "REAR CLAW"
  | "FRONT CLAW"
  | "BAG BASE"
  | "BAG STRAP"
  | "TIGER RIG"
  | "TIGER RACKET"
  | "HERO"
  | "SAFE ZONE";

export type StepMode = "Fine" | "Normal" | "Large";
export type HudOpacityMode = "normal" | "ghost";

export const targetOrder: PreviewTargetId[] = [
  "DRAGON RIG",
  "REAR CLAW",
  "FRONT CLAW",
  "BAG BASE",
  "BAG STRAP",
  "TIGER RIG",
  "TIGER RACKET",
  "HERO",
  "SAFE ZONE",
];

export const previewAssets = {
  body: "dragon-body-v2.png",
  rearClaw: "dragon-rear-claw-v1.png",
  claw: "dragon-throw-claw-v1.webp",
  bagBase: "dragon-bag-base-v2-source.png",
  bagStrap: "dragon-bag-strap-overlay-v2-source.png",
  tigerBody: "tiger-body-v1.png",
  tigerRacket: "tiger-racket-v1.png",
} as const;

export const buildPreviewAssets = (baseUrl: string) => {
  const dragonAssetBase = `${baseUrl}v8-preview/dragon`;
  const tigerAssetBase = `${baseUrl}v8-preview/tiger`;
  return {
    body: `${dragonAssetBase}/${previewAssets.body}`,
    rearClaw: `${dragonAssetBase}/${previewAssets.rearClaw}`,
    claw: `${dragonAssetBase}/${previewAssets.claw}`,
    bagBase: `${dragonAssetBase}/${previewAssets.bagBase}`,
    bagStrap: `${dragonAssetBase}/${previewAssets.bagStrap}`,
    tigerBody: `${tigerAssetBase}/${previewAssets.tigerBody}`,
    tigerRacket: `${tigerAssetBase}/${previewAssets.tigerRacket}`,
  };
};

export const previewDefaults: PreviewControls = {
  dragonX: 71,
  dragonY: 5,
  dragonScale: 1,
  dragonRotation: 0,
  clawX: -30,
  clawY: -11,
  clawScale: 0.81,
  clawRotation: 35,
  rearClawShow: true,
  rearClawX: 14,
  rearClawY: -6,
  rearClawScale: 0.54,
  rearClawRotation: -18,
  bagBaseX: 0,
  bagBaseY: 2,
  bagBaseScale: 1,
  bagBaseRotation: 5,
  bagStrapX: -3,
  bagStrapY: 15,
  bagStrapScale: 1.15,
  bagStrapRotation: -2,
  tigerX: 0,
  tigerY: 0,
  tigerScale: 1,
  tigerRotation: 0,
  tigerRacketShow: true,
  tigerRacketX: 0,
  tigerRacketY: 0,
  tigerRacketScale: 1,
  tigerRacketRotation: 0,
  heroX: 0,
  heroY: 0,
  heroScale: 1,
  heroWidth: 294,
  heroEventY: 0,
  heroCtaY: 0,
  showSafeZone: true,
  safeZoneX: 0,
  safeZoneY: 0,
  safeZoneWidth: 294,
  safeZoneHeight: 392,
};

export const targetControlKeys: Record<PreviewTargetId, (keyof PreviewControls)[]> = {
  "DRAGON RIG": ["dragonX", "dragonY", "dragonScale", "dragonRotation"],
  "REAR CLAW": ["rearClawShow", "rearClawX", "rearClawY", "rearClawScale", "rearClawRotation"],
  "FRONT CLAW": ["clawX", "clawY", "clawScale", "clawRotation"],
  "BAG BASE": ["bagBaseX", "bagBaseY", "bagBaseScale", "bagBaseRotation"],
  "BAG STRAP": ["bagStrapX", "bagStrapY", "bagStrapScale", "bagStrapRotation"],
  "TIGER RIG": ["tigerX", "tigerY", "tigerScale", "tigerRotation"],
  "TIGER RACKET": ["tigerRacketShow", "tigerRacketX", "tigerRacketY", "tigerRacketScale", "tigerRacketRotation"],
  HERO: ["heroX", "heroY", "heroScale", "heroWidth", "heroEventY", "heroCtaY"],
  "SAFE ZONE": ["showSafeZone", "safeZoneX", "safeZoneY", "safeZoneWidth", "safeZoneHeight"],
};

export const bagBaseBaseline = { left: 63.0859375, top: 12.2395833, width: 40.0390625, rotation: -7 } as const;
export const bagStrapBaseline = { left: 57.6171875, top: 18.4895833, width: 20.80078125, rotation: 2 } as const;
export const clawBaseline = { left: 58, top: 38, width: 50 } as const;
export const rearClawBaseline = { left: 53, top: 23, width: 46 } as const;
export const tigerRigBaseline = { left: -118, top: 485, width: 330, bodyRotation: -5 } as const;
export const tigerRacketBaseline = { left: 56.9696969697, top: -9.9431618497, width: 81.2121212121, rotation: -6 } as const;
export const heroBaseline = { centerX: 195, top: 286 } as const;
export const safeZoneBaseline = { left: 48, top: 238 } as const;

export const controlRanges = {
  dragonX: { label: "X", min: 35, max: 92 },
  dragonY: { label: "Y", min: -12, max: 38 },
  dragonScale: { label: "Scale", min: 0.55, max: 1.65, step: 0.01 },
  dragonRotation: { label: "Rotation", min: -30, max: 30 },
  clawX: { label: "X", min: -30, max: 30 },
  clawY: { label: "Y", min: -30, max: 40 },
  clawScale: { label: "Scale", min: 0.35, max: 1.35, step: 0.01 },
  clawRotation: { label: "Rotation", min: -35, max: 35 },
  rearClawX: { label: "X", min: -30, max: 30 },
  rearClawY: { label: "Y", min: -30, max: 40 },
  rearClawScale: { label: "Scale", min: 0.25, max: 1.2, step: 0.01 },
  rearClawRotation: { label: "Rotation", min: -45, max: 45 },
  bagBaseX: { label: "X", min: -30, max: 30 },
  bagBaseY: { label: "Y", min: -30, max: 30 },
  bagBaseScale: { label: "Scale", min: 0.6, max: 1.5, step: 0.01 },
  bagBaseRotation: { label: "Rotation", min: -25, max: 25 },
  bagStrapX: { label: "X", min: -30, max: 30 },
  bagStrapY: { label: "Y", min: -40, max: 40 },
  bagStrapScale: { label: "Scale", min: 0.6, max: 1.5, step: 0.01 },
  bagStrapRotation: { label: "Rotation", min: -25, max: 25 },
  tigerX: { label: "X", min: -120, max: 120 },
  tigerY: { label: "Y", min: -120, max: 120 },
  tigerScale: { label: "Scale", min: 0.4, max: 1.6, step: 0.01 },
  tigerRotation: { label: "Rotation", min: -30, max: 30 },
  tigerRacketX: { label: "X", min: -140, max: 140 },
  tigerRacketY: { label: "Y", min: -140, max: 140 },
  tigerRacketScale: { label: "Scale", min: 0.3, max: 1.6, step: 0.01 },
  tigerRacketRotation: { label: "Rotation", min: -120, max: 120 },
  heroX: { label: "X", min: -140, max: 140 },
  heroY: { label: "Y", min: -220, max: 220 },
  heroScale: { label: "Scale", min: 0.6, max: 1.4, step: 0.01 },
  heroWidth: { label: "Width", min: 200, max: 360 },
  heroEventY: { label: "Event Y", min: -120, max: 120 },
  heroCtaY: { label: "CTA Y", min: -120, max: 120 },
  safeZoneX: { label: "X", min: -140, max: 140 },
  safeZoneY: { label: "Y", min: -220, max: 220 },
  safeZoneWidth: { label: "Width", min: 180, max: 390 },
  safeZoneHeight: { label: "Height", min: 180, max: 650 },
} as const;

export const stepModes: Record<StepMode, { position: number; scale: number; rotation: number; size: number }> = {
  Fine: { position: 1, scale: 0.01, rotation: 1, size: 1 },
  Normal: { position: 5, scale: 0.05, rotation: 3, size: 5 },
  Large: { position: 10, scale: 0.1, rotation: 5, size: 10 },
};

export const getButtonStep = (key: keyof PreviewControls, mode: StepMode) => {
  if (key.toLowerCase().includes("scale")) return stepModes[mode].scale;
  if (key.toLowerCase().includes("rotation")) return stepModes[mode].rotation;
  if (key.toLowerCase().includes("width") || key.toLowerCase().includes("height")) return stepModes[mode].size;
  return stepModes[mode].position;
};

export const formatPreviewSettings = (controls: PreviewControls) => `V8 PREVIEW SETTINGS

DRAGON RIG
X: ${Math.round(controls.dragonX)}
Y: ${Math.round(controls.dragonY)}
Scale: ${controls.dragonScale.toFixed(2)}
Rotation: ${Math.round(controls.dragonRotation)}

REAR CLAW
Show: ${controls.rearClawShow ? "ON" : "OFF"}
X: ${Math.round(controls.rearClawX)}
Y: ${Math.round(controls.rearClawY)}
Scale: ${controls.rearClawScale.toFixed(2)}
Rotation: ${Math.round(controls.rearClawRotation)}

FRONT CLAW
X: ${Math.round(controls.clawX)}
Y: ${Math.round(controls.clawY)}
Scale: ${controls.clawScale.toFixed(2)}
Rotation: ${Math.round(controls.clawRotation)}

BAG BASE
X: ${Math.round(controls.bagBaseX)}
Y: ${Math.round(controls.bagBaseY)}
Scale: ${controls.bagBaseScale.toFixed(2)}
Rotation Delta: ${Math.round(controls.bagBaseRotation)}

BAG STRAP
X: ${Math.round(controls.bagStrapX)}
Y: ${Math.round(controls.bagStrapY)}
Scale: ${controls.bagStrapScale.toFixed(2)}
Rotation Delta: ${Math.round(controls.bagStrapRotation)}

TIGER RIG
X: ${Math.round(controls.tigerX)}
Y: ${Math.round(controls.tigerY)}
Scale: ${controls.tigerScale.toFixed(2)}
Rotation: ${Math.round(controls.tigerRotation)}

TIGER RACKET
Show: ${controls.tigerRacketShow ? "ON" : "OFF"}
X: ${Math.round(controls.tigerRacketX)}
Y: ${Math.round(controls.tigerRacketY)}
Scale: ${controls.tigerRacketScale.toFixed(2)}
Rotation: ${Math.round(controls.tigerRacketRotation)}

HERO
X: ${Math.round(controls.heroX)}
Y: ${Math.round(controls.heroY)}
Scale: ${controls.heroScale.toFixed(2)}
Width: ${Math.round(controls.heroWidth)}
Event Y: ${Math.round(controls.heroEventY)}
CTA Y: ${Math.round(controls.heroCtaY)}

SAFE ZONE
Show: ${controls.showSafeZone ? "ON" : "OFF"}
X: ${Math.round(controls.safeZoneX)}
Y: ${Math.round(controls.safeZoneY)}
Width: ${Math.round(controls.safeZoneWidth)}
Height: ${Math.round(controls.safeZoneHeight)}`;
