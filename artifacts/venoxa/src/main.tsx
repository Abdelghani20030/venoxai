import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
// Keep AFTER index.css: restores the standard (unprefixed) `backdrop-filter`
// that the Tailwind/Lightning pass in index.css folds away — see glass-std.css.
import "./glass-std.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
