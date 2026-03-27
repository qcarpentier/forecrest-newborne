import { ChartLine } from "@phosphor-icons/react";
import { PageLayout, ExplainerBox } from "../../components";
import SensitivityChart from "../../components/SensitivityChart";
import { eur } from "../../utils";
import { useT, useLang } from "../../context";

export default function SensitivityPage({ totalRevenue, monthlyCosts, salCosts, ebit, cfg }) {
  var tAll = useT();
  var t = tAll.sensitivity;
  var { lang } = useLang();

  return (
    <PageLayout
      title={t.title}
      subtitle={t.subtitle}
      icon={ChartLine} iconColor="#06B6D4"
    >
      <ExplainerBox variant="tip" title={t.explainer_title}>
        {t.explainer_body}
      </ExplainerBox>

      <SensitivityChart
        totalRevenue={totalRevenue}
        monthlyCosts={monthlyCosts}
        salCosts={salCosts}
        ebit={ebit}
        cfg={cfg}
        t={t}
      />
    </PageLayout>
  );
}
