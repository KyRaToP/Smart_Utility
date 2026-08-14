import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppProvider } from "./state/AppProvider";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/components.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);
