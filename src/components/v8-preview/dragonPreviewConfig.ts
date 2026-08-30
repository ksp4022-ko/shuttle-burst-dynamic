export type PreviewControls = {
  dragonShow: boolean;
  dragonX: number;
  dragonY: number;
  dragonScale: number;
  dragonRotation: number;
  clawShow: boolean;
  clawX: number;
  clawY: number;
  clawScale: number;
  clawRotation: number;
  rearClawShow: boolean;
  rearClawX: number;
  rearClawY: number;
  rearClawScale: number;
  rearClawRotation: number;
  bagBaseShow: boolean;
  bagBaseX: number;
  bagBaseY: number;
  bagBaseScale: number;
  bagBaseRotation: number;
  bagStrapShow: boolean;
  bagStrapX: number;
  bagStrapY: number;
  bagStrapScale: number;
  bagStrapRotation: number;
  tigerShow: boolean;
  tigerX: number;
  tigerY: number;
  tigerScale: number;
  tigerRotation: number;
  tigerRacketShow: boolean;
  tigerRacketX: number;
  tigerRacketY: number;
  tigerRacketScale: number;
  tigerRacketRotation: number;
  heroShow: boolean;
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
  decorMode: "FULL" | "LIGHT";
  cloudShow: boolean;
  cloudX: number;
  cloudY: number;
  cloudScale: number;
  cloudRotation: number;
  cloudOpacity: number;
  cloudBlur: number;
  mountainShow: boolean;
  mountainX: number;
  mountainY: number;
  mountainScale: number;
  mountainRotation: number;
  mountainOpacity: number;
  mountainBlur: number;
  backWaveShow: boolean;
  backWaveX: number;
  backWaveY: number;
  backWaveScale: number;
  backWaveRotation: number;
  backWaveOpacity: number;
  backWaveBlur: number;
  midWaveShow: boolean;
  midWaveX: number;
  midWaveY: number;
  midWaveScale: number;
  midWaveRotation: number;
  midWaveOpacity: number;
  midWaveBlur: number;
  frontFoamShow: boolean;
  frontFoamX: number;
  frontFoamY: number;
  frontFoamScale: number;
  frontFoamRotation: number;
  frontFoamOpacity: number;
  frontFoamBlur: number;
  goldInkShow: boolean;
  goldInkX: number;
  goldInkY: number;
  goldInkScale: number;
  goldInkRotation: number;
  goldInkOpacity: number;
  goldInkBlur: number;
};

export type PreviewBooleanControlKey = {
  [Key in keyof PreviewControls]: PreviewControls[Key] extends boolean ? Key : never;
}[keyof PreviewControls];

export type PreviewTargetId =
  | "DRAGON RIG"
  | "REAR CLAW"
  | "FRONT CLAW"
  | "BAG BASE"
  | "BAG STRAP"
  | "TIGER RIG"
  | "TIGER RACKET"
  | "HERO"
  | "SAFE ZONE"
  | "CLOUD"
  | "MOUNTAIN"
  | "BACK WAVE"
  | "MID WAVE"
  | "FRONT FOAM"
  | "GOLD / INK";

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
  "CLOUD",
  "MOUNTAIN",
  "BACK WAVE",
  "MID WAVE",
  "FRONT FOAM",
  "GOLD / INK",
];

export const previewAssets = {
  body: "dragon-body-v2.png",
  rearClaw: "dragon-rear-claw-v1.png",
  claw: "dragon-throw-claw-v1.webp",
  bagBase: "dragon-bag-base-v2-source.png",
  bagStrap: "dragon-bag-strap-overlay-v2-source.png",
  tigerBody: "tiger-body-v1.png",
  tigerRacket: "tiger-racket-v1.png",
  cloud: "ukiyoe-cloud-v1.png",
  mountain: "ukiyoe-mountain-v1.png",
  backWave: "ukiyoe-back-wave-v1.png",
  midWave: "ukiyoe-mid-wave-v1.png",
  frontFoam: "ukiyoe-front-foam-v1.png",
  goldInk: "ukiyoe-gold-ink-v1.png",
} as const;

