import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Capture the install prompt as early as possible — it fires once during
// page load, before React even mounts. We stash it on window so any
// component can consume it later regardless of when it mounts.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as unknown as Record<string, unknown>).__pwaInstallPrompt = e;
});

createRoot(document.getElementById("root")!).render(<App />);
