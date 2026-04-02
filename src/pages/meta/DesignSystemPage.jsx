import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Copy, DotsThree, MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { Accordion, ActionBtn, Avatar, Badge, Button, ButtonGroup, ButtonUtility, Card, CurrencyInput, DatePicker, FilterDropdown, KpiCard, Modal, ModalBody, ModalFooter, NumberField, PageLayout, SearchInput, SelectDropdown } from "../../components";
import { DESIGN_SYSTEM_SECTIONS, flattenDesignSystemItems, getDefaultDesignSystemItemId, getDesignSystemItem } from "../../constants/designSystem";
import { useLang } from "../../context";

var FOUNDATION_GROUPS = [
  { label: "Forecrest Brand", tokens: ["--brand", "--brand-hover", "--brand-bg", "--brand-border", "--brand-gradient-end", "--color-on-brand"] },
  { label: "Forecrest Surfaces", tokens: ["--bg-page", "--bg-card", "--bg-hover", "--bg-accordion", "--input-bg", "--overlay-bg"] },
  { label: "Forecrest Type", tokens: ["--text-primary", "--text-secondary", "--text-tertiary", "--text-muted", "--text-faint", "--text-ghost"] },
  { label: "Forecrest Semantic", tokens: ["--color-success", "--color-success-bg", "--color-warning", "--color-warning-bg", "--color-error", "--color-error-bg", "--color-info", "--color-info-bg"] },
];

var UNTITLED_GROUPS = [
  { label: "Untitled Brand Scale", tokens: ["--color-brand-50", "--color-brand-100", "--color-brand-200", "--color-brand-300", "--color-brand-400", "--color-brand-500", "--color-brand-600", "--color-brand-700"] },
  { label: "Untitled Neutral Scale", tokens: ["--color-neutral-50", "--color-neutral-100", "--color-neutral-200", "--color-neutral-300", "--color-neutral-400", "--color-neutral-500", "--color-neutral-600", "--color-neutral-700"] },
  { label: "Untitled Semantic Tokens", tokens: ["--color-text-primary", "--color-text-secondary", "--color-border-primary", "--color-border-brand", "--color-bg-primary", "--color-bg-secondary", "--color-bg-brand-solid", "--color-bg-overlay"] },
];

var TOKEN_MAPPINGS = [
  { forecrest: "--brand", untitled: "--color-brand-500", reason: "Primary accent and emphasis actions." },
  { forecrest: "--bg-card", untitled: "--color-bg-primary", reason: "Default elevated surface." },
  { forecrest: "--bg-page", untitled: "--color-bg-secondary", reason: "Canvas and application backdrop." },
  { forecrest: "--text-primary", untitled: "--color-text-primary", reason: "Default readable text." },
  { forecrest: "--text-muted", untitled: "--color-text-secondary", reason: "Supporting copy and descriptions." },
  { forecrest: "--border", untitled: "--color-border-primary", reason: "Standard outlines and separators." },
  { forecrest: "--color-error", untitled: "--color-text-error-primary", reason: "Destructive states and validation." },
  { forecrest: "--focus-ring", untitled: "--ring-color-brand", reason: "Accessible focus treatment." },
];

var DESIGN_SYSTEM_EVENT = "fc-design-system-select";

function resolveVar(token) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  } catch (error) {
    return "";
  }
}

function isColor(value) {
  return value && (value.indexOf("#") === 0 || value.indexOf("rgb") === 0 || value.indexOf("hsl") === 0 || value.indexOf("var(") === 0);
}

function getSelectionFromHash() {
  var raw = (window.location.hash || "").replace(/^#/, "");
  if (raw.indexOf("ds/") === 0) raw = raw.slice(3);
  return getDesignSystemItem(raw) ? raw : getDefaultDesignSystemItemId();
}

function updateSelectionHash(itemId) {
  var nextHash = "#ds/" + itemId;
  if (window.location.hash !== nextHash) window.history.replaceState(null, "", window.location.pathname + nextHash);
  window.dispatchEvent(new CustomEvent(DESIGN_SYSTEM_EVENT, { detail: itemId }));
}

function SectionHeader({ eyebrow, title, copy }) {
  return (
    <div style={{ marginBottom: "var(--sp-4)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 6 }}>{eyebrow}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", marginBottom: "var(--sp-2)" }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)", maxWidth: 760 }}>{copy}</div>
    </div>
  );
}

function DemoCard({ title, note, children }) {
  return (
    <Card sx={{ height: "100%" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--sp-2)" }}>{title}</div>
      {note ? <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: "var(--sp-4)" }}>{note}</div> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-3)", alignItems: "center" }}>{children}</div>
    </Card>
  );
}