export const buildPreviewAssets = (baseUrl: string) => {
  const dragonAssetBase = `${baseUrl}v8-preview/dragon`;
  const tigerAssetBase = `${baseUrl}v8-preview/tiger`;
  const decorAssetBase = `${baseUrl}v8-preview/decor`;
  return {
    body: `${dragonAssetBase}/${previewAssets.body}`,
    rearClaw: `${dragonAssetBase}/${previewAssets.rearClaw}`,
    claw: `${dragonAssetBase}/${previewAssets.claw}`,
    bagBase: `${dragonAssetBase}/${previewAssets.bagBase}`,
    bagStrap: `${dragonAssetBase}/${previewAssets.bagStrap}`,
    tigerBody: `${tigerAssetBase}/${previewAssets.tigerBody}`,
    tigerRacket: `${tigerAssetBase}/${previewAssets.tigerRacket}`,
    cloud: `${decorAssetBase}/${previewAssets.cloud}`,
    mountain: `${decorAssetBase}/${previewAssets.mountain}`,
    backWave: `${decorAssetBase}/${previewAssets.backWave}`,
    midWave: `${decorAssetBase}/${previewAssets.midWave}`,
    frontFoam: `${decorAssetBase}/${previewAssets.frontFoam}`,
    goldInk: `${decorAssetBase}/${previewAssets.goldInk}`,
  };
};

export const previewDefaults: PreviewControls = {
  dragonShow: true,
  dragonX: 71,
  dragonY: 5,
  dragonScale: 1,
  dragonRotation: 0,
  clawShow: true,
  clawX: -30,
  clawY: -11,
  clawScale: 0.81,
  clawRotation: 35,
  rearClawShow: true,
  rearClawX: 14,
  rearClawY: -6,
  rearClawScale: 0.54,
  rearClawRotation: -18,
  bagBaseShow: true,
  bagBaseX: 0,
  bagBaseY: 2,
  bagBaseScale: 1,
  bagBaseRotation: 5,
  bagStrapShow: true,
  bagStrapX: -3,
  bagStrapY: 15,
  bagStrapScale: 1.15,
  bagStrapRotation: -2,
  tigerShow: true,
  tigerX: 0,
  tigerY: 0,
  tigerScale: 1,
  tigerRotation: 0,
  tigerRacketShow: true,
  tigerRacketX: 0,
  tigerRacketY: 0,
  tigerRacketScale: 1,
  tigerRacketRotation: 0,
  heroShow: true,
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
  decorMode: "FULL",
  cloudShow: true,
  cloudX: 82,
  cloudY: 42,
  cloudScale: 0.76,
  cloudRotation: -8,
  cloudOpacity: 100,
  cloudBlur: 0,
  mountainShow: true,
  mountainX: -58,
  mountainY: 224,
  mountainScale: 0.72,
  mountainRotation: 0,
  mountainOpacity: 100,
  mountainBlur: 0,
  backWaveShow: true,
  backWaveX: -38,
  backWaveY: 398,
  backWaveScale: 0.9,
  backWaveRotation: -4,
  backWaveOpacity: 100,
  backWaveBlur: 0,
  midWaveShow: true,
  midWaveX: -36,
  midWaveY: 514,
  midWaveScale: 0.98,
  midWaveRotation: 2,
  midWaveOpacity: 100,
  midWaveBlur: 0,
  frontFoamShow: true,
  frontFoamX: -46,
  frontFoamY: 646,
  frontFoamScale: 1.02,
  frontFoamRotation: 0,
  frontFoamOpacity: 100,
  frontFoamBlur: 0,
  goldInkShow: true,
  goldInkX: 6,
  goldInkY: 152,
  goldInkScale: 0.92,
  goldInkRotation: 0,
  goldInkOpacity: 100,
  goldInkBlur: 0,
};

export const targetControlKeys: Record<PreviewTargetId, (keyof PreviewControls)[]> = {
  "DRAGON RIG": ["dragonShow", "dragonX", "dragonY", "dragonScale", "dragonRotation"],
  "REAR CLAW": ["rearClawShow", "rearClawX", "rearClawY", "rearClawScale", "rearClawRotation"],
  "FRONT CLAW": ["clawShow", "clawX", "clawY", "clawScale", "clawRotation"],
  "BAG BASE": ["bagBaseShow", "bagBaseX", "bagBaseY", "bagBaseScale", "bagBaseRotation"],
  "BAG STRAP": ["bagStrapShow", "bagStrapX", "bagStrapY", "bagStrapScale", "bagStrapRotation"],
  "TIGER RIG": ["tigerShow", "tigerX", "tigerY", "tigerScale", "tigerRotation"],
  "TIGER RACKET": ["tigerRacketShow", "tigerRacketX", "tigerRacketY", "tigerRacketScale", "tigerRacketRotation"],
  HERO: ["heroShow", "heroX", "heroY", "heroScale", "heroWidth", "heroEventY", "heroCtaY"],
  "SAFE ZONE": ["showSafeZone", "safeZoneX", "safeZoneY", "safeZoneWidth", "safeZoneHeight"],
  CLOUD: ["cloudShow", "cloudX", "cloudY", "cloudScale", "cloudRotation", "cloudOpacity", "cloudBlur"],
  MOUNTAIN: ["mountainShow", "mountainX", "mountainY", "mountainScale", "mountainRotation", "mountainOpacity", "mountainBlur"],
  "BACK WAVE": ["backWaveShow", "backWaveX", "backWaveY", "backWaveScale", "backWaveRotation", "backWaveOpacity", "backWaveBlur"],
  "MID WAVE": ["midWaveShow", "midWaveX", "midWaveY", "midWaveScale", "midWaveRotation", "midWaveOpacity", "midWaveBlur"],
  "FRONT FOAM": ["frontFoamShow", "frontFoamX", "frontFoamY", "frontFoamScale", "frontFoamRotation", "frontFoamOpacity", "frontFoamBlur"],
  "GOLD / INK": ["goldInkShow", "goldInkX", "goldInkY", "goldInkScale", "goldInkRotation", "goldInkOpacity", "goldInkBlur"],
};

