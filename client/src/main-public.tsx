import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import PublicApp from "./PublicApp";
import "./index.css";
import { sessionInit } from "./lib/api";

createRoot(document.getElementById("root")!).render(<PublicApp />);
setTimeout(() => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, integrations: [new BrowserTracing()], tracesSampleRate: 1.0, environment: import.meta.env.MODE });
  }
  void sessionInit();
}, 0);