function CategoryStrip({ lk, selectedSectionId, onSelect }) {
  return (
    <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--gap-md)", marginBottom: "var(--gap-xl)" }}>
      {DESIGN_SYSTEM_SECTIONS.map(function (section) {
        var active = section.id === selectedSectionId;
        return (
          <Card key={section.id} onClick={function () { onSelect(section.items[0].id); }} sx={{ cursor: "pointer", borderColor: active ? "var(--brand)" : "var(--border)", background: active ? "linear-gradient(135deg, var(--brand-bg) 0%, var(--bg-card) 72%)" : "var(--bg-card)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-3)", marginBottom: "var(--sp-2)" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}>{section.label[lk]}</div>
              <Badge color={active ? "brand" : "gray"} size="sm">{section.items.length}</Badge>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{section.description[lk]}</div>
          </Card>
        );
      })}
    </div>
  );
}

function ColorSwatch({ value }) {
  if (!isColor(value)) return <div style={{ width: 28, height: 28 }} />;
  return <div style={{ width: 28, height: 28, borderRadius: 8, background: value, border: "1px solid var(--border)" }} />;
}

function TokenRow({ token, value }) {
  var [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText("var(" + token + ")");
    setCopied(true);
    window.setTimeout(function () { setCopied(false); }, 1200);
  }

  return (
    <button type="button" onClick={handleCopy} style={{ width: "100%", display: "grid", gridTemplateColumns: "28px minmax(0, 1fr) auto", gap: "var(--sp-3)", alignItems: "center", padding: "var(--sp-3)", border: "none", borderBottom: "1px solid var(--border-light)", background: "transparent", cursor: "pointer", textAlign: "left" }}>
      <ColorSwatch value={value} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{token}</div>
        <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis" }}>{value || "-"}</div>
      </div>
      <div style={{ fontSize: 11, color: copied ? "var(--brand)" : "var(--text-ghost)", whiteSpace: "nowrap" }}>{copied ? "Copied" : "Copy"}</div>
    </button>
  );
}

