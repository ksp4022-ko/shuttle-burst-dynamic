export type PreviewControls = {
  dragonX: number;
  dragonY: number;
  dragonScale: number;
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
  tigerRacketX: number;
  tigerRacketY: number;
  tigerRacketScale: number;
  tigerRacketRotation: number;
  showSafeZone: boolean;
};

export type ControlGroupId =
  | "DRAGON"
  | "REAR CLAW"
  | "CLAW"
  | "BAG BASE"
  | "BAG STRAP"
  | "TIGER"
  | "TIGER RACKET"
  | "VIEW";

export const controlGroupOrder: ControlGroupId[] = [
  "DRAGON",
  "REAR CLAW",
  "CLAW",
  "BAG BASE",
  "BAG STRAP",
  "TIGER",
  "TIGER RACKET",
  "VIEW",
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
  tigerRotation: -5,
  tigerRacketX: 18,
  tigerRacketY: 0,
  tigerRacketScale: 1,
  tigerRacketRotation: -6,
  showSafeZone: true,
};

export const bagBaseBaseline = { left: 63.0859375, top: 12.2395833, width: 40.0390625, rotation: -7 } as const;
export const bagStrapBaseline = { left: 57.6171875, top: 18.4895833, width: 20.80078125, rotation: 2 } as const;
export const clawBaseline = { left: 58, top: 38, width: 50 } as const;
export const rearClawBaseline = { left: 53, top: 23, width: 46 } as const;
export const tigerBodyBaseline = { left: -118, top: 485, width: 330 } as const;
export const tigerRacketBaseline = { left: 52, top: 444, width: 268 } as const;

export const controlRanges = {
  dragonX: { min: 35, max: 92 },
  dragonY: { min: -12, max: 38 },
  dragonScale: { min: 0.55, max: 1.65, step: 0.01 },
  clawX: { min: -30, max: 30 },
  clawY: { min: -30, max: 40 },
  clawScale: { min: 0.35, max: 1.35, step: 0.01 },
  clawRotation: { min: -35, max: 35 },
  rearClawX: { min: -30, max: 30 },
  rearClawY: { min: -30, max: 40 },
  rearClawScale: { min: 0.25, max: 1.2, step: 0.01 },
  rearClawRotation: { min: -45, max: 45 },
  bagBaseX: { min: -30, max: 30 },
  bagBaseY: { min: -30, max: 30 },
  bagBaseScale: { min: 0.6, max: 1.5, step: 0.01 },
  bagBaseRotation: { min: -25, max: 25 },
  bagStrapX: { min: -30, max: 30 },
  bagStrapY: { min: -40, max: 40 },
  bagStrapScale: { min: 0.6, max: 1.5, step: 0.01 },
  bagStrapRotation: { min: -25, max: 25 },
  tigerX: { min: -120, max: 120 },
  tigerY: { min: -120, max: 120 },
  tigerScale: { min: 0.4, max: 1.6, step: 0.01 },
  tigerRotation: { min: -30, max: 30 },
  tigerRacketX: { min: -140, max: 140 },
  tigerRacketY: { min: -140, max: 140 },
  tigerRacketScale: { min: 0.3, max: 1.6, step: 0.01 },
  tigerRacketRotation: { min: -120, max: 120 },
} as const;

export const formatPreviewSettings = (controls: PreviewControls) => `V8 DRAGON PREVIEW SETTINGS

DRAGON
X: ${Math.round(controls.dragonX)}
Y: ${Math.round(controls.dragonY)}
Scale: ${controls.dragonScale.toFixed(2)}

CLAW
X: ${Math.round(controls.clawX)}
Y: ${Math.round(controls.clawY)}
Scale: ${controls.clawScale.toFixed(2)}
Rotation: ${Math.round(controls.clawRotation)}

REAR CLAW
Show: ${controls.rearClawShow ? "ON" : "OFF"}
X: ${Math.round(controls.rearClawX)}
Y: ${Math.round(controls.rearClawY)}
Scale: ${controls.rearClawScale.toFixed(2)}
Rotation: ${Math.round(controls.rearClawRotation)}

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

TIGER
X: ${Math.round(controls.tigerX)}
Y: ${Math.round(controls.tigerY)}
Scale: ${controls.tigerScale.toFixed(2)}
Rotation: ${Math.round(controls.tigerRotation)}

TIGER RACKET
X: ${Math.round(controls.tigerRacketX)}
Y: ${Math.round(controls.tigerRacketY)}
Scale: ${controls.tigerRacketScale.toFixed(2)}
Rotation: ${Math.round(controls.tigerRacketRotation)}

VIEW
Safe Zone: ${controls.showSafeZone ? "ON" : "OFF"}`;
