import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";

const rod = document.getElementById("root");
if (!rod) throw new Error("Fandt ikke #root i index.html");

createRoot(rod).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
