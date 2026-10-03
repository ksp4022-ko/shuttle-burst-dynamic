import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// MOTION-TRIAL lab (/v8test/motion-lab only). The same ACTIVE art -- the
// 告假 plaque, the 代報 plaque and a 代報-style dialog -- under three
// effect sets the user switches between on a real iPhone:
//   A  current production behaviour (keyframe press after release, dialog
//      pops in/out instantly over a blur, blue page wash while sending)
//   B  CSS only (press on touch-down + overshoot release, dialog slides
//      in/out, light backdrop, seal on the button while sending)
//   C  Motion (spring press, dialog grows out of / back into the 代報
//      plaque and can be reversed mid-way, spring seal stamp)
// Nothing here talks to the backend; sending is simulated.

type Variant = "A" | "B" | "C";
type Phase = "idle" | "sending" | "done" | "fail";

const SEND_MS = 1200;
const RESULT_MS = 900;

const VARIANTS: { id: Variant; label: string; note: string }[] = [
  { id: "A", label: "A 現在", note: "放開才回彈；彈窗直接出現/消失（模糊背景）；送出時整頁藍色遮罩" },
  { id: "B", label: "B CSS", note: "按住就壓下、放開回彈；彈窗滑入/滑出（輕遮罩）；按鈕上蓋印" },
  { id: "C", label: "C Motion", note: "彈簧手感；彈窗從代報牌長出、收回，可中途反轉；彈簧蓋印" },
];

// Same files as v8OptimizedAssetFiles (v8ActiveConfig.ts), named here
// instead of imported: importing that module from this route reshuffled the
// production chunks (dragonPreviewConfig moved into the main bundle).
const LAB_ART = {
  ctaMainBlank: "cta-plaque-blank-v2-300.webp",
  ctaTextSeasonLeave: "cta-text-leave-v2-300.webp",
  ctaHelperSignup: "cta-plaque-helper-signup-v3-190.webp",
} as const;

function assetUrl(file: string) {
  return `${import.meta.env.BASE_URL}v8-preview/active/${file}`;
}

