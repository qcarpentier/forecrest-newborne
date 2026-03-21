import { createRoot } from "react-dom/client";
import { ThemeProvider, DevModeProvider, GlossaryProvider } from "./context";
import { LangProvider } from "./context";
import { ErrorBoundary } from "./components";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <ThemeProvider>
      <LangProvider>
        <DevModeProvider>
          <GlossaryProvider>
            <App />
          </GlossaryProvider>
        </DevModeProvider>
      </LangProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
