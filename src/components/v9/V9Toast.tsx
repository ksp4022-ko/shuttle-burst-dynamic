import { useEffect } from "react";

const TOAST_MS = 2800;

// Shows the shared flow's notice (API results / errors) and clears it.
export function V9Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div className="v9-toast-region" role="status" aria-live="polite">
      {message ? (
        <div key={message} className="v9-toast">
          {message}
        </div>
      ) : null}
    </div>
  );
}
