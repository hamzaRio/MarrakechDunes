import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { sessionInit } from "./lib/api";

// Initialize session on startup
sessionInit();

createRoot(document.getElementById("root")!).render(<App />);
