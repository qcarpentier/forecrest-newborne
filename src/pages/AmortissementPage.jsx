import { useT } from "../context";
import { PageLayout, Card } from "../components";
import { HourglassSimple } from "@phosphor-icons/react";

export default function AmortissementPage() {
  var tAll = useT();
  var t = tAll.amortissement;
  if (!t) return null;

  return (
    <PageLayout title={t.page_title} subtitle={t.page_sub}>
      <Card>
        <div style={{ textAlign: "center", padding: "var(--sp-6) var(--sp-4)" }}>
          <HourglassSimple size={48} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-3)" }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>{t.page_title}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 480, margin: "0 auto" }}>{t.coming_soon}</div>
        </div>
      </Card>
    </PageLayout>
  );
}
