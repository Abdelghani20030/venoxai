import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
// Keep AFTER index.css: restores the standard (unprefixed) `backdrop-filter`
// that the Tailwind/Lightning pass in index.css folds away — see glass-std.css.
import "./glass-std.css";
// Approved redesign tokens + primitives. Loaded last so redesigned screens
// supersede the old app look without touching legacy screens.
import "./reference.css";

const root = createRoot(document.getElementById("root")!);

function render(node: React.ReactNode) {
  root.render(node);
}

// Developer-only visual QA route. Vite replaces import.meta.env.DEV with
// `false` in production, so the dynamic import (and DevPreview chunk) is
// removed from the production build entirely.
if (import.meta.env.DEV && window.location.hash === "#/dev/preview") {
  import("./DevPreview.jsx").then(({ default: DevPreview }) => {
    render(<DevPreview />);
  });
} else {
  render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
