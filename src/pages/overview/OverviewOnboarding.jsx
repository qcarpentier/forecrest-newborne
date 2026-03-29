import { useState } from "react";
import {
  Check, ArrowRight,
  CurrencyCircleDollar, Receipt, UserPlus, Wallet, Scales,
  UsersThree, Calculator, Handshake,
} from "@phosphor-icons/react";
import { Card, Button, Badge, PageLayout } from "../../components";
import { useT, useLang, useAuth } from "../../context";

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function getGreeting(lang, firstName) {
  var h = new Date().getHours();
  var name = capitalize(firstName);
  var greetings = {
    fr: h < 12 ? "Bonjour" : h < 18 ? "Bon apr\u00e8s-midi" : "Bonsoir",
    en: h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening",
  };
  var g = greetings[lang] || greetings.fr;
  return name ? g + " " + name + " !" : g + " !";
}

/* ── Task row ── */
function TaskRow({ done, skipped, icon, title, desc, cta, onAction, onSkip, skippable, optional, ot }) {
  var Icon = icon;
  var resolved = done || skipped;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--sp-4)",
      padding: "var(--sp-4) var(--sp-5)",
      borderBottom: "1px solid var(--border-light)",
      opacity: skipped ? 0.5 : 1,
      transition: "opacity 0.3s",
    }}>
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: "var(--r-md)", flexShrink: 0,
        background: done ? "var(--color-success-bg)" : skipped ? "var(--bg-accordion)" : "var(--bg-accordion)",
        border: done ? "1px solid var(--color-success-border)" : "1px solid var(--border-light)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.3s",
      }}>
        {done
          ? <Check size={18} weight="bold" color="var(--color-success)" />
          : <Icon size={18} weight="duotone" color={skipped ? "var(--text-ghost)" : "var(--text-muted)"} />}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: resolved ? "var(--text-faint)" : "var(--text-primary)",
          textDecoration: done ? "line-through" : "none",
          display: "flex", alignItems: "center", gap: "var(--sp-2)",
        }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2, lineHeight: 1.4 }}>
          {desc}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "var(--sp-2)", flexShrink: 0 }}>
        {done ? (
          <Badge color="success" size="sm">{ot.cta_done || "Fait"}</Badge>
        ) : skipped ? (
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{ot.skipped_label || "Pass\u00e9"}</span>
        ) : (
          <>
            {skippable && onSkip ? (
              <Button color="tertiary" size="sm" onClick={onSkip}>
                {ot.skip_later || "Plus tard"}
              </Button>
            ) : null}
            <Button color="secondary" size="sm" onClick={onAction} iconTrailing={<ArrowRight size={14} />}>
              {cta}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function OverviewOnboarding({ cfg, streams, costs, sals, setTab, onQuickAdd, onSkip }) {
  var tAll = useT();
  var ot = tAll.onboarding_checklist || {};
  var { lang } = useLang();
  var auth = useAuth();
  var greetingName = (auth && auth.user && auth.user.displayName)
    ? auth.user.displayName.split(" ")[0]
    : (cfg ? cfg.firstName : "");

  /* ── Skipped state (per task) ── */
  var [skippedTasks, setSkippedTasks] = useState(function () {
    try {
      var raw = localStorage.getItem("forecrest_skipped_tasks");
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  });

  function skipTask(id) {
    setSkippedTasks(function (prev) {
      var next = Object.assign({}, prev);
      next[id] = true;
      try { localStorage.setItem("forecrest_skipped_tasks", JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }

  /* ── Task completion detection ── */
  var hasRevenue = streams && streams.some(function (cat) { return cat.items && cat.items.length > 0; });
  var hasCosts = costs && costs.some(function (cat) { return cat.items && cat.items.length > 0; });
  var hasTeam = sals && sals.length > 0;
  var hasCash = cfg && cfg.initialCash > 0;
  var hasFiscal = false;
  try { hasFiscal = localStorage.getItem("forecrest_fiscal_configured") === "true"; } catch (e) {}

  var tasks = [
    { id: "revenue", done: hasRevenue, icon: CurrencyCircleDollar, title: ot.task_revenue || "Ajoutez votre premier revenu", desc: ot.task_revenue_desc || "D'o\u00f9 vient l'argent ? Abonnements, ventes, prestations...", cta: ot.cta_add || "Ajouter", action: "quickadd", target: "streams", skippable: false },
    { id: "costs", done: hasCosts, icon: Receipt, title: ot.task_costs || "Ajoutez une premi\u00e8re charge", desc: ot.task_costs_desc || "Loyer, logiciels, marketing, assurances...", cta: ot.cta_add || "Ajouter", action: "quickadd", target: "opex", skippable: false },
    { id: "cash", done: hasCash, icon: Wallet, title: ot.task_cash || "D\u00e9finissez votre tr\u00e9sorerie", desc: ot.task_cash_desc || "Combien avez-vous en banque au d\u00e9marrage ?", cta: ot.cta_configure || "Configurer", action: "nav", target: "cashflow", skippable: false },
    { id: "team", done: hasTeam, icon: UserPlus, title: ot.task_team || "Ajoutez un premier employ\u00e9", desc: ot.task_team_desc || "Votre premier salari\u00e9, un stagiaire ou vous-m\u00eame si vous \u00eates r\u00e9mun\u00e9r\u00e9.", cta: ot.cta_add || "Ajouter", action: "quickadd", target: "salaries", skippable: true },
    { id: "fiscal", done: hasFiscal, icon: Scales, title: ot.task_fiscal || "Configurez votre fiscalit\u00e9", desc: ot.task_fiscal_desc || "Taux de TVA, r\u00e9gime fiscal et cotisations sociales.", cta: ot.cta_configure || "Configurer", action: "settings", target: "fiscal", skippable: true },
  ];

  /* ── Progress (done + skipped = resolved) ── */
  var resolvedCount = tasks.filter(function (t) { return t.done || skippedTasks[t.id]; }).length;
  var totalTasks = tasks.length;
  var pct = Math.round((resolvedCount / totalTasks) * 100);
  var allResolved = resolvedCount >= totalTasks;

  var activeTasks = tasks.filter(function (t) { return !t.done && !skippedTasks[t.id]; });
  var doneTasks = tasks.filter(function (t) { return t.done; });
  var skippedList = tasks.filter(function (t) { return !t.done && skippedTasks[t.id]; });

  /* ── Optional tasks (invitations — coming soon) ── */
  var optionalTasks = [
    { id: "invite_user", icon: UsersThree, title: ot.task_invite_user || "Invitez un collaborateur", desc: ot.task_invite_user_desc || "Partagez l'acc\u00e8s \u00e0 votre plan.", cta: ot.cta_soon || "Bient\u00f4t" },
    { id: "invite_accountant", icon: Calculator, title: ot.task_invite_accountant || "Invitez votre comptable", desc: ot.task_invite_accountant_desc || "Votre comptable pourra valider votre plan.", cta: ot.cta_soon || "Bient\u00f4t" },
    { id: "invite_advisor", icon: Handshake, title: ot.task_invite_advisor || "Invitez votre accompagnateur", desc: ot.task_invite_advisor_desc || "Un coach ou incubateur pour vous guider.", cta: ot.cta_soon || "Bient\u00f4t" },
  ];

  function handleTaskClick(task) {
    if (task.action === "quickadd" && onQuickAdd) {
      onQuickAdd(task.target, "");
    } else if (task.action === "settings") {
      try { localStorage.setItem("forecrest_fiscal_configured", "true"); } catch (e) {}
      setTab("set", { section: task.target });
    } else {
      setTab(task.target);
    }
  }

  var headerActions = (
    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
      <Button color="tertiary" size="lg" onClick={onSkip} sx={{ border: "none" }}>
        {ot.skip || "Passer"}
      </Button>
      <Button color="primary" size="lg" onClick={onSkip} isDisabled={!allResolved} iconTrailing={<ArrowRight size={16} />}>
        {ot.finish_btn || "Acc\u00e9der au tableau de bord"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={getGreeting(lang, greetingName)}
      subtitle={ot.greeting_sub || "Configurez votre plan financier pas \u00e0 pas."}
      actions={headerActions}
    >
      {/* ── Progress ── */}
      <Card sx={{ padding: "var(--sp-5)", marginBottom: "var(--sp-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--sp-2)" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
            {ot.progress_label || "Progression"}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? "var(--color-success)" : "var(--brand)" }}>
            {resolvedCount}/{totalTasks}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "var(--bg-hover)", overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: pct >= 100 ? "var(--color-success)" : "var(--brand)", borderRadius: 4, transition: "width 0.4s ease" }} />
        </div>
      </Card>

      {/* ── Active tasks ── */}
      {activeTasks.length > 0 ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {ot.group_ready || "Pr\u00eat pour vous"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
              {activeTasks.length} {activeTasks.length > 1 ? (ot.tasks_plural || "t\u00e2ches") : (ot.tasks_singular || "t\u00e2che")}
            </span>
          </div>
          <Card sx={{ padding: 0, marginBottom: "var(--sp-6)", overflow: "hidden" }}>
            {activeTasks.map(function (task) {
              return <TaskRow key={task.id} done={false} icon={task.icon} title={task.title} desc={task.desc} cta={task.cta} skippable={task.skippable} onAction={function () { handleTaskClick(task); }} onSkip={function () { skipTask(task.id); }} ot={ot} />;
            })}
          </Card>
        </>
      ) : null}

      {/* ── Done tasks ── */}
      {doneTasks.length > 0 ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {ot.group_done || "Termin\u00e9"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{doneTasks.length}</span>
          </div>
          <Card sx={{ padding: 0, marginBottom: "var(--sp-6)", overflow: "hidden" }}>
            {doneTasks.map(function (task) {
              return <TaskRow key={task.id} done icon={task.icon} title={task.title} desc={task.desc} ot={ot} />;
            })}
          </Card>
        </>
      ) : null}

      {/* ── Skipped tasks ── */}
      {skippedList.length > 0 ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-faint)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
              {ot.group_skipped || "Pass\u00e9s"}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{skippedList.length}</span>
          </div>
          <Card sx={{ padding: 0, marginBottom: "var(--sp-6)", overflow: "hidden" }}>
            {skippedList.map(function (task) {
              return <TaskRow key={task.id} skipped icon={task.icon} title={task.title} desc={task.desc} ot={ot} />;
            })}
          </Card>
        </>
      ) : null}

      {/* ── Optional (invitations) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>
          {ot.group_optional || "Optionnel"}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{optionalTasks.length}</span>
      </div>
      <Card sx={{ padding: 0, marginBottom: "var(--sp-6)", overflow: "hidden" }}>
        {optionalTasks.map(function (task) {
          return <TaskRow key={task.id} icon={task.icon} title={task.title} desc={task.desc} cta={task.cta} onAction={function () {}} ot={ot} />;
        })}
      </Card>
    </PageLayout>
  );
}
