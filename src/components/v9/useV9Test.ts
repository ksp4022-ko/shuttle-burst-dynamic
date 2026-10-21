import { useEffect, useState } from "react";
import { isV9TestRoute } from "@/lib/v9-route";

// True on /v9test once mounted (false on the server and the first client
// render, so the HTML matches). New V9 features switch on with this until
// the user accepts them for /v9 (CLAUDE.md: /v9test first).
export function useV9Test() {
  const [test, setTest] = useState(false);
  useEffect(() => setTest(isV9TestRoute()), []);
  return test;
}

// Changes waiting for /v9 acceptance that V11 (which reuses the V9 panels)
// shows already: on /v9test, /v11test and /v11 once mounted, never on /v9.
export function useV9Staged() {
  const [staged, setStaged] = useState(false);
  useEffect(() => {
    const parts = window.location.pathname.split("/");
    setStaged(isV9TestRoute() || parts.includes("v11test") || parts.includes("v11"));
  }, []);
  return staged;
}
