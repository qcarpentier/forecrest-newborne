import { useState, useEffect } from "react";
import { Card, Row, Accordion } from "../../components";
import { DevVal } from "../../components";
import { eur, pct } from "../../utils";
import { ok, err } from "../../constants/colors";
import { Warning, Receipt, Bank } from "@phosphor-icons/react";
import { SectionHeader, DelayPills, CashCycleViz } from "./helpers";

export default function OverviewAdvanced({
  t, lang,
  totalRevenue, monthlyCosts, monthlyRevenue,
  ebitda, annualInterest, netP,
  cfg,
  isocR, isocS, isoc, isocEff,
  annVatC, annVatD, vatBalance,
  resLeg, resTarget,
  divGross,
  fr,
}) {
  var [clientDelay, setClientDelay] = useState(30);
  var [supplierDelay, setSupplierDelay] = useState(30);

  var clientReceivable = monthlyRevenue * (clientDelay / 30);
  var supplierPayable = monthlyCosts * (supplierDelay / 30);
  var bfrSim = clientReceivable - supplierPayable;
  var cashCycleDays = clientDelay - supplierDelay;
  var tresoSim = fr - bfrSim;

  return (
    <>
      {/* ── BFR & FONDS DE ROULEMENT ── */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader icon={<Bank size={18} weight="bold" />} title={t.bfr_sim_title || "Fonds de roulement & BFR"} sub={t.bfr_sim_sub || "Comprenez l'équilibre entre vos ressources permanentes et vos besoins de trésorerie."} />
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          {/* Fonds de Roulement */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.fr_title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.bfr_sim_fr_desc || "Ressources stables disponibles pour financer votre activité courante."}</p>
            <Row label={t.fr_capital} value={<DevVal v={eur(cfg.capitalSocial)} f={"Capital social = " + eur(cfg.capitalSocial)} />} />
            <Row label={t.fr_reserve} value={eur(resLeg)} />
            <Row label={t.fr_result} value={<DevVal v={eur(netP)} f={"EBITDA - ISoc = " + eur(netP)} />} color={netP >= 0 ? ok : err} />
            <Row label={t.fr_label} value={<DevVal v={eur(fr)} f={eur(cfg.capitalSocial) + " + " + eur(resLeg) + " + " + eur(netP) + " = " + eur(fr)} />} bold color={fr >= 0 ? ok : err} last tip={t.tip_fr} />
            <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: fr >= 0 ? "var(--color-success-bg)" : "var(--color-error-bg)", borderRadius: "var(--r-md)", border: "1px solid " + (fr >= 0 ? "var(--color-success-border)" : "var(--color-error-border)"), fontSize: 12, color: fr >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
              {fr >= 0 ? t.fr_positive : t.fr_negative}
            </div>

            <div style={{ marginTop: "var(--sp-4)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--sp-2)" }}>{t.bfr_sim_fr_explain_title || "Qu'est-ce que le FR ?"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{t.bfr_sim_fr_explain || "Le fonds de roulement représente l'excédent de ressources durables (capital, réserves, bénéfices) après financement des immobilisations. Un FR positif signifie que vous avez un coussin de sécurité pour couvrir vos besoins à court terme."}</div>
            </div>
          </Card>

          {/* BFR & Micro Simulation */}
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.bfr_sim_bfr_title || "Simulation du BFR"}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.bfr_sim_bfr_desc || "Ajustez les délais de paiement pour voir l'impact sur votre trésorerie."}</p>

            <DelayPills
              label={t.bfr_sim_client_delay || "Délai encaissement clients"}
              value={clientDelay}
              onChange={setClientDelay}
              options={[0, 15, 30, 45, 60, 90]}
              unit={t.bfr_day_unit || "j"}
            />
            <DelayPills
              label={t.bfr_sim_supplier_delay || "Délai paiement fournisseurs"}
              value={supplierDelay}
              onChange={setSupplierDelay}
              options={[0, 15, 30, 45, 60]}
              unit={t.bfr_day_unit || "j"}
            />

            <CashCycleViz
              clientDelay={clientDelay}
              supplierDelay={supplierDelay}
              clientLabel={t.bfr_sim_client_bar || "Clients"}
              supplierLabel={t.bfr_sim_supplier_bar || "Fournisseurs"}
              t={t}
            />

            <Row label={t.bfr_clients} value={<DevVal v={eur(clientReceivable)} f={eur(monthlyRevenue) + " × (" + clientDelay + "/30) = " + eur(clientReceivable)} />} />
            <Row label={"− " + t.bfr_suppliers} value={<DevVal v={eur(supplierPayable)} f={eur(monthlyCosts) + " × (" + supplierDelay + "/30) = " + eur(supplierPayable)} />} />
            <Row label={t.bfr_label} value={<DevVal v={eur(bfrSim)} f={eur(clientReceivable) + " - " + eur(supplierPayable) + " = " + eur(bfrSim)} />} bold color={bfrSim <= 0 ? ok : err} tip={t.tip_bfr} />

            <div style={{ marginTop: "var(--sp-3)", borderTop: "2px solid var(--border)", paddingTop: "var(--sp-3)" }}>
              <Row label={t.tn_label} value={<DevVal v={eur(tresoSim)} f={eur(fr) + " - " + eur(bfrSim) + " = " + eur(tresoSim)} />} bold color={tresoSim >= 0 ? ok : err} last tip={t.tip_tn} />
            </div>

            {cashCycleDays > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-warning-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-warning-border)", fontSize: 12, color: "var(--color-warning)", display: "flex", gap: "var(--sp-2)", alignItems: "flex-start" }}>
                <Warning size={14} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{typeof t.bfr_sim_gap_warning === "function" ? t.bfr_sim_gap_warning(cashCycleDays) : "Vos clients vous paient " + cashCycleDays + "j après que vous ayez payé vos fournisseurs."}</span>
              </div>
            ) : (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-success-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-success-border)", fontSize: 12, color: "var(--color-success)" }}>
                {t.bfr_sim_gap_ok || "Vos fournisseurs vous financent — vous encaissez avant ou en même temps que vous payez."}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ── TVA & FISCALITÉ ── */}
      <section style={{ marginBottom: "var(--sp-8)" }}>
        <SectionHeader icon={<Receipt size={18} weight="bold" />} title={t.section_tax} sub={t.section_tax_sub} />
        <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-4)" }}>{t.vat_title}</h3>
            <Row label={t.vat_collected} value={<DevVal v={eur(annVatC)} f={"Σ (revenu × taux TVA) = " + eur(annVatC)} />} tip={t.tip_vat_c} />
            <Row label={t.vat_deductible} value={<DevVal v={"- " + eur(annVatD)} f={"Σ (charge × taux TVA) = " + eur(annVatD)} />} tip={t.tip_vat_d} />
            <Row label={vatBalance >= 0 ? t.vat_balance_due : t.vat_balance_credit} value={<DevVal v={eur(Math.abs(vatBalance))} f={eur(annVatC) + " - " + eur(annVatD) + " = " + eur(vatBalance)} />} bold color={vatBalance >= 0 ? err : ok} last />
            <div style={{ fontSize: 11, color: "var(--text-faint)", paddingTop: "var(--sp-2)" }}>{typeof t.vat_note === "function" ? t.vat_note(pct(cfg.vat)) : ""}</div>
          </Card>

          <Card>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 var(--sp-2)" }}>{t.fiscal_title}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-4)", lineHeight: 1.4 }}>{t.fiscal_sub}</p>
            <Row label={t.fiscal_capacity} value={<DevVal v={eur(divGross)} f={"netP - réserve légale = " + eur(divGross)} />} tip={t.tip_div_capacity} />
            <Row label={t.fiscal_div_classic} value={<DevVal v={eur(divGross * 0.70)} f={eur(divGross) + " × (1 - 30%) = " + eur(divGross * 0.70)} />} />
            <Row label={t.fiscal_div_vvpr} value={<DevVal v={eur(divGross * 0.85)} f={eur(divGross) + " × (1 - 15%) = " + eur(divGross * 0.85)} />} bold color={ok} last tip={t.tip_vvpr} />
            {divGross > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-3)", background: "var(--color-success-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--color-success-border)" }}>
                <div style={{ fontSize: 12, color: "var(--color-success)", lineHeight: 1.5 }}>{t.fiscal_vvpr_saving(eur(divGross * 0.85 - divGross * 0.70))}</div>
              </div>
            ) : null}
          </Card>
        </div>

        {/* DRI */}
        {cfg.driEnabled ? <div style={{ marginTop: "var(--gap-lg)" }}>
          <Card>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-3)" }}>
              <div style={{ width: 4, minHeight: 60, background: "var(--brand)", borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 var(--sp-2)", color: "var(--text-primary)" }}>{t.fiscal_dri_title}</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 var(--sp-3)", lineHeight: 1.5 }}>{t.fiscal_dri_desc}</p>
                <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap", marginBottom: "var(--sp-3)" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 2 }}>{t.fiscal_dri_rate}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--brand)" }}>85%</div>
                  </div>
                  {isoc > 0 ? (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 2 }}>{t.fiscal_dri_impact}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: ok }}><DevVal v={eur(isoc * 0.85 * 0.80)} f={eur(isoc) + " × 85% × 80% = " + eur(isoc * 0.85 * 0.80)} /></div>
                    </div>
                  ) : null}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: ok }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: ok }}>{t.fiscal_dri_eligible}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.5 }}>{t.fiscal_dri_not_modeled}. {t.fiscal_dri_note}</div>
              </div>
            </div>
          </Card>
        </div> : null}

        {/* Fiscal calendar */}
        <div style={{ marginTop: "var(--gap-lg)" }}>
          <Accordion title={t.fiscal_cal_title} sub={t.fiscal_cal_sub}>
            <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-lg)" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_tva}</div>
                {[["T1", t.vat_q1, vatBalance / 4], ["T2", t.vat_q2, vatBalance / 4], ["T3", t.vat_q3, vatBalance / 4], ["T4", t.vat_q4, vatBalance / 4]].map(function (row) {
                  return (
                    <div key={row[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", minWidth: 24 }}>{row[0]}</span>
                      <span style={{ flex: 1, fontSize: 12, color: "var(--text-tertiary)", paddingLeft: "var(--sp-2)" }}>{row[1]}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: row[2] >= 0 ? "var(--color-error)" : "var(--color-success)" }}>{eur(Math.abs(row[2]))}</span>
                    </div>
                  );
                })}
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "var(--sp-4)", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_pp}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" }}>{t.fiscal_cal_pp_monthly}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4 }}>{t.fiscal_cal_pp_quarterly}</div>
                <div style={{ fontSize: 11, color: "var(--color-warning)", lineHeight: 1.4, marginTop: "var(--sp-1)", fontStyle: "italic" }}>{t.fiscal_cal_pp_note}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_isoc_adv}</div>
                {[t.fiscal_cal_isoc_adv1, t.fiscal_cal_isoc_adv2, t.fiscal_cal_isoc_adv3, t.fiscal_cal_isoc_adv4].map(function (label) {
                  return (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isoc > 0 ? "var(--color-error)" : "var(--text-faint)" }}>{isoc > 0 ? eur(isoc / 4) : "–"}</span>
                    </div>
                  );
                })}
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4, marginTop: "var(--sp-1)", marginBottom: "var(--sp-3)" }}>{t.fiscal_cal_isoc_adv_note}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_soc}</div>
                {[t.fiscal_cal_soc1, t.fiscal_cal_soc2, t.fiscal_cal_soc3, t.fiscal_cal_soc4].map(function (label) {
                  return <div key={label} style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "3px 0", borderBottom: "1px solid var(--border-light)" }}>{label}</div>;
                })}
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4, marginTop: "var(--sp-1)", marginBottom: "var(--sp-3)" }}>{t.fiscal_cal_soc_note}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{t.fiscal_cal_annual}</div>
                {[t.fiscal_cal_annual_ag, t.fiscal_cal_annual_bnb, t.fiscal_cal_annual_isoc].map(function (label) {
                  return <div key={label} style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "3px 0", borderBottom: "1px solid var(--border-light)" }}>{label}</div>;
                })}
                <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.4, marginTop: "var(--sp-1)" }}>{t.fiscal_cal_annual_note}</div>
              </div>
            </div>
          </Accordion>
        </div>
      </section>
    </>
  );
}
