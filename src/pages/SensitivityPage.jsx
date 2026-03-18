import { PageLayout, ExplainerBox } from "../components";
import SensitivityChart from "../components/SensitivityChart";
import { eur } from "../utils";
import { useT, useLang } from "../context";

export default function SensitivityPage({ totalRevenue, monthlyCosts, salCosts, ebitda, cfg }) {
  var { lang } = useLang();
  var t = useT();

  return (
    <PageLayout
      title={lang === "fr" ? "Analyse de sensibilité" : "Sensitivity Analysis"}
      subtitle={lang === "fr" ? "Identifiez les variables qui impactent le plus votre rentabilité." : "Identify the variables that most impact your profitability."}
    >
      <ExplainerBox variant="tip" title={lang === "fr" ? "Pourquoi c'est important ?" : "Why does this matter?"}>
        {lang === "fr"
          ? "L'analyse de sensibilité vous aide à comprendre quels leviers ont le plus d'impact sur votre EBITDA. En faisant varier chaque paramètre de ±20%, vous voyez immédiatement où concentrer vos efforts. C'est un outil essentiel pour les discussions avec les investisseurs et pour la prise de décision stratégique."
          : "Sensitivity analysis helps you understand which levers most impact your EBITDA. By varying each parameter by ±20%, you immediately see where to focus efforts. It's an essential tool for investor discussions and strategic decision-making."}
      </ExplainerBox>

      <SensitivityChart
        totalRevenue={totalRevenue}
        monthlyCosts={monthlyCosts}
        salCosts={salCosts}
        ebitda={ebitda}
        cfg={cfg}
        lang={lang}
      />
    </PageLayout>
  );
}
