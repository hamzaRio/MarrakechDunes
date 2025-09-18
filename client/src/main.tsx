import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import App from "./App";
import "./index.css";
// Deployment trigger: Final production deployment with API fixes
import { sessionInit } from "./lib/api";

// Initialize session on startup
sessionInit();

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
);
