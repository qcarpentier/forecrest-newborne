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
        boxShadow: "var(--shadow-card)",
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
        backdropFilter: "blur(10px)",
        cursor: onClick ? "pointer" : undefined,
        ...(sx || {}),
      }}
    >
      {children}
    </div>
  );
}
