export default function Card({ sx, children, onClick }) {
  return (
    <div
      data-animate="card"
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--r-xl)",
        border: "1px solid var(--border)",
        padding: "var(--card-py) var(--card-px)",
        boxShadow: "0 1px 4px var(--shadow)",
        ...(sx || {}),
      }}
    >
      {children}
    </div>
  );
}
