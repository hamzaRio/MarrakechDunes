import React from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import App from "./App";
import "./index.css";
import { sessionInit } from "./lib/api";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Defer side-effects until after React mounts
setTimeout(() => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event) {
        if (import.meta.env.DEV) {
          return null;
        }
        return event;
      },
    });
    console.log('Sentry error tracking initialized');
  }
  void sessionInit();
}, 0);
