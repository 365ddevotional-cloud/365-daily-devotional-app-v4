import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const isVercelHosted = /(?:^|\.)vercel\.app$/i.test(window.location.hostname);
const apiBaseUrl = isVercelHosted ? "" : rawApiBaseUrl;

if (apiBaseUrl) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/api")) {
      return originalFetch(`${apiBaseUrl}${input}`, init);
    }

    if (input instanceof Request) {
      const requestUrl = new URL(input.url, window.location.origin);
      if (requestUrl.origin === window.location.origin && requestUrl.pathname.startsWith("/api")) {
        return originalFetch(new Request(`${apiBaseUrl}${requestUrl.pathname}${requestUrl.search}`, input), init);
      }
    }

    return originalFetch(input, init);
  };
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js?v=7")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                console.log("New service worker activated");
              }
            });
          }
        });
        console.log("SW registered:", registration.scope);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