export function V8MotionLab() {
  const [variant, setVariant] = useState<Variant>("C");
  const [failMode, setFailMode] = useState(false);
  const [ctaPhase, setCtaPhase] = useState<Phase>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPhase, setDialogPhase] = useState<Phase>("idle");
  const [name, setName] = useState("");
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => clearTimers, []);

  const reset = () => {
    clearTimers();
    setCtaPhase("idle");
    setDialogOpen(false);
    setDialogPhase("idle");
  };

  const pickVariant = (next: Variant) => {
    reset();
    setVariant(next);
  };

  // Simulated round-trip: sending -> done/fail -> idle.
  const runSend = (setPhase: (phase: Phase) => void, onDone?: () => void) => {
    setPhase("sending");
    later(() => {
      setPhase(failMode ? "fail" : "done");
      later(() => {
        setPhase("idle");
        if (!failMode) onDone?.();
      }, RESULT_MS);
    }, SEND_MS);
  };

  const onCta = () => {
    if (ctaPhase !== "idle") return;
    runSend(setCtaPhase);
  };

  const onSubmitDialog = () => {
    if (dialogPhase !== "idle") return;
    runSend(setDialogPhase, () => setDialogOpen(false));
  };

  const pageWash = variant === "A" && (ctaPhase === "sending" || dialogPhase === "sending");

  return (
    <main className="mlab">
      <MotionLabStyles />
      <header className="mlab-head">
        {/* data-v8-test-badge: the /v8test blank-screen check in __root.tsx
            treats this page as started once a V8 TEST label is on screen. */}
        <p className="mlab-kicker" data-v8-test-badge="">
          V8 TEST · MOTION LAB
        </p>
        <div className="mlab-tabs" role="tablist">
          {VARIANTS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={variant === item.id}
              className={variant === item.id ? "is-on" : ""}
              onClick={() => pickVariant(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mlab-note">{VARIANTS.find((item) => item.id === variant)?.note}</p>
        <label className="mlab-toggle">
          <input type="checkbox" checked={failMode} onChange={(event) => setFailMode(event.target.checked)} />
          模擬送出失敗
        </label>
      </header>

      <section className="mlab-stage" key={variant}>
        <p className="mlab-hint">點「告假」看按壓＋送出；點「代報」看彈窗</p>
        <MainCta variant={variant} phase={ctaPhase} onClick={onCta} />
        <HelperDialogDemo
          variant={variant}
          open={dialogOpen}
          phase={dialogPhase}
          name={name}
          onName={setName}
          onOpen={() => {
            setDialogPhase("idle");
            setDialogOpen(true);
          }}
          onClose={() => {
            if (dialogPhase === "sending") return;
            setDialogOpen(false);
          }}
          onSubmit={onSubmitDialog}
        />
        <button type="button" className="mlab-reset" onClick={reset}>
          重置
        </button>
      </section>

      {pageWash ? <div className="mlab-wash" aria-hidden="true" /> : null}
    </main>
  );
}

// ---- 告假 plaque -------------------------------------------------------

function CtaArt() {
  return (
    <span className="mlab-cta-art">
      <img src={assetUrl(LAB_ART.ctaMainBlank)} alt="" draggable={false} />
      <img src={assetUrl(LAB_ART.ctaTextSeasonLeave)} alt="" draggable={false} />
    </span>
  );
}

function MainCta({ variant, phase, onClick }: { variant: Variant; phase: Phase; onClick: () => void }) {
  const reduce = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [kick, setKick] = useState(0);

  if (variant === "C") {
    return (
      <motion.button
        type="button"
        className="mlab-cta"
        aria-label="告假"
        {...(reduce ? {} : { whileTap: { scale: 0.92, y: 2 } })}
        transition={{ type: "spring", stiffness: 520, damping: 17 }}
        animate={phase === "fail" && !reduce ? { x: [0, -9, 8, -5, 3, 0] } : { x: 0 }}
        onClick={onClick}
      >
        <CtaArt />
        <MotionSeal phase={phase} />
      </motion.button>
    );
  }

  if (variant === "B") {
    return (
      <button
        type="button"
        className={`mlab-cta mlab-cta-b${pressed ? " is-down" : ""}${phase === "fail" ? " is-fail" : ""}`}
        aria-label="告假"
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        onClick={onClick}
      >
        <CtaArt />
        <CssSeal phase={phase} />
      </button>
    );
  }

  // A: the current keyframe press, which only starts once the tap lands.
  return (
    <button
      type="button"
      key={kick}
      className={`mlab-cta mlab-cta-a${kick ? " is-pressed" : ""}`}
      aria-label="告假"
      onClick={() => {
        setKick((n) => n + 1);
        onClick();
      }}
    >
      <CtaArt />
    </button>
  );
}

// ---- Seals (sending -> done / fail) ------------------------------------

function CssSeal({ phase }: { phase: Phase }) {
  if (phase === "idle") return null;
  return (
    <span className={`mlab-seal is-${phase}`} aria-live="polite">
      {phase === "sending" ? "送" : phase === "done" ? "完成" : "未成"}
    </span>
  );
}

function MotionSeal({ phase }: { phase: Phase }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      {phase === "sending" ? (
        <motion.span
          key="sending"
          className="mlab-seal is-sending is-motion"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, rotate: 360 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ rotate: { duration: 1.1, ease: "linear", repeat: Infinity }, default: { duration: 0.18 } }}
        >
          送
        </motion.span>
      ) : phase === "done" || phase === "fail" ? (
        <motion.span
          key={phase}
          className={`mlab-seal is-${phase} is-motion`}
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 2.4, rotate: -14 }}
          animate={{ opacity: 1, scale: 1, rotate: -8 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ type: "spring", stiffness: 640, damping: 22 }}
        >
          {phase === "done" ? "完成" : "未成"}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

// ---- 代報 dialog -------------------------------------------------------

type DialogProps = {
  variant: Variant;
  open: boolean;
  phase: Phase;
  name: string;
  onName: (value: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

function DialogCard({ phase, name, onName, onClose, onSubmit, seal }: Omit<DialogProps, "variant" | "open" | "onOpen"> & { seal: ReactNode }) {
  return (
    <div className="mlab-dlg-body">
      <p className="mlab-dlg-title">幫誰報名？</p>
      <p className="mlab-dlg-copy">輸入要代報的臨打名稱（試驗頁，不會真的送出）。</p>
      <input className="mlab-dlg-input" value={name} onChange={(event) => onName(event.target.value)} placeholder="輸入姓名" />
      <span className="mlab-dlg-actions">
        <button type="button" className="mlab-dlg-cta" onClick={onSubmit} disabled={phase !== "idle"}>
          {phase === "sending" ? "送出中…" : "代報"}
        </button>
        {seal}
      </span>
      <button type="button" className="mlab-dlg-cancel" onClick={onClose}>
        取消
      </button>
    </div>
  );
}

function HelperDialogDemo(props: DialogProps) {
  const { variant, open, phase, onOpen, onClose } = props;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  const trigger = (
    <button ref={triggerRef} type="button" className="mlab-helper" aria-label="代報" onClick={onOpen}>
      <img src={assetUrl(LAB_ART.ctaHelperSignup)} alt="" draggable={false} />
    </button>
  );

  if (variant === "C") {
    // Grow out of / shrink back into the 代報 plaque: start offset = plaque
    // centre minus the card's resting centre (viewport centre-ish).
    const rect = triggerRef.current?.getBoundingClientRect();
    const from = rect
      ? { x: rect.left + rect.width / 2 - window.innerWidth / 2, y: rect.top + rect.height / 2 - window.innerHeight * 0.36 }
      : { x: 0, y: 120 };
    const hidden = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3, x: from.x, y: from.y };
    return (
      <>
        {trigger}
        <AnimatePresence>
          {open ? (
            <motion.div
              key="backdrop"
              className="mlab-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            >
              <motion.div
                className="mlab-dlg"
                initial={hidden}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={hidden}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                onClick={(event) => event.stopPropagation()}
              >
                <motion.div animate={phase === "fail" && !reduce ? { x: [0, -8, 7, -4, 2, 0] } : { x: 0 }}>
                  <DialogCard {...props} seal={<MotionSeal phase={phase} />} />
                </motion.div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </>
    );
  }

  if (variant === "B") return <CssDialog {...props} trigger={trigger} />;

  // A: mounts/unmounts instantly over the current blurred backdrop.
  return (
    <>
      {trigger}
      {open ? (
        <div className="mlab-backdrop mlab-backdrop-a" onClick={onClose}>
          <div className="mlab-dlg" onClick={(event) => event.stopPropagation()}>
            <DialogCard {...props} seal={null} />
          </div>
        </div>
      ) : null}
    </>
  );
}

// B: keeps the dialog mounted through a short closing state so it can
// play its exit before unmounting.
function CssDialog(props: DialogProps & { trigger: ReactNode }) {
  const { open, phase, onClose, trigger } = props;
  const [shown, setShown] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setShown(true);
      setClosing(false);
      return;
    }
    if (!shown) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setShown(false);
      setClosing(false);
    }, 190);
    return () => window.clearTimeout(timer);
  }, [open, shown]);

  return (
    <>
      {trigger}
      {shown ? (
        <div className={`mlab-backdrop mlab-backdrop-b${closing ? " is-closing" : ""}`} onClick={onClose}>
          <div className={`mlab-dlg mlab-dlg-b${phase === "fail" ? " is-fail" : ""}`} onClick={(event) => event.stopPropagation()}>
            <DialogCard {...props} seal={<CssSeal phase={phase} />} />
          </div>
        </div>
      ) : null}
    </>
  );
}

