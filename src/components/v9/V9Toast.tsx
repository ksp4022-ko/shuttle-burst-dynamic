import { useEffect } from "react";

const TOAST_MS = 2800;

// Shows the shared flow's notice (API results / errors) and clears it.
// atTop: a sheet is open, so the toast sits at the top instead of over the
// sheet's content.
export function V9Toast({
  message,
  onDone,
  atTop = false,
}: {
  message: string;
  onDone: () => void;
  atTop?: boolean;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div className={`v9-toast-region${atTop ? " is-top" : ""}`} role="status" aria-live="polite">
      {message ? (
        <div key={message} className="v9-toast">
          {message}
        </div>
      ) : null}
    </div>
  );
}
