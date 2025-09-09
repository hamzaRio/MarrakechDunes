import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize session on startup
fetch("/api/session/init", { method: "POST", credentials: "include" }).catch(() => {});

createRoot(document.getElementById("root")!).render(<App />);
