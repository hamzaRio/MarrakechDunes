import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import App from "./App";
import "./index.css";
// Deployment trigger: Final production deployment with API fixes
import { sessionInit } from "./lib/api";

// Initialize Sentry for error tracking
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0, // Adjust in production (0.1 = 10%)
    environment: import.meta.env.MODE,
    beforeSend(event) {
      // Filter out non-production errors
      if (import.meta.env.DEV) {
        return null;
      }
      return event;
    },
  });
  console.log('✅ Sentry error tracking initialized');
}

// Initialize session on startup
sessionInit();

createRoot(document.getElementById("root")!).render(
  <App />
);
