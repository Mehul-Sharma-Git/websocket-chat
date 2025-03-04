import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ChatProvider } from "./context/ChatContext.tsx";
import { AppProvider } from "./context/AppContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </AppProvider>
  </StrictMode>
);
