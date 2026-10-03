import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shuttle Dynamics｜羽球報名系統" },
      { name: "description", content: "康軒與日安羽球聚會報名、候補、請假與名單查詢。" },
      { name: "author", content: "Shuttle Dynamics" },
      { property: "og:title", content: "Shuttle Dynamics｜羽球報名系統" },
      { property: "og:description", content: "羽球聚會報名、候補與正取名單查詢。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Shuttle Dynamics｜羽球報名系統" },
    ],
    // Real V8 routes: paint the V8 paper colour before React mounts so the
    // dark body never flashes. The class is removed again by V8LoadingCover.
    styles: [
      {
        children:
          "html.v8-boot,html.v8-boot body{background:linear-gradient(135deg,#f4e8cf 0%,#e2c795 54%,#f2dfb8 100%) fixed !important}",
      },
    ],
    scripts: [
      {
        children:
          'try{if(location.pathname.indexOf("/v8")>-1)document.documentElement.classList.add("v8-boot")}catch(e){}',
      },
      // V8 home-screen app setup (/v8test first; /v8 since Cfm 2026-10-03).
      // Links the route's manifest (/v8test keeps its own) and
      // the iOS app title; when launched from the home screen, marks
      // html.v8-standalone and lets the page reach the screen edges
      // (viewport-fit=cover) so env(safe-area-inset-*) report the home
      // indicator. Safari tabs are untouched.
      {
        children:
          'try{var P=location.pathname,M=/\\/v8(test)?\\//.exec(P);if(M){var I=M.index,F=M[1]?"manifest-v8test":"manifest-v8";var H=document.head,A=function(t,o){var e=document.createElement(t);for(var k in o)e.setAttribute(k,o[k]);H.appendChild(e)};A("link",{rel:"manifest",href:P.slice(0,I)+"/"+F+".webmanifest"});A("link",{rel:"apple-touch-icon",href:P.slice(0,I)+"/v8-pwa/icon-180.png"});A("meta",{name:"apple-mobile-web-app-capable",content:"yes"});A("meta",{name:"mobile-web-app-capable",content:"yes"});A("meta",{name:"apple-mobile-web-app-title",content:"V8 康軒報名"});if(navigator.standalone===true||matchMedia("(display-mode: standalone)").matches){document.documentElement.classList.add("v8-standalone");var V=document.querySelector("meta[name=viewport]");if(V&&V.content.indexOf("viewport-fit")<0)V.content+=", viewport-fit=cover"}}}catch(e){}',
      },
      // V8TEST only: show script errors and failed script/style loads on the
      // page itself, so a blank screen on a real iPhone names its cause.
      {
        children:
          'try{if(location.pathname.indexOf("/v8test")>-1){var L=[],B=null,S=function(m){try{L.push(new Date().toISOString().slice(11,19)+" "+String(m).slice(0,300));if(L.length>6)L.shift();if(!document.body)return;if(!B){B=document.createElement("div");B.setAttribute("style","position:fixed;left:8px;right:8px;bottom:8px;z-index:2147483647;max-height:45vh;overflow:auto;background:rgba(120,20,10,.92);color:#fff;font:12px/1.4 monospace;padding:8px;border-radius:8px;white-space:pre-wrap;word-break:break-all");document.body.appendChild(B)}B.textContent="V8TEST ERROR (截圖給 Claude)\\n"+L.join("\\n")}catch(e){}};window.addEventListener("error",function(e){var t=e.target;if(t&&t!==window&&(t.src||t.href)){if(t.tagName==="SCRIPT"||t.tagName==="LINK")S("load failed: "+(t.src||t.href));return}S((e.message||"error")+" @"+(e.filename||"").split("/").pop()+":"+(e.lineno||0)+":"+(e.colno||0)+(e.error&&e.error.stack?"\\n"+String(e.error.stack).slice(0,400):""))},true);window.addEventListener("unhandledrejection",function(e){var r=e.reason;S("rejection: "+(r&&r.message?r.message:r)+(r&&r.stack?"\\n"+String(r.stack).slice(0,400):""))});document.addEventListener("DOMContentLoaded",function(){if(L.length)S("(page)")});setTimeout(function(){try{if(document.querySelector("[data-v8-test-badge]"))return;var js=performance.getEntriesByType("resource").filter(function(r){return /\\.js(\\?|$)/.test(r.name)}).map(function(r){return r.name.split("/").pop()+" "+Math.round(r.duration)+"ms "+Math.round((r.transferSize||0)/1024)+"KB"});S("app not started after 10s; js loaded: "+(js.join(", ")||"none")+"; online="+navigator.onLine)}catch(e){}},10000)}}catch(e){}',
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=Noto+Sans+TC:wght@400;500;700&family=Ma+Shan+Zheng&family=Zhi+Mang+Xing&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
