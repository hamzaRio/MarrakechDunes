import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n";
import "./index.css";
// Deployment trigger: Final production deployment with API fixes
import { sessionInit } from "./lib/api";

// Initialize session on startup
sessionInit();

createRoot(document.getElementById("root")!).render(<App />);
