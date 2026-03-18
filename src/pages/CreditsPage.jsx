import { useMemo } from "react";
import { PageLayout, Card } from "../components";
import { useT, useLang } from "../context";
import { VERSION, RELEASE_DATE, APP_NAME } from "../constants/config";
import {
  Scales, ArrowSquareOut, Package, TestTube, GlobeHemisphereWest,
  BookOpen, ClockCounterClockwise, LinkedinLogo, Robot, User,
} from "@phosphor-icons/react";

var LIBS = [
  { name: "React", version: "18.3", license: "MIT", author: "Meta (Facebook)", url: "https://reactjs.org", usage: "ui" },
  { name: "React DOM", version: "18.3", license: "MIT", author: "Meta (Facebook)", url: "https://reactjs.org", usage: "dom" },
  { name: "Phosphor Icons", version: "2.x", license: "MIT", author: "Tobias Fried", url: "https://phosphoricons.com", usage: "icons" },
  { name: "GSAP", version: "3.x", license: "GreenSock Standard", author: "GreenSock", url: "https://gsap.com", usage: "anim" },
  { name: "react-hotkeys-hook", version: "5.x", license: "MIT", author: "Johannes Klauss", url: "https://react-hotkeys-hook.vercel.app", usage: "keys" },
  { name: "TanStack Table", version: "8.x", license: "MIT", author: "Tanner Linsley", url: "https://tanstack.com/table", usage: "tables" },
  { name: "react-number-format", version: "5.x", license: "MIT", author: "Sudhanshu Yadav", url: "https://s-yadav.github.io/react-number-format", usage: "inputs" },
  { name: "@dnd-kit", version: "6.x", license: "MIT", author: "Claudéric Demers", url: "https://dndkit.com", usage: "dnd" },
  { name: "@uiw/react-md-editor", version: "4.x", license: "MIT", author: "uiwjs", url: "https://uiwjs.github.io/react-md-editor", usage: "markdown" },
];

var DEV_LIBS = [
  { name: "Vite", version: "6.x", license: "MIT", author: "Evan You", url: "https://vite.dev", usage: "bundler" },
  { name: "Vitest", version: "4.x", license: "MIT", author: "Anthony Fu", url: "https://vitest.dev", usage: "tests" },
  { name: "@vitejs/plugin-react", version: "4.x", license: "MIT", author: "Evan You", url: "https://github.com/vitejs/vite-plugin-react", usage: "react_plugin" },
];

var DOC_LIBS = [];

var LICENSE_COLORS = {
  MIT: "var(--color-success)",
  "GreenSock Standard": "var(--color-warning)",
};

function LicenseBadge({ license }) {
  var color = LICENSE_COLORS[license] || "var(--text-muted)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: "var(--r-xl)",
      fontSize: 10, fontWeight: 600, lineHeight: 1,
      background: color + "18", color: color,
      border: "1px solid " + color + "40",
      whiteSpace: "nowrap",
    }}>
      <Scales size={10} weight="bold" />
      {license}
    </span>
  );
}

function LibRow({ lib, t }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 130px 160px 28px",
      gap: "var(--sp-3)", alignItems: "center",
      padding: "var(--sp-2) var(--sp-3)",
      borderBottom: "1px solid var(--border-light)",
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{lib.name} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-faint)" }}>{lib.version}</span></div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
          {lib.author} · {t["usage_" + lib.usage] || lib.usage}
        </div>
      </div>
      <LicenseBadge license={lib.license} />
      <span style={{ fontSize: 11, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {lib.url.replace("https://", "")}
      </span>
      <a
        href={lib.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "var(--r-sm)", color: "var(--text-faint)" }}
        title={lib.name}
      >
        <ArrowSquareOut size={14} />
      </a>
    </div>
  );
}

function SectionHeader({ title, count }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: "var(--sp-2)",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</h3>
      <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500 }}>{count}</span>
    </div>
  );
}

/* ── Sidebar stat card ────────────────────────────────────────── */

function StatRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "var(--sp-1) 0" }}>
      {icon}
      <span style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function SidebarLink({ icon, label, onClick, href }) {
  var style = {
    display: "flex", alignItems: "center", gap: "var(--sp-2)",
    padding: "var(--sp-2) var(--sp-3)", borderRadius: "var(--r-md)",
    border: "none", background: "transparent", cursor: "pointer",
    color: "var(--text-secondary)", fontSize: 12, fontWeight: 500,
    textDecoration: "none", width: "100%", textAlign: "left",
  };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {icon} {label} <ArrowSquareOut size={11} color="var(--text-faint)" style={{ marginLeft: "auto" }} />
      </a>
    );
  }
  return (
    <button onClick={onClick} style={style}>
      {icon} {label}
    </button>
  );
}

/* ── Main component ───────────────────────────────────────────── */

export default function CreditsPage() {
  var tAll = useT();
  var t = tAll.credits || {};
  var { lang } = useLang();

  var licenseStats = useMemo(function () {
    var all = LIBS.concat(DEV_LIBS).concat(DOC_LIBS);
    var counts = {};
    all.forEach(function (lib) {
      counts[lib.license] = (counts[lib.license] || 0) + 1;
    });
    return { total: all.length, prod: LIBS.length, dev: DEV_LIBS.length, docs: DOC_LIBS.length, counts: counts };
  }, []);

  return (
    <PageLayout
      title={t.title || "Cr\u00e9dits & licences"}
      subtitle={t.subtitle || "Biblioth\u00e8ques open-source et outils utilis\u00e9s par Forecrest."}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "var(--gap-lg)", alignItems: "start" }}>

        {/* ═══ LEFT: Library tables ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)", minWidth: 0 }}>

          <Card sx={{ padding: "var(--card-py) var(--card-px)" }}>
            <SectionHeader title={t.section_prod || "D\u00e9pendances de production"} count={LIBS.length + " libs"} />
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 130px 160px 28px",
              gap: "var(--sp-3)", padding: "0 var(--sp-3) var(--sp-2)",
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "var(--text-faint)",
              borderBottom: "1px solid var(--border)",
            }}>
              <span>{t.col_lib || "Biblioth\u00e8que"}</span>
              <span>{t.col_license || "Licence"}</span>
              <span>{t.col_url || "Lien"}</span>
              <span />
            </div>
            {LIBS.map(function (lib) {
              return <LibRow key={lib.name} lib={lib} t={t} />;
            })}
          </Card>

          <Card sx={{ padding: "var(--card-py) var(--card-px)" }}>
            <SectionHeader title={t.section_dev || "Outils de d\u00e9veloppement"} count={DEV_LIBS.length + " libs"} />
            {DEV_LIBS.map(function (lib) {
              return <LibRow key={lib.name} lib={lib} t={t} />;
            })}
          </Card>

          {DOC_LIBS.length > 0 ? (
            <Card sx={{ padding: "var(--card-py) var(--card-px)" }}>
              <SectionHeader title={t.section_docs || "Documentation"} count={DOC_LIBS.length + " libs"} />
              {DOC_LIBS.map(function (lib) {
                return <LibRow key={lib.name} lib={lib} t={t} />;
              })}
            </Card>
          ) : null}

          <div style={{
            padding: "var(--sp-4)", background: "var(--bg-accordion)",
            borderRadius: "var(--r-md)", border: "1px solid var(--border)",
            fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7,
          }}>
            <strong>{t.legal_title || "Mentions l\u00e9gales"}</strong>
            <ul style={{ margin: "var(--sp-2) 0 0", paddingLeft: "var(--sp-4)" }}>
              <li>{t.legal_mit || "Les biblioth\u00e8ques sous licence MIT autorisent l'utilisation, la modification et la redistribution sans restriction, sous r\u00e9serve d'inclure la notice de copyright."}</li>
              <li>{t.legal_gsap || "GSAP est utilis\u00e9 sous la licence standard gratuite de GreenSock, autorisant l'usage dans les produits SaaS."}</li>
              <li>{t.legal_trademarks || "Les marques et logos des biblioth\u00e8ques tierces appartiennent \u00e0 leurs propri\u00e9taires respectifs."}</li>
            </ul>
          </div>

        </div>

        {/* ═══ RIGHT: Sidebar ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)", position: "sticky", top: 80 }}>

          {/* 1. Stack summary */}
          <Card sx={{ padding: "var(--sp-4)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-3)" }}>
              {t.sidebar_stack || "R\u00e9sum\u00e9 du stack"}
            </div>
            <StatRow icon={<Package size={13} color="var(--brand)" />} label={t.sidebar_prod || "Production"} value={licenseStats.prod} />
            <StatRow icon={<TestTube size={13} color="var(--color-info)" />} label={t.sidebar_dev || "Dev / Test"} value={licenseStats.dev} />
            <StatRow icon={<BookOpen size={13} color="var(--color-warning)" />} label={t.sidebar_docs || "Documentation"} value={licenseStats.docs} />
            <div style={{ borderTop: "1px solid var(--border-light)", margin: "var(--sp-2) 0", paddingTop: "var(--sp-2)" }}>
              <StatRow icon={<Scales size={13} color="var(--text-muted)" />} label={t.sidebar_total || "Total"} value={licenseStats.total} />
            </div>
            <div style={{ marginTop: "var(--sp-3)", display: "flex", flexWrap: "wrap", gap: 4 }}>
              {Object.keys(licenseStats.counts).map(function (lic) {
                return (
                  <span key={lic} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: "var(--r-xl)", background: "var(--bg-accordion)", color: "var(--text-muted)", border: "1px solid var(--border-light)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: LICENSE_COLORS[lic] || "var(--text-faint)" }} />
                    {lic} <span style={{ color: "var(--text-faint)" }}>{"\u00d7" + licenseStats.counts[lic]}</span>
                  </span>
                );
              })}
            </div>
          </Card>

          {/* 2. Project info */}
          <Card sx={{ padding: "var(--sp-4)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-3)" }}>
              {t.sidebar_project || "Projet"}
            </div>
            <StatRow icon={<Package size={13} color="var(--text-muted)" />} label={t.sidebar_version || "Version"} value={"v" + VERSION} />
            <StatRow icon={<ClockCounterClockwise size={13} color="var(--text-muted)" />} label={t.sidebar_release || "Release"} value={RELEASE_DATE} />
            <StatRow icon={<TestTube size={13} color="var(--text-muted)" />} label={t.sidebar_tests || "Tests"} value="240" />
            <StatRow icon={<GlobeHemisphereWest size={13} color="var(--text-muted)" />} label={t.sidebar_target || "Cible"} value={t.sidebar_target_val || "Belgique"} />
            <div style={{ marginTop: "var(--sp-2)", display: "flex", flexWrap: "wrap", gap: 4 }}>
              {["React 18", "Vite 6", "Vitest 4", "GSAP 3"].map(function (tag) {
                return (
                  <span key={tag} style={{ fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: "var(--r-xl)", background: "var(--brand-bg)", color: "var(--brand)", border: "1px solid var(--brand)" }}>
                    {tag}
                  </span>
                );
              })}
            </div>
            <div style={{ marginTop: "var(--sp-2)", fontSize: 11, color: "var(--text-faint)" }}>
              ~550 kB gzip
            </div>
          </Card>

          {/* 3. Credits / Contributors */}
          <Card sx={{ padding: "var(--sp-4)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-3)" }}>
              {t.sidebar_credits || "Remerciements"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              <a
                href="https://www.linkedin.com/in/thomasvtrn/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: "var(--sp-3)",
                  textDecoration: "none", color: "var(--text-primary)",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--brand-bg)", border: "1px solid var(--brand)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <User size={18} weight="fill" color="var(--brand)" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Thomas Voituron</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <LinkedinLogo size={11} weight="fill" color="#0a66c2" />
                    {t.sidebar_role_creator || "Cr\u00e9ateur & d\u00e9veloppeur"}
                  </div>
                </div>
              </a>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--bg-accordion)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Robot size={18} weight="fill" color="var(--text-muted)" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Claude Code</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.sidebar_role_ai || "Co-auteur IA (Anthropic)"}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* 4. Copyright */}
          <div style={{
            padding: "var(--sp-4)", background: "var(--bg-accordion)",
            borderRadius: "var(--r-lg)", border: "1px solid var(--border-light)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {lang === "fr" ? "Fait avec" : "Made with"}{" "}
              <span style={{ color: "var(--brand)" }}>{"\u2764"}</span>{" "}
              {lang === "fr" ? "par" : "by"}{" "}
              <a
                href="https://glow-up.app"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}
              >
                Glow Up
              </a>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-ghost)", marginTop: "var(--sp-1)" }}>
              &copy; {new Date().getFullYear()} Glow Up &middot; glow-up.app
            </div>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
