import AdminBar from "./AdminBar";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children, section, setSection, setTab }) {
  function handleBack() {
    setTab("overview");
  }

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column",
      background: "var(--bg-page)", height: "100vh",
      color: "var(--text-primary)", overflow: "hidden",
    }}>
      <AdminBar />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <AdminSidebar section={section} setSection={setSection} onBack={handleBack} />

        {/* Exact same structure as App.jsx main */}
        <main style={{
          flex: 1,
          padding: "var(--page-py) var(--page-px)",
          maxWidth: "var(--page-max)",
          margin: "0 auto",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