function TokenGroup({ label, tokens, resolved }) {
  return (
    <Card sx={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "var(--sp-4) var(--sp-4) var(--sp-3)", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
      </div>
      {tokens.map(function (token) { return <TokenRow key={token} token={token} value={resolved[token]} />; })}
    </Card>
  );
}

function ComponentPreview({ itemId, resolved }) {
  var [searchValue, setSearchValue] = useState("");
  var [filledSearchValue, setFilledSearchValue] = useState("runway");
  var [segmentSize, setSegmentSize] = useState("md");
  var [radioValue, setRadioValue] = useState("monthly");
  var [checkboxValue, setCheckboxValue] = useState(["growth", "cash"]);
  var [planValue, setPlanValue] = useState("starter");
  var [numberValue, setNumberValue] = useState(12);
  var [ratioValue, setRatioValue] = useState(0.18);
  var [amountValue, setAmountValue] = useState(4500);
  var [dateValue, setDateValue] = useState("2026-04-02");
  var [filterValue, setFilterValue] = useState("all");
  var [modalOpen, setModalOpen] = useState(false);

  if (itemId === "button") return (
    <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--gap-md)" }}>
      <DemoCard title="Hierarchy" note="Primary, secondary, tertiary and destructive coverage.">
        <Button color="primary" size="lg">Primary</Button>
        <Button color="secondary" size="lg">Secondary</Button>
        <Button color="tertiary" size="lg">Tertiary</Button>
        <Button color="primary-destructive" size="lg">Destructive</Button>
        <Button color="link-color" size="lg">Link color</Button>
        <Button color="link-gray" size="lg">Link gray</Button>
      </DemoCard>
      <DemoCard title="Sizes and states" note="Different densities and async/disabled states.">
        <Button color="primary" size="sm">Small</Button>
        <Button color="primary" size="md">Medium</Button>
        <Button color="primary" size="lg">Large</Button>
        <Button color="primary" size="xl" iconTrailing={<ArrowRight size={16} weight="bold" />}>XL with icon</Button>
        <Button color="secondary" size="md" isLoading>Loading</Button>
        <Button color="tertiary" size="md" isDisabled>Disabled</Button>
      </DemoCard>
    </div>
  );

  if (itemId === "button-group") return (
    <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--gap-md)" }}>
      <DemoCard title="Sizes" note="Density should follow surrounding content.">
        <ButtonGroup size="sm" value={segmentSize} onChange={setSegmentSize} mode="radio" items={[{ id: "sm", label: "Small" }, { id: "md", label: "Medium" }, { id: "lg", label: "Large" }]} />
        <ButtonGroup size="md" value={segmentSize} onChange={setSegmentSize} mode="radio" items={[{ id: "sm", label: "Small" }, { id: "md", label: "Medium" }, { id: "lg", label: "Large" }]} />
        <ButtonGroup size="lg" value={segmentSize} onChange={setSegmentSize} mode="radio" items={[{ id: "sm", label: "Small" }, { id: "md", label: "Medium" }, { id: "lg", label: "Large" }]} />
      </DemoCard>
      <DemoCard title="Modes" note="Default commands, single-select and multi-select.">
        <ButtonGroup mode="default" items={[{ id: "add", label: "Add", icon: <Plus size={12} weight="bold" /> }, { id: "clone", label: "Duplicate" }, { id: "archive", label: "Archive" }]} />
        <ButtonGroup mode="radio" value={radioValue} onChange={setRadioValue} items={[{ id: "monthly", label: "Monthly" }, { id: "quarterly", label: "Quarterly" }, { id: "yearly", label: "Yearly" }]} />
        <ButtonGroup mode="checkbox" value={checkboxValue} onChange={setCheckboxValue} items={[{ id: "growth", label: "Growth" }, { id: "cash", label: "Cash" }, { id: "risk", label: "Risk" }]} />
        <ButtonGroup mode="radio" value="profit" items={[{ id: "profit", label: "Profit" }, { id: "ops", label: "Ops", disabled: true }, { id: "finance", label: "Finance" }]} />
      </DemoCard>
    </div>
  );

  if (itemId === "action-btn") return <DemoCard title="Table row actions" note="Compact affordance for edit, menu, and delete actions."><ActionBtn icon={<PencilSimple size={16} />} title="Edit row" /><ActionBtn icon={<DotsThree size={16} weight="bold" />} title="More actions" /><ActionBtn icon={<Trash size={16} />} title="Delete row" variant="danger" /></DemoCard>;
  if (itemId === "button-utility") return <DemoCard title="Toolbar utilities" note="Icon-only actions with shared hover geometry."><ButtonUtility icon={<MagnifyingGlass size={18} />} title="Search" /><ButtonUtility icon={<Copy size={18} />} title="Duplicate" variant="brand" /><ButtonUtility icon={<Trash size={18} />} title="Delete" variant="danger" /><ButtonUtility icon={<X size={14} />} title="Close" size="header" /></DemoCard>;
  if (itemId === "search-input") return <DemoCard title="Search states" note="Empty and filled states should stay visually calm."><SearchInput value={searchValue} onChange={setSearchValue} placeholder="Search metrics..." width="100%" /><SearchInput value={filledSearchValue} onChange={setFilledSearchValue} placeholder="Search metrics..." width="100%" /></DemoCard>;
  if (itemId === "select-dropdown") return <DemoCard title="Selection states" note="Placeholder and selected value inside the same shell."><SelectDropdown value={planValue} onChange={setPlanValue} width="100%" options={[{ value: "starter", label: "Starter" }, { value: "scale", label: "Scale" }, { value: "enterprise", label: "Enterprise" }]} placeholder="Select a plan" clearable /></DemoCard>;
  if (itemId === "number-field") return <DemoCard title="Numeric entry" note="Default, invalid, percentage, and stepper variants."><NumberField value={numberValue} onChange={setNumberValue} width="100%" label="Months of runway" /><NumberField value={numberValue} onChange={setNumberValue} width="100%" isInvalid hint="Value exceeds current recommendation." /><NumberField value={ratioValue} onChange={setRatioValue} width="100%" pct label="Gross margin" /><NumberField value={numberValue} onChange={setNumberValue} width="100%" stepper suf="m" /></DemoCard>;
  if (itemId === "currency-input") return <DemoCard title="Money formatting" note="Belgian separators with optional suffixes and prefixes."><CurrencyInput value={amountValue} onChange={setAmountValue} width="100%" suffix="EUR" /><CurrencyInput value={amountValue} onChange={setAmountValue} width="100%" prefix="€ " /><CurrencyInput value={149.95} onChange={function () {}} width="100%" suffix="EUR" decimals={2} /></DemoCard>;
  if (itemId === "date-picker") return <DemoCard title="Calendar picker" note="Portal-based date selection with clear and today actions."><div style={{ width: "100%", maxWidth: 280 }}><DatePicker value={dateValue} onChange={setDateValue} /></div></DemoCard>;
  if (itemId === "filter-dropdown") return <DemoCard title="Single-dimension filtering" note="Active filters gain brand emphasis."><FilterDropdown value={filterValue} onChange={setFilterValue} options={[{ value: "all", label: "All statuses" }, { value: "active", label: "Active" }, { value: "draft", label: "Draft" }, { value: "archived", label: "Archived" }]} /></DemoCard>;
  if (itemId === "badge") return (
    <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--gap-md)" }}>
      <DemoCard title="Semantic badges" note="Status communication first, decoration second."><Badge color="brand" size="sm">Brand</Badge><Badge color="success" size="sm" dot>Success</Badge><Badge color="warning" size="sm" dot>Warning</Badge><Badge color="error" size="sm" dot>Error</Badge><Badge color="info" size="sm">Info</Badge></DemoCard>
      <DemoCard title="Tier and modern styles" note="Grades and small utility labels."><Badge t="S" size="sm">Tier S</Badge><Badge t="A" size="sm">Tier A</Badge><Badge color="gray" size="sm" type="modern">Modern</Badge><Badge color="brand" size="sm" icon={<Check size={12} weight="bold" />}>Approved</Badge><Badge color="warning" size="sm" onClose={function () {}}>Dismissible</Badge></DemoCard>
    </div>
  );

  if (itemId === "card") return (
    <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--gap-md)" }}>
      <DemoCard title="Content grouping" note="Use cards to group information with one visual shell."><Card sx={{ width: "100%" }}><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Default card</div><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Warm surface, soft border, and stable padding rhythm.</div></Card></DemoCard>
      <DemoCard title="Clickable card" note="Clickable shells should still feel like grouped content, not buttons."><Card sx={{ width: "100%", cursor: "pointer", borderColor: "var(--brand)" }}><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Interactive card</div><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Use sparingly for dashboards, registries, and selection states.</div></Card></DemoCard>
    </div>
  );

  if (itemId === "avatar") return <DemoCard title="People and presence" note="Initials, active ring, and optional presence status."><Avatar name="Thomas V." online userId="thomas" /><Avatar name="Alice Martin" online={false} userId="alice" /><Avatar name="Product Team" size={40} color="var(--brand)" active /><Avatar name="Ops" size={48} showStatus={false} /></DemoCard>;
  if (itemId === "kpi-card") return <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--gap-md)" }}><KpiCard label="Runway" value="14.2m" fullValue="14.2 months" sub="At the current burn rate." current={14.2} target={18} /><KpiCard label="Cash in bank" value="€128k" fullValue="€128,420.00" sub="After payroll and VAT reserve." /></div>;
  if (itemId === "accordion") return <DemoCard title="Disclosure" note="Secondary detail should hide behind clear headings."><div style={{ width: "100%" }}><Accordion title="Accordion anatomy" sub="Trigger, supporting text, content region" open><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Forecrest accordions rely on spacing and type rhythm more than heavy contrast to separate sections.</div></Accordion><Accordion title="Compact guidance" sub="Closed by default"><div style={{ fontSize: 13, color: "var(--text-muted)" }}>Use for secondary help, configuration detail, or optional documentation blocks.</div></Accordion></div></DemoCard>;
  if (itemId === "modal") return (
    <>
      <DemoCard title="Modal anatomy" note="Portal overlay with header, body, and footer structure."><Button color="primary" onClick={function () { setModalOpen(true); }}>Open modal</Button></DemoCard>
      <Modal open={modalOpen} onClose={function () { setModalOpen(false); }} title="Invite a collaborator" subtitle="Share access to the workspace without leaving the current page." size="md">
        <ModalBody><div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}><NumberField value={3} onChange={function () {}} label="Seats" hint="Use a focused task and keep the body concise." /><SelectDropdown value="member" onChange={function () {}} options={[{ value: "member", label: "Member" }, { value: "advisor", label: "Advisor" }]} placeholder="Select a role" /></div></ModalBody>
        <ModalFooter><Button color="tertiary" onClick={function () { setModalOpen(false); }}>Cancel</Button><Button color="primary">Send invite</Button></ModalFooter>
      </Modal>
    </>
  );
  if (itemId === "color-tokens") return <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--gap-md)" }}>{FOUNDATION_GROUPS.map(function (group) { return <TokenGroup key={group.label} label={group.label} tokens={group.tokens} resolved={resolved} />; })}</div>;
  if (itemId === "semantic-mapping") return <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--gap-md)" }}><Card sx={{ overflow: "hidden" }}><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-3)" }}>Mapping rules</div><div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>{TOKEN_MAPPINGS.map(function (entry) { return <div key={entry.forecrest + entry.untitled} style={{ paddingBottom: "var(--sp-3)", borderBottom: "1px solid var(--border-light)" }}><div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: 4, flexWrap: "wrap" }}><code style={{ fontSize: 12, color: "var(--text-primary)" }}>{entry.forecrest}</code><ArrowRight size={12} color="var(--text-faint)" /><code style={{ fontSize: 12, color: "var(--brand)" }}>{entry.untitled}</code></div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{entry.reason}</div></div>; })}</div></Card><div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--gap-md)" }}>{UNTITLED_GROUPS.slice(0, 2).map(function (group) { return <TokenGroup key={group.label} label={group.label} tokens={group.tokens} resolved={resolved} />; })}</div></div>;
  return null;
}

