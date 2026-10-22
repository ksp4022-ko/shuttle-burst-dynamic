import { useEffect, useRef, type MutableRefObject } from "react";
import type MatterNS from "matter-js";
import type { V11Meetup } from "@/lib/v11-meetups";
import { V11Mochi } from "./v11-mochi";
import {
  v11DrawCount,
  v11DrawExtra,
  v11DrawMeetup,
  v11CountShape,
  v11HullOf,
  V11_BAG_EGGS,
  V11_DECOR,
  v11ExtraShape,
  type V11Extra,
  type V11ExtraKind,
  type V11Shape,
} from "./v11-extras";

// The falling-meetup stage (docs/V11_BASELINE.md D3–D6): an orange court
// where every meetup that has not ended is a calendar sticker, plus one grey
// "已結束 N 場" sticker. Stickers are drawn on a canvas (no images). The
// first paint shows them resting at the bottom, already tappable; Matter.js
// loads after that and drops them in. A finger that lands on a sticker
// drags / throws it; one that lands on empty court scrolls the page.
// A tap (< 8px, < 300ms) opens the meetup.

export type V11SrcRect = { cx: number; cy: number; w: number; h: number; angle: number };
export type V11StageApi = {
  // Gravity in screen units (down = {x: 0, y: 1}); null puts it back down.
  setGravity: (g: { x: number; y: number } | null) => void;
  drop: () => void;
  rectOf: (id: string) => V11SrcRect | null;
  // Holds a sticker in place while its card is open.
  hold: (id: string | null) => void;
  // 墨糰 nods: a refresh finished (D14).
  cheer: () => void;
};

const CJK = '"PingFang TC","Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif';

type Spec = { kind: "meetup" | "more" | "ended" | V11ExtraKind; id: string };
const DRAGON: V11Extra = { kind: "dragon", id: "dragon" };
// Stickers that live on the stage only (not in the page's extras).
const isLocal = (kind: Spec["kind"]) =>
  kind === "dragon" || V11_BAG_EGGS.includes(kind as V11ExtraKind);
const isExtra = (kind: Spec["kind"]) => kind !== "meetup" && kind !== "more" && kind !== "ended";

// The stage holds the next few meetups; later ones fold into one
// "之後 N 場" sticker, past ones into "已結束 N 場". Both open a list.
// V11-023: just the nearest one (the rest fold into the 之後 tube).
export const V11_STAGE_MAX = 1;
type Item = {
  spec: Spec;
  position: { x: number; y: number };
  angle: number;
  body: MatterNS.Body | null;
  // Resting tilt the sticker rights itself to (a little hand-placed lean).
  tilt: number;
};

// V11-018 / V11-025: a quicker fall.
const GRAVITY = 3;
// V11-024: the floor's slope (radians) and the gap between drops (ms).
// V11-031: the floor is level again (the drop still rolls right).
const FLOOR_TILT = 0;
const DROP_GAP = 140;

function loadMatter(): Promise<typeof MatterNS> {
  return import("matter-js").then(
    (mod) =>
      (mod as unknown as { default?: typeof MatterNS }).default ??
      (mod as unknown as typeof MatterNS),
  );
}