export const targetVisibilityKeys: Partial<Record<PreviewTargetId, PreviewBooleanControlKey>> = {
  "DRAGON RIG": "dragonShow",
  "REAR CLAW": "rearClawShow",
  "FRONT CLAW": "clawShow",
  "BAG BASE": "bagBaseShow",
  "BAG STRAP": "bagStrapShow",
  "TIGER RIG": "tigerShow",
  "TIGER RACKET": "tigerRacketShow",
  HERO: "heroShow",
  "SAFE ZONE": "showSafeZone",
  CLOUD: "cloudShow",
  MOUNTAIN: "mountainShow",
  "BACK WAVE": "backWaveShow",
  "MID WAVE": "midWaveShow",
  "FRONT FOAM": "frontFoamShow",
  "GOLD / INK": "goldInkShow",
};

export const bagBaseBaseline = { left: 63.0859375, top: 12.2395833, width: 40.0390625, rotation: -7 } as const;
export const bagStrapBaseline = { left: 57.6171875, top: 18.4895833, width: 20.80078125, rotation: 2 } as const;
export const clawBaseline = { left: 58, top: 38, width: 50 } as const;
export const rearClawBaseline = { left: 53, top: 23, width: 46 } as const;
export const tigerRigBaseline = { left: -118, top: 485, width: 330, bodyRotation: -5 } as const;
export const tigerRacketBaseline = { left: 56.9696969697, top: -9.9431618497, width: 81.2121212121, rotation: -6 } as const;
export const heroBaseline = { centerX: 195, top: 286 } as const;
export const safeZoneBaseline = { left: 48, top: 238 } as const;
export const decorBaseline = { left: 0, top: 0, width: 390 } as const;

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
  cloudX: { label: "X", min: -200, max: 200 },
  cloudY: { label: "Y", min: -900, max: 900 },
  cloudScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  cloudRotation: { label: "Rotation", min: -90, max: 90 },
  cloudOpacity: { label: "Opacity", min: 0, max: 100 },
  cloudBlur: { label: "Blur", min: 0, max: 8 },
  mountainX: { label: "X", min: -200, max: 200 },
  mountainY: { label: "Y", min: -900, max: 900 },
  mountainScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  mountainRotation: { label: "Rotation", min: -90, max: 90 },
  mountainOpacity: { label: "Opacity", min: 0, max: 100 },
  mountainBlur: { label: "Blur", min: 0, max: 8 },
  backWaveX: { label: "X", min: -200, max: 200 },
  backWaveY: { label: "Y", min: -900, max: 900 },
  backWaveScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  backWaveRotation: { label: "Rotation", min: -90, max: 90 },
  backWaveOpacity: { label: "Opacity", min: 0, max: 100 },
  backWaveBlur: { label: "Blur", min: 0, max: 8 },
  midWaveX: { label: "X", min: -200, max: 200 },
  midWaveY: { label: "Y", min: -900, max: 900 },
  midWaveScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  midWaveRotation: { label: "Rotation", min: -90, max: 90 },
  midWaveOpacity: { label: "Opacity", min: 0, max: 100 },
  midWaveBlur: { label: "Blur", min: 0, max: 8 },
  frontFoamX: { label: "X", min: -200, max: 200 },
  frontFoamY: { label: "Y", min: -900, max: 900 },
  frontFoamScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  frontFoamRotation: { label: "Rotation", min: -90, max: 90 },
  frontFoamOpacity: { label: "Opacity", min: 0, max: 100 },
  frontFoamBlur: { label: "Blur", min: 0, max: 8 },
  goldInkX: { label: "X", min: -200, max: 200 },
  goldInkY: { label: "Y", min: -900, max: 900 },
  goldInkScale: { label: "Scale", min: 0.3, max: 2, step: 0.01 },
  goldInkRotation: { label: "Rotation", min: -90, max: 90 },
  goldInkOpacity: { label: "Opacity", min: 0, max: 100 },
  goldInkBlur: { label: "Blur", min: 0, max: 8 },
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
Show: ${controls.dragonShow ? "ON" : "OFF"}
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
Show: ${controls.clawShow ? "ON" : "OFF"}
X: ${Math.round(controls.clawX)}
Y: ${Math.round(controls.clawY)}
Scale: ${controls.clawScale.toFixed(2)}
Rotation: ${Math.round(controls.clawRotation)}

