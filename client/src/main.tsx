import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register the service worker in production builds and when explicitly enabled.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const enableSw =
      import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === "true";
    if (!enableSw) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service worker registered:", reg.scope);
      })
      .catch((err) => {
        console.error("Service worker registration failed:", err);
      });
  });
}
