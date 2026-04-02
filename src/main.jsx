import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { ThemeProvider, DevModeProvider, GlossaryProvider, NotificationProvider, AuthProvider } from "./context";
import { LangProvider } from "./context";
import { ErrorBoundary } from "./components";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <DevModeProvider>
            <GlossaryProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </GlossaryProvider>
          </DevModeProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
