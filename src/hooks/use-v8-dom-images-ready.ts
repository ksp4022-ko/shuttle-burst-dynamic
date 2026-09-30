import { useEffect, useState } from "react";

// P-021 v2: true once every URL in `urls` is on screen as a loaded <img>
// (complete with real pixels) -- the same elements the user sees, so the
// page's own 3x ?v8r= retry is honoured. There is deliberately no timeout
// and an error never counts: until the art has actually loaded this stays
// false. Latches per URL set. `null` = not gated (always true).
const stripRetry = (src: string) => src.replace(/[?&]v8r=\d+$/, "");

export function useV8DomImagesReady(urls: string[] | null) {
  const key = urls ? urls.join("|") : "";
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useEffect(() => {
    if (!urls || readyKey === key) return;
    const wanted = urls.map((url) => new URL(url, window.location.href).href);
    const isReady = () =>
      wanted.every((url) =>
        Array.from(document.images).some(
          (image) => stripRetry(image.currentSrc || image.src) === url && image.complete && image.naturalWidth > 0,
        ),
      );
    if (isReady()) {
      setReadyKey(key);
      return;
    }
    const check = () => {
      if (isReady()) setReadyKey(key);
    };
    // load doesn't bubble; capture sees every <img>. The slow poll covers
    // an element swapped in already-complete (no fresh load event).
    document.addEventListener("load", check, true);
    const poll = window.setInterval(check, 1000);
    return () => {
      document.removeEventListener("load", check, true);
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, readyKey]);

  return urls ? readyKey === key : true;
}
