import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { MEETUPS } from "@/lib/mock-meetups";

const MoleculeRacket = lazy(() => import("@/components/MoleculeRacket"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "羽球聚會報名 — 分子球拍報名台" },
      {
        name: "description",
        content:
          "線上羽球聚會報名台：查看場次日期、人數上限、費用與用球，臨打一鍵報名，季打成員可直接請假或消假。",
      },
      { property: "og:title", content: "羽球聚會報名 — 分子球拍報名台" },
      {
        property: "og:description",
        content: "選擇聚會、查看場地與費用，臨打報名與季打請假一次完成。",
      },
    ],
  }),
  component: Index,
});

type Stage = "drift" | "assembled" | "standing";

function Index() {
  const [stage, setStage] = useState<Stage>("drift");
  const [picking, setPicking] = useState(false);
  const [meetupIndex, setMeetupIndex] = useState(0);
  const [head, setHead] = useState({ x: 0, y: 0, scale: 1 });
  const [name, setName] = useState("");
  const [signState, setSignState] = useState<"idle" | "sending" | "done">("idle");
  const [roster, setRoster] = useState<string[]>(MEETUPS[0]!.roster);
  const [onLeave, setOnLeave] = useState(false);
  const [holding, setHolding] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meetup = MEETUPS[meetupIndex]!;
  const others = MEETUPS.filter((_, i) => i !== meetupIndex);

  useEffect(() => {
    const t = setTimeout(() => setStage("assembled"), 1400);
    return () => clearTimeout(t);
  }, []);

  const chooseMeetup = (i: number) => {
    setMeetupIndex(i);
    setRoster(MEETUPS[i]!.roster);
    setSignState("idle");
    setPicking(false);
    setStage("standing");
  };

  const submit = () => {
    if (!name.trim() || signState !== "idle") return;
    setSignState("sending");
    setTimeout(() => {
      setRoster((r) => [...r, name.trim()]);
      setBurstKey((k) => k + 1);
      setSignState("done");
      setName("");
      setTimeout(() => setSignState("idle"), 2200);
    }, 900);
  };

  const startHold = () => {
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setOnLeave((v) => !v);
      setHolding(false);
    }, 750);
  };
  const cancelHold = () => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  const ringRadius = Math.max(96, 150 * head.scale);
  const ringItems = [
    { label: "日期", value: `${meetup.date} ${meetup.weekday}`, angle: -128 },
    { label: "時間", value: meetup.time, angle: -52 },
    { label: "上限", value: `${roster.length} / ${meetup.capacity} 人`, angle: 52 },
    { label: "費用", value: meetup.fee, angle: 128 },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 carbon-surface opacity-70" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 30%, transparent 40%, oklch(0.08 0.01 250 / 0.85) 100%)",
        }}
      />

      <div className="absolute inset-0">
        <ClientOnly fallback={null}>
          <Suspense fallback={null}>
            <MoleculeRacket
              stage={stage}
              shadowCount={stage === "standing" ? Math.min(4, others.length + 1) : 0}
              activeShadow={-1}
              burstKey={burstKey}
              onShadowClick={(i) => {
                const target = MEETUPS[(meetupIndex + i + 1) % MEETUPS.length]!;
                chooseMeetup(MEETUPS.indexOf(target));
              }}
              onHeadPoint={(p) =>
                setHead((prev) =>
                  Math.abs(prev.x - p.x) < 0.6 && Math.abs(prev.y - p.y) < 0.6
                    ? prev
                    : { x: p.x, y: p.y, scale: p.scale },
                )
              }
            />
          </Suspense>
        </ClientOnly>
      </div>

      {/* 階段 1 標題 */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 pt-8">
        <p className="font-display text-[0.65rem] tracking-[0.55em] text-accent/70 uppercase">
          badminton assembly
        </p>
        {stage === "drift" && (
          <p className="text-xs tracking-[0.4em] text-muted-foreground">分子聚合中…</p>
        )}
      </header>

      {/* 階段 2：選擇聚會 */}
      {stage === "assembled" && (
        <div className="absolute inset-x-0 top-[58%] flex justify-center">
          <button
            onClick={() => setPicking(true)}
            className="animate-rise glow-neon rounded-full bg-primary px-12 py-4 text-base font-semibold tracking-[0.3em] text-primary-foreground transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            選擇聚會
          </button>
        </div>
      )}

      {/* 聚會清單彈窗 */}
      {picking && (
        <div className="absolute inset-0 z-30 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="關閉"
            onClick={() => setPicking(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur-xl"
          />
          <div className="animate-rise relative w-full max-w-md space-y-3 rounded-[2rem] border border-border bg-card p-5 backdrop-blur-2xl glow-gold">
            <p className="font-display text-sm tracking-[0.35em] text-accent">可報名聚會</p>
            {MEETUPS.map((m, i) => (
              <button
                key={m.id}
                onClick={() => chooseMeetup(i)}
                className="flex w-full items-center justify-between gap-4 rounded-[1.5rem] border border-border/60 bg-secondary/50 px-5 py-4 text-left transition-colors hover:border-primary/60 hover:bg-secondary"
              >
                <span>
                  <span className="block font-display text-lg text-foreground">
                    {m.date} <span className="text-muted-foreground">{m.weekday}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">{m.venue}</span>
                </span>
                <span className="text-right text-xs text-accent">
                  {m.roster.length}/{m.capacity} 人<span className="block">{m.fee}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 階段 4：拍框資訊環 */}
      {stage === "standing" && (
        <>
          <div className="pointer-events-none absolute inset-0">
            {ringItems.map((item, i) => {
              const rad = (item.angle * Math.PI) / 180;
              return (
                <div
                  key={item.label}
                  className="animate-rise absolute w-28 -translate-x-1/2 -translate-y-1/2 text-center"
                  style={{
                    left: head.x + Math.cos(rad) * ringRadius,
                    top: head.y + Math.sin(rad) * ringRadius,
                    animationDelay: `${1.7 + i * 0.15}s`,
                  }}
                >
                  <p className="text-[0.6rem] tracking-[0.3em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="font-display text-sm text-glow-gold text-accent">{item.value}</p>
                </div>
              );
            })}
            <div
              className="animate-rise absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ left: head.x, top: head.y, animationDelay: "2.1s" }}
            >
              <p className="text-[0.6rem] tracking-[0.3em] text-muted-foreground">用球</p>
              <p className="font-display text-xs text-foreground">{meetup.ball}</p>
            </div>
          </div>

          {/* 拍桿與手把流線操作區 */}
          <div
            className="animate-rise absolute inset-x-0 bottom-0 z-20 px-4 pb-6"
            style={{ animationDelay: "2.3s" }}
          >
            <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
              {/* 左：季打請假／消假 */}
              <div className="flex-1 rounded-l-[2.5rem] rounded-r-[1rem] border border-accent/40 carbon-surface p-4 glow-gold">
                <p className="text-[0.6rem] tracking-[0.35em] text-accent/80">季打成員</p>
                <button
                  onPointerDown={startHold}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  className="relative mt-2 w-full overflow-hidden rounded-full border-2 border-accent/70 px-4 py-4 text-center select-none"
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-accent/25 transition-[width] ease-linear"
                    style={{ width: holding ? "100%" : "0%", transitionDuration: "750ms" }}
                  />
                  <span className="relative font-display text-2xl font-bold tracking-widest text-accent">
                    {onLeave ? "消假" : "季打請假"}
                  </span>
                </button>
                <p className="mt-2 text-center text-[0.65rem] text-muted-foreground">
                  {onLeave ? "目前狀態：已請假 · 長按解鎖消假" : "長按金屬環鎖 0.75 秒確認"}
                </p>
              </div>

              {/* 右：臨打報名 */}
              <div className="flex-1 rounded-r-[2.5rem] rounded-l-[1rem] border border-primary/40 carbon-surface p-4">
                <p className="text-[0.6rem] tracking-[0.35em] text-primary/80">臨打報名</p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="輸入你的名字"
                  className="mt-2 w-full rounded-full border border-input bg-background/60 px-5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <button
                  onClick={submit}
                  disabled={!name.trim() || signState !== "idle"}
                  className="mt-2 w-full rounded-full bg-primary py-4 font-display text-xl font-bold tracking-widest text-primary-foreground transition-all duration-300 hover:scale-[1.02] disabled:opacity-45 glow-neon"
                >
                  {signState === "sending" ? "送出中…" : signState === "done" ? "✓ 已報名" : "我要報名"}
                </button>
              </div>
            </div>

            {/* 名單 */}
            <div className="mx-auto mt-4 max-w-2xl">
              <p className="mb-2 text-[0.6rem] tracking-[0.35em] text-muted-foreground">
                {meetup.venue} · 目前名單
              </p>
              <div className="flex flex-wrap gap-2">
                {roster.map((p, i) => (
                  <span
                    key={`${p}-${i}`}
                    className="animate-rise rounded-full border border-border/70 bg-secondary/60 px-4 py-1.5 text-xs text-foreground"
                    style={{ animationDelay: `${2.4 + i * 0.06}s` }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setPicking(true)}
              className="mx-auto mt-4 block text-[0.65rem] tracking-[0.3em] text-muted-foreground underline-offset-4 hover:text-accent hover:underline"
            >
              切換其他聚會
            </button>
          </div>
        </>
      )}
    </main>
  );
}