export default function DesignSystemPage() {
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var allItems = useMemo(flattenDesignSystemItems, []);
  var [selectedId, setSelectedId] = useState(getSelectionFromHash);
  var [theme, setTheme] = useState(document.documentElement.getAttribute("data-theme") || "light");
  var [resolved, setResolved] = useState({});

  useEffect(function () {
    function syncSelection(e) {
      var nextId = e && e.detail ? e.detail : getSelectionFromHash();
      setSelectedId(getDesignSystemItem(nextId) ? nextId : getDefaultDesignSystemItemId());
    }

    window.addEventListener("hashchange", syncSelection);
    window.addEventListener(DESIGN_SYSTEM_EVENT, syncSelection);
    return function () {
      window.removeEventListener("hashchange", syncSelection);
      window.removeEventListener(DESIGN_SYSTEM_EVENT, syncSelection);
    };
  }, []);

  useEffect(function () {
    var next = {};
    FOUNDATION_GROUPS.concat(UNTITLED_GROUPS).forEach(function (group) {
      group.tokens.forEach(function (token) {
        next[token] = resolveVar(token);
      });
    });
    setResolved(next);
  }, [theme]);

  useEffect(function () {
    var observer = new MutationObserver(function () {
      setTheme(document.documentElement.getAttribute("data-theme") || "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return function () { observer.disconnect(); };
  }, []);

  var selectedItem = getDesignSystemItem(selectedId) || allItems[0];
  var selectedSection = DESIGN_SYSTEM_SECTIONS.find(function (section) { return section.id === selectedItem.sectionId; }) || DESIGN_SYSTEM_SECTIONS[0];
  var relatedItems = selectedSection.items.filter(function (item) { return item.id !== selectedItem.id; }).slice(0, 3);

  return (
    <PageLayout
      title={<span style={{ display: "flex", alignItems: "center", gap: 10 }}>Design System <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-dev)", background: "var(--color-dev-bg)", border: "1px solid var(--color-dev-border)", padding: "2px 8px", borderRadius: "var(--r-full)", letterSpacing: "0.06em", textTransform: "uppercase" }}>DEV</span></span>}
      subtitle={(lk === "fr" ? "Navigation composants, variantes et fondations visuelles" : "Component navigation, variants, and visual foundations") + " (" + theme + " mode)"}
    >
      <SectionHeader
        eyebrow={lk === "fr" ? "Structure du système" : "System structure"}
        title={lk === "fr" ? "Une page par composant, pilotée par la sidebar" : "One page per component, driven by the sidebar"}
        copy={lk === "fr"
          ? "Le Design System suit maintenant la même structure que le produit : des catégories de composants dans la sidebar, puis une page dédiée pour chaque composant documenté avec ses variantes, ses règles d'usage et un aperçu réel."
          : "The design system now mirrors the product structure: component categories in the sidebar, then one dedicated page per documented component with variants, usage rules, and a live preview."}
      />

      <CategoryStrip lk={lk} selectedSectionId={selectedSection.id} onSelect={function (itemId) { setSelectedId(itemId); updateSelectionHash(itemId); }} />

      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 0.9fr)", gap: "var(--gap-lg)", marginBottom: "var(--gap-xl)" }}>
        <Card sx={{ background: "linear-gradient(135deg, var(--brand-bg) 0%, var(--bg-card) 65%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)", flexWrap: "wrap" }}>
            <Badge color="brand" size="sm">{selectedSection.label[lk]}</Badge>
            <Badge color="gray" size="sm">{selectedItem.file}</Badge>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif", marginBottom: "var(--sp-2)" }}>{selectedItem.name}</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-muted)", maxWidth: 720, marginBottom: "var(--sp-4)" }}>{selectedItem.summary[lk]}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)" }}>
            {selectedItem.variants.map(function (variant) { return <Badge key={variant} color="gray" size="sm" type="modern">{variant}</Badge>; })}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-2)" }}>{lk === "fr" ? "Fiche composant" : "Component summary"}</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-3)", padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}><span style={{ fontSize: 12, color: "var(--text-faint)" }}>{lk === "fr" ? "Catégorie" : "Category"}</span><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{selectedSection.label[lk]}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-3)", padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}><span style={{ fontSize: 12, color: "var(--text-faint)" }}>{lk === "fr" ? "Variantes" : "Variants"}</span><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{selectedItem.variants.length}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-3)", padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}><span style={{ fontSize: 12, color: "var(--text-faint)" }}>{lk === "fr" ? "Thème" : "Theme"}</span><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{theme}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-3)", padding: "10px 0" }}><span style={{ fontSize: 12, color: "var(--text-faint)" }}>{lk === "fr" ? "Composants documentés" : "Documented components"}</span><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{allItems.length}</span></div>
        </Card>
      </div>

      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(280px, 0.95fr)", gap: "var(--gap-lg)", marginBottom: "var(--gap-xl)" }}>
        <Card>
          <SectionHeader eyebrow={lk === "fr" ? "Variantes" : "Variants"} title={lk === "fr" ? "Ce que le composant supporte aujourd'hui" : "What the component supports today"} copy={lk === "fr" ? "La documentation liste uniquement les variantes qui existent réellement dans le code actuel, pour garder un design system fiable et actionnable." : "The documentation only lists variants that actually exist in the current code, so the design system stays reliable and actionable."} />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", paddingBottom: "var(--sp-3)", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lk === "fr" ? "Surface d'API" : "API surface"}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)" }}>
              {selectedItem.variants.map(function (variant) { return <Badge key={variant} color="gray" size="sm" type="modern">{variant}</Badge>; })}
            </div>
          </div>
          <div style={{ paddingTop: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "var(--sp-2)" }}>{lk === "fr" ? "Règles d'usage" : "Usage rules"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              {selectedItem.guidelines.map(function (rule) { return <div key={rule} style={{ display: "flex", gap: "var(--sp-2)", alignItems: "flex-start", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}><span style={{ color: "var(--brand)", lineHeight: 1 }}>*</span><span>{rule}</span></div>; })}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-3)" }}>{lk === "fr" ? "Composants liés" : "Related components"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
            {relatedItems.map(function (item) {
              return <button key={item.id} type="button" onClick={function () { setSelectedId(item.id); updateSelectionHash(item.id); }} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--r-lg)", background: "transparent", padding: "var(--sp-3)", cursor: "pointer", textAlign: "left" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-2)", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.name}</span><ArrowRight size={14} color="var(--text-faint)" /></div><div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{item.summary[lk]}</div></button>;
            })}
          </div>
        </Card>
      </div>

      <SectionHeader eyebrow={lk === "fr" ? "Aperçu" : "Preview"} title={lk === "fr" ? "Prévisualisation du composant" : "Component preview"} copy={lk === "fr" ? "Chaque page de composant montre un aperçu simple mais réel, branché sur les props existantes." : "Each component page shows a lightweight but real preview wired to existing props."} />
      <div style={{ marginBottom: "var(--gap-xl)" }}>
        <ComponentPreview itemId={selectedItem.id} resolved={resolved} />
      </div>
    </PageLayout>
  );
}