BAG BASE
Show: ${controls.bagBaseShow ? "ON" : "OFF"}
X: ${Math.round(controls.bagBaseX)}
Y: ${Math.round(controls.bagBaseY)}
Scale: ${controls.bagBaseScale.toFixed(2)}
Rotation Delta: ${Math.round(controls.bagBaseRotation)}

BAG STRAP
Show: ${controls.bagStrapShow ? "ON" : "OFF"}
X: ${Math.round(controls.bagStrapX)}
Y: ${Math.round(controls.bagStrapY)}
Scale: ${controls.bagStrapScale.toFixed(2)}
Rotation Delta: ${Math.round(controls.bagStrapRotation)}

TIGER RIG
Show: ${controls.tigerShow ? "ON" : "OFF"}
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
Show: ${controls.heroShow ? "ON" : "OFF"}
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
Height: ${Math.round(controls.safeZoneHeight)}

CLOUD
Show: ${controls.cloudShow ? "ON" : "OFF"}
X: ${Math.round(controls.cloudX)}
Y: ${Math.round(controls.cloudY)}
Scale: ${controls.cloudScale.toFixed(2)}
Rotation: ${Math.round(controls.cloudRotation)}
Opacity: ${Math.round(controls.cloudOpacity)}
Blur: ${Math.round(controls.cloudBlur)}

MOUNTAIN
Show: ${controls.mountainShow ? "ON" : "OFF"}
X: ${Math.round(controls.mountainX)}
Y: ${Math.round(controls.mountainY)}
Scale: ${controls.mountainScale.toFixed(2)}
Rotation: ${Math.round(controls.mountainRotation)}
Opacity: ${Math.round(controls.mountainOpacity)}
Blur: ${Math.round(controls.mountainBlur)}

BACK WAVE
Show: ${controls.backWaveShow ? "ON" : "OFF"}
X: ${Math.round(controls.backWaveX)}
Y: ${Math.round(controls.backWaveY)}
Scale: ${controls.backWaveScale.toFixed(2)}
Rotation: ${Math.round(controls.backWaveRotation)}
Opacity: ${Math.round(controls.backWaveOpacity)}
Blur: ${Math.round(controls.backWaveBlur)}

MID WAVE
Show: ${controls.midWaveShow ? "ON" : "OFF"}
X: ${Math.round(controls.midWaveX)}
Y: ${Math.round(controls.midWaveY)}
Scale: ${controls.midWaveScale.toFixed(2)}
Rotation: ${Math.round(controls.midWaveRotation)}
Opacity: ${Math.round(controls.midWaveOpacity)}
Blur: ${Math.round(controls.midWaveBlur)}

FRONT FOAM
Show: ${controls.frontFoamShow ? "ON" : "OFF"}
X: ${Math.round(controls.frontFoamX)}
Y: ${Math.round(controls.frontFoamY)}
Scale: ${controls.frontFoamScale.toFixed(2)}
Rotation: ${Math.round(controls.frontFoamRotation)}
Opacity: ${Math.round(controls.frontFoamOpacity)}
Blur: ${Math.round(controls.frontFoamBlur)}

GOLD / INK
Show: ${controls.goldInkShow ? "ON" : "OFF"}
X: ${Math.round(controls.goldInkX)}
Y: ${Math.round(controls.goldInkY)}
Scale: ${controls.goldInkScale.toFixed(2)}
Rotation: ${Math.round(controls.goldInkRotation)}
Opacity: ${Math.round(controls.goldInkOpacity)}
Blur: ${Math.round(controls.goldInkBlur)}

DECOR MODE
Mode: ${controls.decorMode}`;
