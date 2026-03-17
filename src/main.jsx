import { createRoot } from "react-dom/client";
import { ThemeProvider, DevModeProvider } from "./context";
import { LangProvider } from "./context";
import { ErrorBoundary } from "./components";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <ThemeProvider>
      <LangProvider>
        <DevModeProvider>
          <App />
        </DevModeProvider>
      </LangProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
