export type PreviewControls = {
  dragonX: number;
  dragonY: number;
  dragonScale: number;
  clawX: number;
  clawY: number;
  clawScale: number;
  clawRotation: number;
  bagBaseX: number;
  bagBaseY: number;
  bagBaseScale: number;
  bagBaseRotation: number;
  bagStrapX: number;
  bagStrapY: number;
  bagStrapScale: number;
  bagStrapRotation: number;
  showSafeZone: boolean;
};

export type ControlGroupId = "DRAGON" | "CLAW" | "BAG BASE" | "BAG STRAP" | "VIEW";

export const controlGroupOrder: ControlGroupId[] = ["DRAGON", "CLAW", "BAG BASE", "BAG STRAP", "VIEW"];

export const previewAssets = {
  body: "dragon-body-v2.png",
  claw: "dragon-throw-claw-v1.webp",
  bagBase: "dragon-bag-base-v2-source.png",
  bagStrap: "dragon-bag-strap-overlay-v2-source.png",
} as const;

export const buildPreviewAssets = (baseUrl: string) => {
  const assetBase = `${baseUrl}v8-preview/dragon`;
  return {
    body: `${assetBase}/${previewAssets.body}`,
    claw: `${assetBase}/${previewAssets.claw}`,
    bagBase: `${assetBase}/${previewAssets.bagBase}`,
    bagStrap: `${assetBase}/${previewAssets.bagStrap}`,
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
  bagBaseX: 0,
  bagBaseY: 2,
  bagBaseScale: 1,
  bagBaseRotation: 5,
  bagStrapX: -3,
  bagStrapY: 15,
  bagStrapScale: 1.15,
  bagStrapRotation: -2,
  showSafeZone: true,
};

export const bagBaseBaseline = { left: 63.0859375, top: 12.2395833, width: 40.0390625, rotation: -7 } as const;
export const bagStrapBaseline = { left: 57.6171875, top: 18.4895833, width: 20.80078125, rotation: 2 } as const;
export const clawBaseline = { left: 58, top: 38, width: 50 } as const;

export const controlRanges = {
  dragonX: { min: 35, max: 92 },
  dragonY: { min: -12, max: 38 },
  dragonScale: { min: 0.55, max: 1.65, step: 0.01 },
  clawX: { min: -30, max: 30 },
  clawY: { min: -30, max: 40 },
  clawScale: { min: 0.35, max: 1.35, step: 0.01 },
  clawRotation: { min: -35, max: 35 },
  bagBaseX: { min: -30, max: 30 },
  bagBaseY: { min: -30, max: 30 },
  bagBaseScale: { min: 0.6, max: 1.5, step: 0.01 },
  bagBaseRotation: { min: -25, max: 25 },
  bagStrapX: { min: -30, max: 30 },
  bagStrapY: { min: -40, max: 40 },
  bagStrapScale: { min: 0.6, max: 1.5, step: 0.01 },
  bagStrapRotation: { min: -25, max: 25 },
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

VIEW
Safe Zone: ${controls.showSafeZone ? "ON" : "OFF"}`;
