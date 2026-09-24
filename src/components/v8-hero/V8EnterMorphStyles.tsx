// ENTER-MORPH (進入戰局轉場): Opening -> Active is one route and one state
// switch (v8MeetupConfirmed); routes/index.tsx wraps that switch in
// document.startViewTransition when available. These rules only apply while
// <html> carries the morph classes, so view-transition-names never collide
// outside a transition.
//   v8-morph-launch -- step 1, the 進入戰局 plaque brightens and grows
//   v8-morphing     -- the view transition itself: sun moves (v8-sun), the
//                      plaque blows out (v8-enter-cta), the new page is
//                      revealed by an ink circle from the button centre
// Rendered by V8HeroComposition, so it exists on both OPEN and ACTIVE.
export function V8EnterMorphStyles() {
  return (
    <style>{`
      html.v8-morph-launch [data-v8-enter-cta] {
        scale: 1.08;
        filter: brightness(1.2) drop-shadow(0 0 14px rgba(255, 207, 107, 0.9));
        transition: scale 120ms ease-out, filter 120ms ease-out;
      }

      html.v8-morphing [data-v8-sun] {
        view-transition-name: v8-sun;
      }

      html.v8-morphing [data-v8-enter-cta] {
        view-transition-name: v8-enter-cta;
      }

      html.v8-morphing .v8-ink-ring {
        view-transition-name: v8-ink-ring;
      }

      ::view-transition-group(v8-sun) {
        animation-duration: 820ms;
        animation-timing-function: cubic-bezier(.6, 0, .2, 1);
      }

      ::view-transition-old(root) {
        animation: none;
      }

      ::view-transition-new(root) {
        animation: v8-ink-reveal 850ms cubic-bezier(.5, 0, .3, 1) 30ms both;
      }

      ::view-transition-old(v8-enter-cta) {
        animation: v8-enter-cta-out 300ms ease-out both;
      }

      @keyframes v8-ink-reveal {
        from { clip-path: circle(0% at var(--v8-morph-x, 50%) var(--v8-morph-y, 60%)); }
        to { clip-path: circle(130% at var(--v8-morph-x, 50%) var(--v8-morph-y, 60%)); }
      }

      @keyframes v8-enter-cta-out {
        from { transform: scale(1); opacity: 1; }
        to { transform: scale(1.09); opacity: 0; }
      }
    `}</style>
  );
}
