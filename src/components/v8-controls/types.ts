export interface V8VisualControls {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  zIndex: number;
}

export type V8TextAlign = "left" | "center" | "right";

export interface V8TextControls {
  fontSize: number;
  maxWidth: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: V8TextAlign;
  fontWeight: number;
}
