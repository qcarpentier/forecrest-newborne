import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { ThemeProvider, DevModeProvider, GlossaryProvider, NotificationProvider, AuthProvider } from "./context";
import { LangProvider } from "./context";
import { ErrorBoundary } from "./components";
import App from "./App";
import { fetchPayloadFromPastebin } from "./utils/pastebinUpload";

function showPasteLoader() {
  var el = document.getElementById("root");
  if (!el) return;
  el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;color:#555;font-size:14px;">Chargement du business plan partagé…</div>';
}

function showPasteError(msg) {
  var el = document.getElementById("root");
  if (!el) return;
  el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;color:#333;text-align:center;padding:24px;"><div style="font-size:18px;font-weight:700;margin-bottom:8px;">Lien invalide ou expiré</div><div style="font-size:13px;color:#666;max-width:420px;">' + msg + '</div><a href="/" style="margin-top:16px;color:#E8431A;font-weight:600;text-decoration:none;">Retour</a></div>';
}

function mount() {
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
}

// If the URL carries `?viewPaste=<id>`, fetch the payload from pastebin, rewrite the URL
// to the classic `?view=<payload>` form, then let the rest of the app boot normally.
var urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
var pasteId = urlParams ? urlParams.get("viewPaste") : null;

if (pasteId) {
  showPasteLoader();
  fetchPayloadFromPastebin(pasteId).then(function (res) {
    if (res.ok && res.payload) {
      var origin = window.location.origin;
      window.location.replace(origin + "/?view=" + encodeURIComponent(res.payload));
    } else {
      showPasteError("Impossible de récupérer le business plan partagé (" + (res.error || "erreur inconnue") + ").");
    }
  }).catch(function (err) {
    showPasteError("Erreur réseau lors du chargement du business plan (" + (err && err.message) + ").");
  });
} else {
  mount();
}