// ---- Styles ------------------------------------------------------------

function MotionLabStyles() {
  return (
    <style>{`
      .mlab {
        min-height: 100svh;
        padding: max(16px, env(safe-area-inset-top)) 16px 32px;
        background: linear-gradient(160deg, #f4e8cf 0%, #e2c795 60%, #f2dfb8 100%);
        color: #20150d;
        font-family: "Noto Sans TC", system-ui, sans-serif;
        -webkit-tap-highlight-color: transparent;
      }
      .mlab-head { max-width: 420px; margin: 0 auto; }
      .mlab-kicker { margin: 0 0 10px; font-size: 12px; font-weight: 900; letter-spacing: .12em; color: #1f6b43; }
      .mlab-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
      .mlab-tabs button {
        height: 42px; border-radius: 999px; border: 2px solid #20150d; background: #fff7e6;
        font-size: 15px; font-weight: 900; color: #20150d;
      }
      .mlab-tabs button.is-on { background: #20150d; color: #fff7e8; }
      .mlab-note { min-height: 40px; margin: 10px 2px 6px; font-size: 13px; font-weight: 700; line-height: 1.5; color: rgba(32,21,13,.78); }
      .mlab-toggle { display: inline-flex; gap: 6px; align-items: center; font-size: 13px; font-weight: 800; }
      .mlab-stage {
        position: relative; max-width: 420px; margin: 18px auto 0; padding: 22px 16px 26px;
        display: flex; flex-direction: column; align-items: center; gap: 22px;
        border-radius: 24px; background: rgba(255, 249, 234, .55); border: 1px solid rgba(68,43,18,.18);
      }
      .mlab-hint { margin: 0; font-size: 13px; font-weight: 800; color: rgba(32,21,13,.7); }
      .mlab-reset { height: 36px; padding: 0 18px; border-radius: 999px; border: 1px solid rgba(32,21,13,.4); background: transparent; font-weight: 800; color: #20150d; }

      .mlab-cta { position: relative; width: 230px; aspect-ratio: 300 / 132; padding: 0; border: 0; background: none; cursor: pointer; touch-action: manipulation; }
      .mlab-cta-art, .mlab-cta-art img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
      .mlab-cta-art { filter: drop-shadow(0 6px 8px rgba(40, 20, 5, .28)); }
      .mlab-helper { width: 150px; aspect-ratio: 190 / 82; padding: 0; border: 0; background: none; touch-action: manipulation; }
      .mlab-helper img { width: 100%; height: 100%; display: block; }

      /* A: current press keyframe (after the tap). */
      .mlab-cta-a.is-pressed { animation: mlab-press-a 280ms ease-out both; }
      @keyframes mlab-press-a { 0% { transform: scale(1); } 35% { transform: scale(.94); } 100% { transform: scale(1); } }
      .mlab-wash { position: fixed; inset: 0; z-index: 60; background: rgba(21, 89, 168, .28); pointer-events: auto; }

      /* B: press on touch-down, overshoot on release. */
      .mlab-cta-b { transition: transform 320ms cubic-bezier(.34, 1.56, .64, 1); }
      .mlab-cta-b.is-down { transform: scale(.92) translateY(2px); transition-duration: 80ms; transition-timing-function: ease-out; }
      .mlab-cta-b.is-down .mlab-cta-art { filter: drop-shadow(0 2px 3px rgba(40, 20, 5, .34)); }
      .mlab-cta-b.is-fail, .mlab-dlg-b.is-fail { animation: mlab-shake 420ms ease-out; }
      @keyframes mlab-shake { 0%,100% { translate: 0; } 20% { translate: -9px; } 45% { translate: 8px; } 70% { translate: -4px; } 85% { translate: 2px; } }

      /* Seal stamped on the button (B and C). */
      .mlab-seal {
        position: absolute; right: -6px; top: -10px; z-index: 3;
        width: 54px; height: 54px; display: grid; place-items: center;
        border-radius: 50%; border: 3px solid #b3261e; color: #b3261e; background: rgba(255, 246, 228, .92);
        font-size: 15px; font-weight: 900; letter-spacing: -.02em; pointer-events: none;
        box-shadow: 0 0 0 2px rgba(179, 38, 30, .18);
      }
      .mlab-seal.is-sending { border-style: dashed; }
      .mlab-seal.is-fail { color: #5a4636; border-color: #5a4636; }
      .mlab-seal:not(.is-motion).is-sending { animation: mlab-spin 1.1s linear infinite; }
      .mlab-seal:not(.is-motion).is-done,
      .mlab-seal:not(.is-motion).is-fail { animation: mlab-stamp 300ms cubic-bezier(.2, .9, .3, 1.3) both; }
      @keyframes mlab-spin { to { rotate: 360deg; } }
      @keyframes mlab-stamp { 0% { opacity: 0; scale: 2.3; rotate: -14deg; } 100% { opacity: 1; scale: 1; rotate: -8deg; } }

      /* Dialog */
      .mlab-backdrop {
        position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-start; justify-content: center;
        padding: max(64px, calc(env(safe-area-inset-top) + 48px)) 16px 16px;
        background: rgba(20, 15, 10, .48);
      }
      .mlab-backdrop-a { -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); }
      .mlab-backdrop-b { animation: mlab-fade-in 200ms ease-out both; }
      .mlab-backdrop-b.is-closing { animation: mlab-fade-out 190ms ease-in both; }
      .mlab-backdrop-b .mlab-dlg { animation: mlab-dlg-in 280ms cubic-bezier(.2, .9, .3, 1.15) both; }
      .mlab-backdrop-b.is-closing .mlab-dlg { animation: mlab-dlg-out 190ms ease-in both; }
      @keyframes mlab-fade-in { from { opacity: 0; } }
      @keyframes mlab-fade-out { to { opacity: 0; } }
      @keyframes mlab-dlg-in { from { opacity: 0; transform: translateY(28px) scale(.96); } }
      @keyframes mlab-dlg-out { to { opacity: 0; transform: translateY(20px) scale(.97); } }
      .mlab-dlg {
        position: relative; width: min(326px, calc(100vw - 34px)); padding: 20px 18px 18px;
        border-radius: 20px; border: 2px solid rgba(68, 43, 18, .38);
        background: linear-gradient(180deg, #fff9ea 0%, #f8edcf 100%);
        box-shadow: 0 20px 42px rgba(20, 13, 7, .34), inset 0 0 0 1px rgba(255, 255, 255, .62);
      }
      .mlab-dlg-body { display: flex; flex-direction: column; gap: 9px; }
      .mlab-dlg-title { margin: 0; text-align: center; font-size: 18px; font-weight: 900; }
      .mlab-dlg-copy { margin: 0; text-align: center; font-size: 13px; font-weight: 750; line-height: 1.45; color: rgba(47, 31, 17, .78); }
      .mlab-dlg-input {
        width: 100%; box-sizing: border-box; height: 44px; padding: 0 12px; border: 2px solid rgba(58, 35, 16, .52); border-radius: 12px;
        background: #fffdf6; color: #20150d; font-size: 16px; font-weight: 750;
      }
      .mlab-dlg-actions { position: relative; display: block; }
      .mlab-dlg-actions .mlab-seal { right: -4px; top: -14px; }
      .mlab-dlg-cta {
        width: 100%; height: 44px; border-radius: 999px; border: 2px solid #20150d; background: #20150d;
        color: #fff7e8; font-size: 14px; font-weight: 900; box-shadow: 0 5px 0 rgba(0, 0, 0, .16);
      }
      .mlab-dlg-cta:disabled { opacity: .72; }
      .mlab-dlg-cancel { height: 38px; border: 0; background: none; font-size: 14px; font-weight: 800; color: rgba(32, 21, 13, .7); }

      @media (prefers-reduced-motion: reduce) {
        .mlab *, .mlab *::before, .mlab *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
      }
    `}</style>
  );
}
