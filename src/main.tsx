import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { StoreProvider } from "./state/store";
import { UiProvider } from "./state/ui";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <UiProvider>
        <App />
      </UiProvider>
    </StoreProvider>
  </React.StrictMode>,
);