export function V11Stage({
  meetups,
  extras,
  currentId,
  bubble,
  signedIn,
  intro,
  hiddenId,
  still,
  apiRef,
  onTap,
  onPhysicsFail,
}: {
  meetups: V11Meetup[];
  // V11-007 / V11-008: the small stickers (each only when it applies).
  extras: V11Extra[];
  // V11-006: 目前這場 (the meetup the dock acts on) wears a 目前 tag.
  currentId: string | null;
  // V11-007: what 墨糰 is saying right now ("" = nothing).
  bubble: string;
  signedIn: boolean;
  // The opening screen is up: 墨糰 is still on it (D13).
  intro: boolean;
  hiddenId: string | null;
  still: boolean;
  apiRef: MutableRefObject<V11StageApi | null>;
  onTap: (id: string, rect: V11SrcRect) => void;
  onPhysicsFail: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const courtRef = useRef<HTMLCanvasElement>(null);
  const mochiRef = useRef<HTMLCanvasElement>(null);
  // Latest props for the animation loop (it lives outside React renders).
  const live = useRef({
    meetups,
    extras,
    currentId,
    signedIn,
    hiddenId,
    onTap,
    onPhysicsFail,
    still,
    intro,
  });
  live.current = {
    meetups,
    extras,
    currentId,
    signedIn,
    hiddenId,
    onTap,
    onPhysicsFail,
    still,
    intro,
  };
  const rebuildRef = useRef<() => void>(() => {});
  const syncRef = useRef<() => void>(() => {});
  // Extras come and go without re-dropping the pile.
  const extrasKey = extras.map((x) => x.id).join(",");

  // Which stickers exist: rebuild (re-drop) only when that set changes.
  const upcoming = meetups.filter((m) => !m.ended);
  const endedCount = meetups.length - upcoming.length;
  const specKey =
    upcoming
      .slice(0, V11_STAGE_MAX)
      .map((m) => m.id)
      .join(",") +
    (upcoming.length > V11_STAGE_MAX ? "|more" : "") +
    (endedCount ? "|ended" : "") +
    // D14: a new 下一場 drops the pile again too.
    `|next:${meetups.find((m) => m.next)?.id ?? ""}`;

  useEffect(() => {
    const stage = stageRef.current;
    const cv = canvasRef.current;
    const mc = mochiRef.current;
    const court = courtRef.current;
    if (!stage || !cv || !mc || !court) return;
    const ctx = cv.getContext("2d");
    const cctx = court.getContext("2d");
    if (!ctx || !cctx) return;
    const mochi = new V11Mochi(mc, "neutral");
    let M: typeof MatterNS | null = null;
    let engine: MatterNS.Engine | null = null;
    let mochiBody: MatterNS.Body | null = null;
    let items: Item[] = [];
    let drag: MatterNS.Constraint | null = null;
    let grav = { x: 0, y: 1 };
    let topWall: MatterNS.Body | null = null;
    let floor: MatterNS.Body | null = null;
    // V11-030: when the next idle wiggle may happen (ms); Infinity until the
    // drop has settled.
    let nextWiggle = Infinity;
    // V11-032: where each sticker of this drop lands (x), for the L pile.
    let plan = new Map<string, number>();
    // V11-001: when each sticker started resting on 墨糰 (body id → ms).
    const onMochi = new Map<number, number>();
    let press: { x: number; y: number; t: number; item: Item; moved: boolean } | null = null;
    let timers: number[] = [];
    let held: Item | null = null;
    let W = 0;
    let H = 0;
    let S = 0;
    let raf = 0;
    let disposed = false;

    const specs = (): Spec[] => {
      const upcoming = live.current.meetups.filter((m) => !m.ended);
      const list: Spec[] = upcoming
        .slice(0, V11_STAGE_MAX)
        .map((m) => ({ kind: "meetup", id: m.id }));
      if (upcoming.length > V11_STAGE_MAX) list.push({ kind: "more", id: "more" });
      if (live.current.meetups.some((m) => m.ended)) list.push({ kind: "ended", id: "ended" });
      for (const x of live.current.extras) list.push({ kind: x.kind, id: x.id });
      return list;
    };
    // V11-018: a squarer calendar card. V11-030: the meetup is the star at
    // 1.3×; the decorations are drawn at 0.85× (info stickers stay full size
    // so their text stays at 11pt or more, V11-020).
    const SW = () => S * 0.82 * 1.3;
    const SH = () => S * 0.74 * 1.3;
    const XS = (kind: Spec["kind"]) => (V11_DECOR.has(kind as V11ExtraKind) ? S * 0.85 : S);
    const pad = () => Math.max(4, S * 0.045);
    const shapeOf = (spec: Spec): V11Shape =>
      spec.kind === "meetup"
        ? { type: "rect", w: SW(), h: SH(), r: SH() * 0.16 }
        : spec.kind === "more" || spec.kind === "ended"
          ? v11CountShape(S)
          : v11ExtraShape(spec.kind, XS(spec.kind));
    // V11-013: the 龍虎 logo loads only when the easter egg is found.
    let logo: HTMLImageElement | null = null;
    let mochiTaps: number[] = [];

    const dims = () => {
      const r = stage.getBoundingClientRect();
      W = r.width;
      H = r.height;
      // 2026-10-20: stickers ¾ of the first size, so the pile has room.
      // V11-020: 15% larger again (3 meetups now) so text reads at 11pt.
      S = Math.min(W * 0.44, H * 0.36, 210) * 0.86;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      court.width = cv.width;
      court.height = cv.height;
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawCourt();
    };

    const layoutStatic = () => {
      items = specs()
        .filter((spec) => !isExtra(spec.kind))
        .map((spec, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const tube = v11CountShape(S);
          const h = spec.kind !== "meetup" && tube.type === "rect" ? tube.h : SH();
          return {
            spec,
            position: { x: W * (col ? 0.72 : 0.29), y: H - 14 - h / 2 - row * (SH() + 6) },
            angle: (i % 2 ? 0.07 : -0.06) * (row % 2 ? -1 : 1),
            body: null,
            tilt: 0,
          };
        });
    };

    // V11-019: a sticker is on the stage at most once. The first drop and
    // the extras that arrive with late data (bill, season, …) can both have
    // a spawn queued for the same id; whichever fires second does nothing.
    // An extra that went away before its turn is not dropped either.
    const spawn = (spec: Spec): Item | null => {
      if (!M || !engine) return null;
      if (items.some((it) => it.spec.id === spec.id)) return null;
      if (
        isExtra(spec.kind) &&
        !isLocal(spec.kind) &&
        !live.current.extras.some((x) => x.id === spec.id)
      )
        return null;
      // V11-018: everything drops in on the left, away from 墨糰 (top right).
      // V11-024: everything drops in at the top left and rolls right down
      // the sloped floor.
      // V11-026: the meetup drops straight down the middle so it wedges in
      // the middle of the pile.
      // V11-032: a planned sticker (the L-shaped pile) drops straight down
      // onto its spot, nearly flat; anything else falls in at the top left.
      const meetup = spec.kind === "meetup";
      const target = plan.get(spec.id);
      const x = target ?? W * (0.1 + Math.random() * 0.14);
      const y = live.current.still ? H * 0.5 : -S * 0.6;
      const light = spec.kind === "shuttle";
      const common = {
        restitution: light ? 0.4 : 0.08,
        friction: 0.8,
        // Shuttles drift down like the real thing.
        frictionAir: light ? 0.06 : 0.01,
        angle: target != null ? (Math.random() - 0.5) * 0.12 : (Math.random() - 0.5) * 1.1,
        ...(light ? { density: 0.0004 } : {}),
      };
      const shape = shapeOf(spec);
      const edge = pad();
      // V11-016 / V11-022: shuttle, racket and shoe follow their outline.
      const hull = v11HullOf(spec as { kind: V11ExtraKind; id: string }, XS(spec.kind), pad());
      const body = hull
        ? M.Bodies.fromVertices(x, y, [hull.verts], common)
        : shape.type === "circle"
          ? M.Bodies.circle(x, y, shape.r + edge, common)
          : M.Bodies.rectangle(x, y, shape.w + edge * 2, shape.h + edge * 2, {
              ...common,
              chamfer: { radius: shape.r + edge },
            });
      if (target == null) {
        M.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
        if (!live.current.still && !meetup)
          M.Body.setVelocity(body, { x: 2.5 + Math.random() * 2, y: 0 });
      } else {
        // Already falling fast, so it lands quickly.
        M.Body.setVelocity(body, { x: 0, y: 8 });
      }
      const item: Item = {
        spec,
        position: body.position,
        angle: body.angle,
        body,
        // V11-026: the two tubes may rest leaning up to 15°.
        tilt:
          spec.kind === "more" || spec.kind === "ended"
            ? (Math.random() - 0.5) * 0.52
            : (Math.random() - 0.5) * 0.16,
      };
      items.push(item);
      M.Composite.add(engine.world, body);
      return item;
    };

    const build = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
      held = null;
      nextWiggle = Infinity;
      flying = [];
      dims();
      if (!M) {
        engine = null;
        layoutStatic();
        return;
      }
      // V11-032: resting bodies go to sleep, so the pile stops moving as
      // soon as it has landed (drags, taps and gravity wake them).
      engine = M.Engine.create({ enableSleeping: true });
      engine.gravity.x = grav.x * GRAVITY;
      engine.gravity.y = grav.y * GRAVITY;
      const t = 200;
      const wall = { isStatic: true, friction: 0.6 };
      // V11-024 / V11-025: an unseen floor sloping down to the right (about
      // 10°), level with the stage's bottom edge at the right wall. V11-028:
      // it levels out once everything has landed (levelFloor).
      floor = M.Bodies.rectangle(W / 2, H - W * FLOOR_TILT * 0.5 + t / 2, W + 2 * t, t, {
        ...wall,
        angle: FLOOR_TILT,
      });
      M.Composite.add(engine.world, [
        floor,
        M.Bodies.rectangle(-t / 2, H / 2, t, H * 4, wall),
        M.Bodies.rectangle(W + t / 2, H / 2, t, H * 4, wall),
      ]);
      // The roof starts high so stickers can fall in from above; once they
      // have landed it drops to the stage's top edge (V11-001), so none can
      // rest out of sight above the stage.
      topWall = M.Bodies.rectangle(W / 2, -H * 1.2 - t / 2, W + 2 * t, t, wall);
      M.Composite.add(engine.world, topWall);
      onMochi.clear();
      // 墨糰 is a solid bump in the corner: stickers bounce off its head.
      const sr = stage.getBoundingClientRect();
      const mr = mc.getBoundingClientRect();
      mochiBody = M.Bodies.circle(
        mr.left - sr.left + mr.width / 2,
        mr.top - sr.top + mr.height / 2,
        mr.width * 0.36,
        { isStatic: true, restitution: 0.6 },
      );
      M.Composite.add(engine.world, mochiBody);
      const touching = (pair: MatterNS.Pair) =>
        pair.bodyA === mochiBody ? pair.bodyB : pair.bodyB === mochiBody ? pair.bodyA : null;
      M.Events.on(engine, "collisionActive", (event) => {
        const now = performance.now();
        for (const pair of event.pairs) {
          const other = touching(pair);
          if (other && !onMochi.has(other.id)) onMochi.set(other.id, now);
        }
      });
      M.Events.on(engine, "collisionEnd", (event) => {
        for (const pair of event.pairs) {
          const other = touching(pair);
          if (other) onMochi.delete(other.id);
        }
      });
      M.Events.on(engine, "collisionStart", (event) => {
        for (const pair of event.pairs) {
          const other =
            pair.bodyA === mochiBody ? pair.bodyB : pair.bodyB === mochiBody ? pair.bodyA : null;
          if (other && other.speed > 2.5) {
            mochi.react("surprised", 700);
            break;
          }
        }
      });
      items = [];
      drag = null;
      press = null;
      const still = live.current.still;
      const list = specs();
      // V11-024: big and small stickers take turns (biggest, smallest, next
      // biggest, …) so the small gear wedges between the big ones.
      const area = (spec: Spec) => {
        const shape = shapeOf(spec);
        return shape.type === "circle" ? Math.PI * shape.r * shape.r : shape.w * shape.h;
      };
      // V11-027: with a 之後 tube on the stage, the shuttles wait and pop out
      // of it at the end.
      const popping = !still && list.some((x) => x.kind === "more");
      const later = popping ? list.filter((x) => x.kind === "shuttle") : [];
      // V11-028: the shoe and the racket pop out of the bag the same way.
      const bagged =
        !still && list.some((x) => x.kind === "bag")
          ? list.filter((x) => x.kind === "shoe" || x.kind === "racket")
          : [];
      // V11-032: an L-shaped pile. The meetup takes the bottom-left corner
      // and the column above it (up to just under the title); the rest fill
      // the bottom row to its right, a second layer on top when it is full.
      const p0 = pad();
      const box = (spec: Spec) => {
        const shape = shapeOf(spec);
        return shape.type === "circle"
          ? { w: shape.r * 2 + p0 * 2, h: shape.r * 2 + p0 * 2 }
          : { w: shape.w + p0 * 2, h: shape.h + p0 * 2 };
      };
      const rest = list
        .filter((x) => x.kind !== "meetup" && !later.includes(x) && !bagged.includes(x))
        .sort((a, b) => area(b) - area(a));
      const meetupSpec = list.find((x) => x.kind === "meetup");
      const colW = meetupSpec ? box(meetupSpec).w : S;
      const colTop = Math.min(H * 0.42, 190);
      let colH = meetupSpec ? box(meetupSpec).h : 0;
      plan = new Map();
      if (meetupSpec) plan.set(meetupSpec.id, colW / 2 + 2);
      const column: Spec[] = [];
      const rows: Spec[][] = [[], []];
      let rowX = [colW + 4, colW + 4];
      for (const spec of rest) {
        const b = box(spec);
        if (b.w <= colW + 8 && colH + b.h <= H - colTop && column.length < 2) {
          column.push(spec);
          colH += b.h;
          plan.set(spec.id, colW / 2 + 2 + (Math.random() - 0.5) * 8);
          continue;
        }
        const r = rowX[0]! + b.w <= W - 2 ? 0 : 1;
        // Out of room on both rows: drop it at the right end of the second.
        const x = Math.min(rowX[r]! + b.w / 2, W - b.w / 2 - 2);
        plan.set(spec.id, x);
        rowX = rowX.map((v, i) => (i === r ? v + b.w + 2 : v));
        rows[r]!.push(spec);
      }
      const order: Spec[] = [
        ...(meetupSpec ? [meetupSpec] : []),
        ...rows[0]!,
        ...column,
        ...rows[1]!,
      ];
      // V11-031: the bag is the second last to land.
      const bagAt0 = order.findIndex((x) => x.kind === "bag");
      if (bagAt0 >= 0) {
        const [bag] = order.splice(bagAt0, 1);
        if (bag) order.splice(Math.max(0, order.length - 1), 0, bag);
      }
      order.forEach((spec, i) =>
        timers.push(window.setTimeout(() => spawn(spec), (still ? 0 : DROP_GAP * i) + 120)),
      );
      // V11-032: no shake any more; the gear pops out right after the drop.
      const settled = DROP_GAP * order.length + 500;
      later.forEach((spec, i) =>
        timers.push(window.setTimeout(() => popOut(spec, "more"), settled + i * 250)),
      );
      const bagAt = settled + later.length * 250 + 100;
      bagged.forEach((spec, i) =>
        timers.push(window.setTimeout(() => popOut(spec, "bag"), bagAt + i * 250)),
      );
      const popsEnd =
        later.length || bagged.length ? bagAt + bagged.length * 250 + 500 : settled + 300;
      timers.push(window.setTimeout(raiseRoof, still ? 0 : popsEnd));
      timers.push(window.setTimeout(levelFloor, still ? 0 : popsEnd + 400));
    };
    rebuildRef.current = build;

    // Extras that appeared drop in on their own; ones that went away leave.
    const syncExtras = () => {
      if (!M || !engine) return;
      const want = new Set(live.current.extras.map((x) => x.id));
      for (const it of [...items]) {
        if (!isExtra(it.spec.kind) || want.has(it.spec.id) || isLocal(it.spec.kind)) continue;
        if (it.body) M.Composite.remove(engine.world, it.body);
        items = items.filter((x) => x !== it);
      }
      const have = new Set(items.map((it) => it.spec.id));
      live.current.extras
        .filter((x) => !have.has(x.id))
        .forEach((x, i) =>
          timers.push(
            window.setTimeout(() => {
              if (!engine || items.some((it) => it.spec.id === x.id)) return;
              spawnInside({ kind: x.kind, id: x.id });
            }, 160 * i),
          ),
        );
    };
    syncRef.current = syncExtras;
    // Once the roof is down, newcomers start just inside the top edge.
    const spawnInside = (spec: Spec) => {
      if (!M) return;
      const it = spawn(spec);
      if (it?.body) M.Body.setPosition(it.body, { x: it.body.position.x, y: S * 0.4 });
    };

    // V11-027 / V11-028: a shuttle shoots out of the 之後 tube's open top
    // (cork first); the shoe and the racket out of the bag's top. 墨糰
    // cheers. Without the tube / bag it just drops in.
    const popOut = (spec: Spec, from: "more" | "bag") => {
      if (!M) return;
      const tube = items.find((x) => x.spec.kind === from)?.body;
      const it = spawn(spec);
      if (!tube || !it?.body) return;
      const shape = from === "more" ? v11CountShape(S) : v11ExtraShape("bag", XS("bag"));
      const half = shape.type === "rect" ? shape.h / 2 : S * 0.4;
      const a = tube.angle;
      // The tube's axis, pointing out of its top.
      const ux = Math.sin(a);
      const uy = -Math.cos(a);
      const out = half + S * 0.2;
      M.Body.setPosition(it.body, {
        x: tube.position.x + ux * out,
        y: tube.position.y + uy * out,
      });
      M.Body.setAngle(it.body, spec.kind === "shuttle" ? a + Math.PI : a);
      // V11-032: a softer pop, so the gear lands on the pile.
      const speed = 9 + Math.random() * 2;
      M.Body.setVelocity(it.body, {
        x: ux * speed + (Math.random() - 0.5) * 4,
        y: uy * speed,
      });
      M.Body.setAngularVelocity(it.body, (Math.random() - 0.5) * 0.3);
      mochi.react("excited", 700);
    };

    // V11-030: now and then one resting sticker gives a small hop and a
    // twist, then settles back (self-righting), so the pile feels alive.
    const wiggle = (ms: number) => {
      nextWiggle = ms + 6000 + Math.random() * 2000;
      const c = live.current;
      if (!M || !engine || c.still || c.intro || c.hiddenId || drag || press) return;
      const resting = items.filter(
        (it) => it.body && !it.body.isStatic && it.body.speed < 0.4 && it !== held,
      );
      const it = resting[Math.floor(Math.random() * resting.length)];
      if (!it?.body) return;
      M.Sleeping.set(it.body, false);
      M.Body.setVelocity(it.body, { x: (Math.random() - 0.5) * 1.2, y: -3.2 });
      M.Body.setAngularVelocity(it.body, (Math.random() < 0.5 ? -1 : 1) * 0.07);
    };

    // V11-031: tap the bag and the next piece of gear (socks, bottle, towel,
    // slides) pops out of it; when all are out the bag just shrugs.
    let flying: { spec: Spec; x: number; y: number; angle: number; t0: number }[] = [];
    const popEgg = () => {
      if (!M) return;
      const bag = items.find((x) => x.spec.kind === "bag");
      const out = (k: V11ExtraKind) =>
        items.some((x) => x.spec.kind === k) || flying.some((f) => f.spec.kind === k);
      const kind = V11_BAG_EGGS.find((k) => !out(k));
      if (!kind) {
        if (bag?.body) M.Body.setVelocity(bag.body, { x: 0, y: -4 });
        mochi.react("confused", 700);
        return;
      }
      popOut({ kind, id: kind }, "bag");
    };
    // Tap a piece of gear: it lifts (bigger, a small turn), then flies along
    // a curve into the bag, shrinking below the bag's size and slowly
    // flipping like a playing card. Rare and playful, so it gets ~0.9s.
    const RECALL_MS = 900;
    const LIFT = 0.17;
    const recall = (it: Item) => {
      if (!M || !engine) return;
      if (it.body) M.Composite.remove(engine.world, it.body);
      items = items.filter((x) => x !== it);
      if (live.current.still) return;
      flying.push({
        spec: it.spec,
        x: it.position.x,
        y: it.position.y,
        angle: it.angle,
        t0: performance.now(),
      });
    };
    // cubic-bezier(0.77, 0, 0.175, 1): strong ease-in-out for on-screen
    // movement; (0.23, 1, 0.32, 1): strong ease-out for the lift.
    const bezier = (x1: number, y1: number, x2: number, y2: number) => (t: number) => {
      let lo = 0;
      let hi = 1;
      let u = t;
      for (let i = 0; i < 14; i++) {
        u = (lo + hi) / 2;
        const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
        if (x < t) lo = u;
        else hi = u;
      }
      return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
    };
    const easeInOut = bezier(0.77, 0, 0.175, 1);
    const easeOut = bezier(0.23, 1, 0.32, 1);
    const drawFlying = (ms: number) => {
      if (!flying.length) return;
      const bag = items.find((x) => x.spec.kind === "bag");
      const p = pad();
      const lw = Math.max(2, S * 0.018);
      const done: typeof flying = [];
      for (const f of flying) {
        const k = Math.min(1, (ms - f.t0) / RECALL_MS);
        const tx = bag?.position.x ?? f.x;
        const ty = bag?.position.y ?? f.y;
        let x = f.x;
        let y = f.y;
        let scale: number;
        let flip = 1;
        let angle = f.angle;
        if (k < LIFT) {
          const e = easeOut(k / LIFT);
          scale = 1 + 0.3 * e;
          angle = f.angle + 0.35 * e;
        } else {
          const e = easeInOut((k - LIFT) / (1 - LIFT));
          // Quadratic curve with its peak above both ends.
          const cx = (f.x + tx) / 2;
          const cy = Math.min(f.y, ty) - S * 0.9;
          x = (1 - e) * (1 - e) * f.x + 2 * (1 - e) * e * cx + e * e * tx;
          y = (1 - e) * (1 - e) * f.y + 2 * (1 - e) * e * cy + e * e * ty;
          // 1.3 → 0.25: well under the bag's size when it arrives.
          scale = 1.3 - 1.05 * e;
          angle = f.angle + 0.35 + 0.9 * e;
          // One and a half slow card flips around the vertical axis.
          flip = Math.cos(e * Math.PI * 3);
          if (Math.abs(flip) < 0.08) flip = flip < 0 ? -0.08 : 0.08;
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale * flip, scale);
        v11DrawExtra(
          ctx,
          { kind: f.spec.kind, id: f.spec.kind } as V11Extra,
          XS(f.spec.kind),
          lw,
          p,
          logo,
        );
        ctx.restore();
        if (k >= 1) done.push(f);
      }
      if (done.length) {
        flying = flying.filter((f) => !done.includes(f));
        // The bag catches it: a small bump, and 墨糰 is pleased.
        if (bag?.body && M) M.Body.setVelocity(bag.body, { x: 0, y: -3 });
        mochi.react("happy", 600);
      }
    };

    // V11-028: the sloped floor tilts back level over half a second, so the
    // pile settles across the whole bottom (no gap on the left).
    const levelFloor = () => {
      if (!M || !floor) return;
      const body = floor;
      const t = 200;
      const from = body.angle;
      const fromY = body.position.y;
      const toY = H + t / 2;
      const steps = 12;
      nextWiggle = performance.now() + 3000;
      for (let i = 1; i <= steps; i++) {
        timers.push(
          window.setTimeout(() => {
            if (!M) return;
            const k = i / steps;
            M.Body.setAngle(body, from * (1 - k));
            M.Body.setPosition(body, { x: W / 2, y: fromY + (toY - fromY) * k });
          }, i * 45),
        );
      }
    };

    const raiseRoof = () => {
      if (!M || !topWall) return;
      const t = 200;
      // Anything still above the stage is put back just inside it first.
      for (const it of items) {
        const b = it.body;
        if (!b || b.bounds.min.y >= 0) continue;
        M.Body.setPosition(b, { x: b.position.x, y: (b.bounds.max.y - b.bounds.min.y) / 2 + 2 });
        M.Body.setVelocity(b, { x: 0, y: 0 });
      }
      M.Body.setPosition(topWall, { x: W / 2, y: -t / 2 });
    };

    // ---------- drawing ----------
    const drawCourt = () => {
      // V11-002: a doubles badminton court (13.4 m × 6.1 m) in faint chalk,
      // turned 30° clockwise on its own layer under the title and stickers.
      // Its length reaches across the stage; the ends may be cropped.
      const turn = Math.PI / 6;
      const sc = ((W * Math.sin(turn) + H * Math.cos(turn)) / 13.4) * 1.05;
      const cw = 6.1 * sc;
      const ch = 13.4 * sc;
      const x0 = -cw / 2;
      const y0 = -ch / 2;
      const c = cctx;
      c.clearRect(0, 0, W, H);
      c.save();
      c.translate(W / 2, H / 2);
      c.rotate(turn);
      c.strokeStyle = "rgba(255,253,247,.32)";
      c.lineWidth = 2;
      c.strokeRect(x0, y0, cw, ch);
      const side = 0.46 * sc;
      const short = 1.98 * sc;
      const long = 0.76 * sc;
      c.beginPath();
      c.moveTo(x0 + side, y0);
      c.lineTo(x0 + side, y0 + ch);
      c.moveTo(x0 + cw - side, y0);
      c.lineTo(x0 + cw - side, y0 + ch);
      for (const y of [-short, short, y0 + long, y0 + ch - long]) {
        c.moveTo(x0, y);
        c.lineTo(x0 + cw, y);
      }
      c.moveTo(0, y0);
      c.lineTo(0, -short);
      c.moveTo(0, short);
      c.lineTo(0, y0 + ch);
      c.stroke();
      c.setLineDash([6, 5]);
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x0 - 6, 0);
      c.lineTo(x0 + cw + 6, 0);
      c.stroke();
      c.restore();
    };
    const drawSticker = (it: Item) => {
      const p = pad();
      const lw = Math.max(2, S * 0.018);
      ctx.save();
      ctx.translate(it.position.x, it.position.y);
      ctx.rotate(it.angle);
      if (isExtra(it.spec.kind)) {
        const ex = live.current.extras.find((x) => x.id === it.spec.id);
        const egg = isLocal(it.spec.kind)
          ? it.spec.kind === "dragon"
            ? DRAGON
            : ({ kind: it.spec.kind, id: it.spec.kind } as V11Extra)
          : null;
        // A hull body sits at the hull's centroid, not at the art's origin.
        const hull = v11HullOf(it.spec as { kind: V11ExtraKind; id: string }, XS(it.spec.kind), p);
        if (hull) ctx.translate(-hull.centre.x, -hull.centre.y);
        if (ex ?? egg) v11DrawExtra(ctx, (ex ?? egg)!, XS(it.spec.kind), lw, p, logo);
      } else if (it.spec.kind !== "meetup") {
        const more = it.spec.kind === "more";
        const n = more
          ? live.current.meetups.filter((m) => !m.ended).length - V11_STAGE_MAX
          : live.current.meetups.filter((m) => m.ended).length;
        v11DrawCount(ctx, more ? "more" : "ended", n, S, lw, p);
      } else {
        const m = live.current.meetups.find((x) => x.id === it.spec.id);
        if (m)
          v11DrawMeetup(ctx, m, {
            w: SW(),
            h: SH(),
            lw,
            pad: p,
            picked: m.id === live.current.currentId,
            signedIn: live.current.signedIn,
          });
      }
      ctx.restore();
    };

    // V11-028: the meetup sticker says what a tap on it does (請假 / 報名 …)
    // in a small bubble above it, now and then (between 墨糰's lines).
    const hintStart = performance.now();
    const hintOf = (m: V11Meetup) => {
      if (!live.current.signedIn) return "點我看這場";
      if (m.mine?.status === "leave") return "消假點這裡";
      if (m.mine?.type === "fixed") return "請假點這裡";
      if (m.mine) return "取消點這裡";
      return m.started ? "" : "報名點這裡";
    };
    const drawMeetupHint = (ms: number) => {
      if (live.current.intro || live.current.hiddenId) return;
      const phase = (ms - hintStart) % 12000;
      if (phase < 6000 || phase > 10000) return;
      const it = items.find((x) => x.spec.kind === "meetup");
      const m = it && live.current.meetups.find((x) => x.id === it.spec.id);
      if (!it || !m || it.body === drag?.bodyB) return;
      const text = hintOf(m);
      if (!text) return;
      // Pop in over the first 200ms.
      const k = Math.min(1, (phase - 6000) / 200);
      ctx.save();
      ctx.font = `900 14px ${CJK}`;
      const tw = ctx.measureText(text).width + 22;
      const th = 28;
      const x = Math.max(6, Math.min(W - tw - 6, it.position.x - tw / 2));
      const y = Math.max(6, it.position.y - SH() / 2 - pad() - th - 14);
      const tipX = Math.max(x + 14, Math.min(x + tw - 14, it.position.x));
      ctx.translate(tipX, y + th);
      ctx.scale(k, k);
      ctx.translate(-tipX, -(y + th));
      ctx.beginPath();
      ctx.roundRect(x, y, tw, th, th / 2);
      ctx.moveTo(tipX - 7, y + th - 1);
      ctx.lineTo(tipX, y + th + 9);
      ctx.lineTo(tipX + 7, y + th - 1);
      ctx.fillStyle = "#f6c21c";
      ctx.shadowColor = "rgba(20,20,20,.3)";
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#141414";
      ctx.stroke();
      ctx.fillStyle = "#141414";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x + tw / 2, y + th / 2 + 1);
      ctx.restore();
    };

    // ---------- pointer ----------
    const point = (e: MouseEvent | TouchEvent) => {
      const r = cv.getBoundingClientRect();
      const p = "touches" in e ? e.touches[0] : e;
      if (!p) return null;
      return {
        x: Math.max(0, Math.min(W, p.clientX - r.left)),
        y: Math.max(0, Math.min(H, p.clientY - r.top)),
        cx: p.clientX,
        cy: p.clientY,
      };
    };
    const hit = (p: { x: number; y: number }): Item | null => {
      if (M && engine) {
        const bodies = items.map((it) => it.body).filter((b): b is MatterNS.Body => Boolean(b));
        const hits = new Set(M.Query.point(bodies, p));
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          if (it?.body && hits.has(it.body)) return it;
        }
        return null;
      }
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (!it) continue;
        const dx = p.x - it.position.x;
        const dy = p.y - it.position.y;
        const c = Math.cos(-it.angle);
        const s = Math.sin(-it.angle);
        const lx = dx * c - dy * s;
        const ly = dx * s + dy * c;
        const shape = shapeOf(it.spec);
        const inside =
          shape.type === "circle"
            ? Math.hypot(lx, ly) < shape.r + 6
            : Math.abs(lx) < shape.w / 2 + 6 && Math.abs(ly) < shape.h / 2 + 6;
        if (inside) return it;
      }
      return null;
    };
    const rectOfItem = (it: Item): V11SrcRect => {
      const r = cv.getBoundingClientRect();
      const shape = shapeOf(it.spec);
      return {
        cx: r.left + it.position.x,
        cy: r.top + it.position.y,
        w: shape.type === "circle" ? shape.r * 2 : shape.w,
        h: shape.type === "circle" ? shape.r * 2 : shape.h,
        angle: it.angle,
      };
    };
    const down = (e: MouseEvent | TouchEvent) => {
      if (live.current.hiddenId) return;
      const p = point(e);
      if (!p) return;
      const it = hit(p);
      if (!it) {
        tapMochi(p);
        return;
      }
      if (e.cancelable) e.preventDefault();
      press = { x: p.x, y: p.y, t: performance.now(), item: it, moved: false };
      if (it.body && M) M.Sleeping.set(it.body, false);
      if (M && engine && it.body && !it.body.isStatic) {
        drag = M.Constraint.create({
          pointA: { x: p.x, y: p.y },
          bodyB: it.body,
          pointB: { x: p.x - it.body.position.x, y: p.y - it.body.position.y },
          stiffness: 0.18,
          damping: 0.08,
          length: 0,
        });
        M.Composite.add(engine.world, drag);
      }
      cv.classList.add("is-grabbing");
    };
    // V11-013: tap 墨糰 three times and the 龍虎 sticker drops in.
    const tapMochi = (p: { x: number; y: number }) => {
      if (!M || !engine || !mochiBody) return;
      const r = mochiBody.circleRadius ?? 0;
      if (Math.hypot(p.x - mochiBody.position.x, p.y - mochiBody.position.y) > r * 1.25) return;
      const now = performance.now();
      mochiTaps = [...mochiTaps.filter((t) => now - t < 1500), now];
      mochi.react("curious", 400);
      if (mochiTaps.length < 3) return;
      mochiTaps = [];
      mochi.react("excited", 1400);
      const egg = items.find((x) => x.spec.kind === "dragon");
      if (egg?.body) {
        M.Body.setVelocity(egg.body, { x: (Math.random() - 0.5) * 6, y: -10 });
        return;
      }
      if (!logo) {
        logo = new Image();
        logo.src = `${import.meta.env.BASE_URL}v9/brand/logo.webp`;
      }
      spawnInside({ kind: "dragon", id: "dragon" });
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!press) return;
      if (e.cancelable) e.preventDefault();
      const p = point(e);
      if (!p) return;
      mochi.pointer(p.cx, p.cy);
      if (drag) drag.pointA = { x: p.x, y: p.y };
      if (Math.hypot(p.x - press.x, p.y - press.y) > 8) press.moved = true;
    };
    const up = () => {
      if (!press) return;
      if (drag && M && engine) M.Composite.remove(engine.world, drag);
      drag = null;
      cv.classList.remove("is-grabbing");
      const done = press;
      press = null;
      if (!done.moved && performance.now() - done.t < 300) {
        const kind = done.item.spec.kind;
        const b = done.item.body;
        // V11-031: the bag gives out its gear; the gear flies back in.
        if (kind === "bag") {
          popEgg();
          return;
        }
        if (V11_BAG_EGGS.includes(kind as V11ExtraKind)) {
          recall(done.item);
          return;
        }
        if (V11_DECOR.has(kind as V11ExtraKind)) {
          // Just for fun: a hop, and 墨糰 waves / jumps.
          if (b && M) M.Body.setVelocity(b, { x: (Math.random() - 0.5) * 6, y: -9 });
          mochi.react(kind === "shuttle" ? "excited" : "surprised", 900);
          return;
        }
        live.current.onTap(done.item.spec.id, rectOfItem(done.item));
      }
    };
    const onPointerMove = (e: PointerEvent) => mochi.pointer(e.clientX, e.clientY);
    cv.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    cv.addEventListener("touchstart", down, { passive: false });
    cv.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    window.addEventListener("touchcancel", up);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // ---------- api ----------
    apiRef.current = {
      setGravity: (g) => {
        const was = grav;
        grav = g ?? { x: 0, y: 1 };
        if (engine) {
          engine.gravity.x = grav.x * GRAVITY;
          engine.gravity.y = grav.y * GRAVITY;
          for (const it of items) if (it.body && M) M.Sleeping.set(it.body, false);
        }
        // A big swing of the phone startles 墨糰.
        if (Math.hypot(grav.x - was.x, grav.y - was.y) > 0.9) mochi.react("surprised", 600);
      },
      drop: () => {
        build();
        mochi.bump();
      },
      rectOf: (id) => {
        const it = items.find((x) => x.spec.id === id);
        return it ? rectOfItem(it) : null;
      },
      cheer: () => mochi.react("happy", 900),
      hold: (id) => {
        if (held?.body && M) M.Body.setStatic(held.body, false);
        held = id ? (items.find((x) => x.spec.id === id) ?? null) : null;
        if (held?.body && M) M.Body.setStatic(held.body, true);
      },
    };

    // ---------- loop ----------
    let last = performance.now();
    const loop = (ms: number) => {
      const dt = Math.min(ms - last, 32);
      last = ms;
      if (M && engine) {
        // Self-righting: once a sticker slows down it turns back toward
        // upright (plus its own small tilt) so the date reads the right way.
        // A sticker in the finger keeps whatever angle it is dragged to.
        for (const it of items) {
          const b = it.body;
          if (!b || b.isStatic || b.isSleeping || b === drag?.bodyB || b.speed > 6) continue;
          let diff = (it.tilt - b.angle) % (Math.PI * 2);
          if (diff > Math.PI) diff -= Math.PI * 2;
          if (diff < -Math.PI) diff += Math.PI * 2;
          M.Body.setAngularVelocity(b, b.angularVelocity * 0.9 + diff * 0.012);
        }
        M.Engine.update(engine, dt);
        for (const it of items) {
          if (it.body) {
            it.position = it.body.position;
            it.angle = it.body.angle;
          }
        }
      }
      // V11-001: a sticker that has sat on 墨糰 for a second gets shrugged off.
      if (M && mochiBody) {
        const now = performance.now();
        for (const it of items) {
          const b = it.body;
          let since = b ? onMochi.get(b.id) : undefined;
          // V11-032: a sticker that fell asleep on 墨糰 no longer reports
          // contact, so check by distance too.
          if (b && since === undefined && b.isSleeping) {
            const r =
              (mochiBody.circleRadius ?? 0) +
              Math.max(b.bounds.max.x - b.bounds.min.x, b.bounds.max.y - b.bounds.min.y) / 2;
            if (
              Math.hypot(b.position.x - mochiBody.position.x, b.position.y - mochiBody.position.y) <
              r
            )
              since = now - 1000;
          }
          if (!b || since === undefined || now - since < 1000 || (!b.isSleeping && b.speed > 1.5))
            continue;
          if (b === drag?.bodyB) continue;
          M.Sleeping.set(b, false);
          const dx = b.position.x - mochiBody.position.x;
          const dy = b.position.y - mochiBody.position.y;
          const d = Math.hypot(dx, dy) || 1;
          M.Body.setVelocity(b, { x: (dx / d) * 7 - 2, y: (dy / d) * 4 - 6 });
          M.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.3);
          onMochi.set(b.id, now + 600);
          mochi.react("surprised", 700);
        }
      }
      ctx.clearRect(0, 0, W, H);
      // 下一場 and 目前 are drawn last so their tags stay on top of the pile.
      const nextId = live.current.meetups.find((m) => m.next)?.id;
      const curId = live.current.currentId;
      const late: Item[] = [];
      for (const it of items) {
        if (it.spec.id === live.current.hiddenId) continue;
        if (it.spec.id === nextId || it.spec.id === curId) late.push(it);
        else drawSticker(it);
      }
      late.sort((a) => (a.spec.id === curId ? 1 : -1)).forEach(drawSticker);
      drawFlying(ms);
      drawMeetupHint(ms);
      if (ms > nextWiggle) wiggle(ms);
      mochi.frame(ms / 1000, dt / 1000, live.current.still);
      raf = requestAnimationFrame(loop);
    };

    build();
    raf = requestAnimationFrame(loop);

    // Matter.js after the first paint; a failure falls back to the list.
    const startId = window.setTimeout(() => {
      loadMatter()
        .then((mod) => {
          if (disposed) return;
          M = mod;
          build();
        })
        .catch(() => {
          if (!disposed) live.current.onPhysicsFail();
        });
    }, 80);

    let lastW = stage.getBoundingClientRect().width;
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const w = stage.getBoundingClientRect().width;
        if (w && Math.abs(w - lastW) > 2 && !live.current.hiddenId) {
          lastW = w;
          build();
        }
      }, 150);
    });
    ro.observe(stage);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(startId);
      window.clearTimeout(resizeTimer);
      timers.forEach((id) => window.clearTimeout(id));
      ro.disconnect();
      cv.removeEventListener("mousedown", down);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      cv.removeEventListener("touchstart", down);
      cv.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      window.removeEventListener("touchcancel", up);
      window.removeEventListener("pointermove", onPointerMove);
      if (engine && M) M.Engine.clear(engine);
      apiRef.current = null;
    };
  }, [apiRef]);

  useEffect(() => {
    syncRef.current();
  }, [extrasKey]);

  // A new set of meetups drops in again (data refreshes keep the pile).
  const firstKey = useRef(specKey);
  useEffect(() => {
    if (firstKey.current === specKey) return;
    firstKey.current = specKey;
    rebuildRef.current();
  }, [specKey]);

  return (
    <div className="v11-stage" ref={stageRef}>
      <canvas ref={courtRef} className="v11-stage-court" aria-hidden="true" />
      <h1 className="v11-stage-title">
        PICK
        <br />A GAME
        <small>
          點一張貼紙看這場
          <br />
          可以拖、可以甩
        </small>
      </h1>
      <canvas
        ref={canvasRef}
        className="v11-stage-canvas"
        aria-label="聚會貼紙舞台：每張貼紙是一場聚會，點一下看這場；也可以切到列表"
      />
      <canvas
        ref={mochiRef}
        className={`v11-stage-mochi${intro ? " is-away" : ""}`}
        aria-hidden="true"
      />
      {bubble && !intro ? (
        <p key={bubble} className="v11-stage-bubble" role="status">
          {bubble}
        </p>
      ) : null}
    </div>
  );
}
