import { useState, useMemo, useEffect } from "react";
import {
  Plus, Trash, PencilSimple, Copy, ToggleRight,
  CookingPot, Cookie, Clock, Lightning, Factory,
  ForkKnife, Coffee, BowlFood, Wine, Hamburger, Cube, Wrench,
  Oven, Fire, Snowflake, Prohibit,
  Package, Scales, Sparkle, Trophy,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, ActionBtn, SearchInput, FilterDropdown, Wizard, ExportButtons, DevOptionsButton, Modal, ModalBody, ModalFooter, CurrencyInput, NumberField, SelectDropdown, DonutChart, ChartLegend, PaletteToggle } from "../components";
import { eur, eurShort, pct, makeId } from "../utils";
import { useT, useLang, useDevMode } from "../context";

/* ── Shared styles ── */
var labelStyle = { display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--sp-1)" };
var inputStyle = { width: "100%", height: 40, padding: "0 var(--sp-3)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none" };
var hintStyle = { fontSize: 10, color: "var(--text-faint)", marginTop: 3 };

/* ── Recipe categories ── */
var RECIPE_CATEGORIES = {
  starter: { icon: BowlFood, badge: "info", label: { fr: "Entrée", en: "Starter" } },
  main: { icon: ForkKnife, badge: "brand", label: { fr: "Plat principal", en: "Main course" } },
  dessert: { icon: Cookie, badge: "warning", label: { fr: "Dessert", en: "Dessert" } },
  drink: { icon: Wine, badge: "success", label: { fr: "Boisson", en: "Drink" } },
  snack: { icon: Hamburger, badge: "gray", label: { fr: "Snack", en: "Snack" } },
  product: { icon: Cube, badge: "info", label: { fr: "Produit artisanal", en: "Handmade product" } },
  service: { icon: Wrench, badge: "gray", label: { fr: "Service", en: "Service" } },
};
var CATEGORY_KEYS = Object.keys(RECIPE_CATEGORIES);

/* ── Energy types ── */
var ENERGY_TYPES = {
  oven: { icon: Oven, label: { fr: "Four", en: "Oven" }, costPerHour: 0.50 },
  stove: { icon: Fire, label: { fr: "Plaque / feux", en: "Stove / burners" }, costPerHour: 0.30 },
  cold: { icon: Snowflake, label: { fr: "Froid (frigo, congel)", en: "Cold (fridge, freezer)" }, costPerHour: 0.05 },
  none: { icon: Prohibit, label: { fr: "Aucun", en: "None" }, costPerHour: 0 },
};

/* ── Unit options ── */
var UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "L", label: "L" },
  { value: "mL", label: "mL" },
  { value: "pcs", label: "pcs" },
];

/* ── TVA options (built per language in modal) ── */

/* ── Season profiles for recipes ── */
var SEASON_PROFILES = [
  { value: "flat", label: { fr: "Stable", en: "Flat" } },
  { value: "summer_peak", label: { fr: "Pic été", en: "Summer peak" } },
  { value: "winter_peak", label: { fr: "Pic hiver", en: "Winter peak" } },
  { value: "bimodal", label: { fr: "Printemps + automne", en: "Spring + fall" } },
];

/* ── Recipe suggestion templates ── */
var RECIPE_SUGGESTIONS = [
  { name: { fr: "Burger classique", en: "Classic burger" }, category: "main", ingredients: [
    { name: "Pain", cost: 0.30, qty: 1, unit: "pcs" },
    { name: "Steak haché", cost: 1.80, qty: 1, unit: "pcs" },
    { name: "Fromage", cost: 0.40, qty: 1, unit: "pcs" },
    { name: "Salade, tomate", cost: 0.30, qty: 1, unit: "pcs" },
  ], prepTimeMinutes: 15, sellingPrice: 12, tvaRate: 0.12 },
  { name: { fr: "Salade César", en: "Caesar salad" }, category: "starter", ingredients: [
    { name: "Laitue", cost: 0.80, qty: 1, unit: "pcs" },
    { name: "Poulet", cost: 2.50, qty: 150, unit: "g" },
    { name: "Parmesan", cost: 0.60, qty: 30, unit: "g" },
    { name: "Croutons", cost: 0.20, qty: 1, unit: "pcs" },
    { name: "Sauce César", cost: 0.40, qty: 1, unit: "pcs" },
  ], prepTimeMinutes: 10, sellingPrice: 14, tvaRate: 0.12 },
  { name: { fr: "Limonade maison", en: "Homemade lemonade" }, category: "drink", ingredients: [
    { name: "Citrons", cost: 0.60, qty: 3, unit: "pcs" },
    { name: "Sucre", cost: 0.10, qty: 50, unit: "g" },
    { name: "Eau gazeuse", cost: 0.30, qty: 500, unit: "mL" },
  ], prepTimeMinutes: 5, sellingPrice: 5, tvaRate: 0.21 },
];

/* ── Activity types for wizard ── */
var ACTIVITY_TYPES = [
  { id: "restaurant", icon: ForkKnife, label: { fr: "Restauration", en: "Restaurant" } },
  { id: "handmade", icon: Cube, label: { fr: "Artisanat", en: "Handmade crafts" } },
  { id: "manufacturing", icon: Factory, label: { fr: "Fabrication", en: "Manufacturing" } },
  { id: "catering", icon: CookingPot, label: { fr: "Traiteur", en: "Catering" } },
];

/* ── Default config ── */
var DEFAULT_PRODUCTION_CONFIG = {
  hourlyRate: 18,
  energyCostPerHour: 0.30,
  targetMargin: 0.70,
  activityType: "restaurant",
};

/* ── Calculation helpers ── */
function calcIngredientCost(ingredients) {
  var total = 0;
  (ingredients || []).forEach(function (ing) { total += (ing.cost || 0) * (ing.qty || 0); });
  return total;
}

function calcLaborCost(prepTimeMinutes, hourlyRate) {
  return ((prepTimeMinutes || 0) / 60) * (hourlyRate || 0);
}

function calcEnergyCost(energyType, prepTimeMinutes, energyCostPerHour) {
  var meta = ENERGY_TYPES[energyType] || ENERGY_TYPES.none;
  var costPerHour = energyCostPerHour || meta.costPerHour;
  return ((prepTimeMinutes || 0) / 60) * costPerHour;
}

function calcRecipeTotalCost(recipe, config) {
  var ingredientCost = calcIngredientCost(recipe.ingredients);
  var labor = calcLaborCost(recipe.prepTimeMinutes, config.hourlyRate);
  var energy = calcEnergyCost(recipe.energyType, recipe.prepTimeMinutes, config.energyCostPerHour);
  var packaging = recipe.packagingCost || 0;
  var subtotal = ingredientCost + labor + energy + packaging;
  var waste = subtotal * ((recipe.wastePct || 0) / 100);
  return subtotal + waste;
}

function calcUnitCost(recipe, config) {
  var total = calcRecipeTotalCost(recipe, config);
  var portions = recipe.portionCount || 1;
  return total / portions;
}

function calcMaterialCostPct(recipe, config) {
  var unitCost = calcUnitCost(recipe, config);
  var price = recipe.sellingPrice || 0;
  if (price <= 0) return 0;
  return (unitCost / price) * 100;
}

function calcMargin(recipe, config) {
  var unitCost = calcUnitCost(recipe, config);
  return (recipe.sellingPrice || 0) - unitCost;
}

/* ── MaterialCostGauge — benchmark bar for cost percentage ── */
function materialCostGaugeColor(pct) { return pct <= 25 ? "var(--color-success)" : pct <= 35 ? "var(--color-warning)" : "var(--color-error)"; }

function MaterialCostGauge({ pct, lk, mini }) {
  var col = materialCostGaugeColor(pct);
  if (mini) {
    return (
      <div style={{ position: "relative", height: 6, borderRadius: 3, overflow: "hidden", background: "var(--bg-accordion)", width: "100%" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "31.25%", background: "rgba(34,197,94,0.15)" }} />
        <div style={{ position: "absolute", left: "31.25%", top: 0, bottom: 0, width: "12.5%", background: "rgba(234,179,8,0.15)" }} />
        <div style={{ position: "absolute", left: "43.75%", top: 0, bottom: 0, right: 0, background: "rgba(239,68,68,0.1)" }} />
        {pct > 0 && pct < 80 ? (
          <div style={{ position: "absolute", left: (pct / 80 * 100) + "%", top: -1, bottom: -1, width: 3, background: col, borderRadius: 2, transform: "translateX(-50%)", transition: "left 0.3s ease" }} />
        ) : null}
      </div>
    );
  }
  return (
    <div>
      <div style={{ position: "relative", height: 40, borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--bg-accordion)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "31.25%", background: "rgba(34,197,94,0.15)" }} />
        <div style={{ position: "absolute", left: "31.25%", top: 0, bottom: 0, width: "12.5%", background: "rgba(234,179,8,0.15)" }} />
        <div style={{ position: "absolute", left: "43.75%", top: 0, bottom: 0, right: 0, background: "rgba(239,68,68,0.1)" }} />
        {pct > 0 && pct < 80 ? (
          <div style={{ position: "absolute", left: (pct / 80 * 100) + "%", top: 0, bottom: 0, width: 3, background: col, borderRadius: 2, transform: "translateX(-50%)", transition: "left 0.3s ease" }} />
        ) : null}
        <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--color-success)", fontWeight: 600 }}>{"< 25%"}</div>
        <div style={{ position: "absolute", left: "33%", top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--color-warning)", fontWeight: 600 }}>25-35%</div>
        <div style={{ position: "absolute", left: "55%", top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--color-error)", fontWeight: 600 }}>{"> 35%"}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
        <span>{lk === "fr" ? "Excellent" : "Excellent"}</span>
        <span>{lk === "fr" ? "Acceptable" : "Acceptable"}</span>
        <span>{lk === "fr" ? "Trop élevé" : "Too high"}</span>
      </div>
    </div>
  );
}

/* ── Recipe Add/Edit Modal ── */
function RecipeModal({ recipe, onSave, onClose, lang, config }) {
  var lk = lang === "en" ? "en" : "fr";
  var [step, setStep] = useState(0);

  /* Step 1 fields */
  var [name, setName] = useState(recipe ? recipe.name : "");
  var [category, setCategory] = useState(recipe ? recipe.category : "main");
  var [portionCount, setPortionCount] = useState(recipe ? recipe.portionCount : 1);
  var [sellingPrice, setSellingPrice] = useState(recipe ? recipe.sellingPrice : 0);
  var [tvaRate, setTvaRate] = useState(recipe ? recipe.tvaRate : 0.21);
  var [monthlySales, setMonthlySales] = useState(recipe ? recipe.monthlySales : 0);
  var [seasonProfile, setSeasonProfile] = useState(recipe ? (recipe.seasonProfile || "flat") : "flat");

  /* Step 2 fields — ingredients */
  var [ingredients, setIngredients] = useState(recipe && recipe.ingredients ? recipe.ingredients.slice() : []);

  /* Step 3 fields — costs */
  var [prepTimeMinutes, setPrepTimeMinutes] = useState(recipe ? recipe.prepTimeMinutes : 0);
  var [energyType, setEnergyType] = useState(recipe ? recipe.energyType : "none");
  var [packagingCost, setPackagingCost] = useState(recipe ? recipe.packagingCost : 0);
  var [wastePct, setWastePct] = useState(recipe ? recipe.wastePct : 0);

  function addIngredient() {
    setIngredients(function (prev) {
      return prev.concat([{ id: makeId("ing"), name: "", cost: 0, qty: 0, unit: "kg" }]);
    });
  }

  function updateIngredient(idx, field, value) {
    setIngredients(function (prev) {
      var nc = prev.slice();
      nc[idx] = Object.assign({}, nc[idx], { [field]: value });
      return nc;
    });
  }

  function removeIngredient(idx) {
    setIngredients(function (prev) { return prev.filter(function (_, i) { return i !== idx; }); });
  }

  /* Summary calculations */
  var draftRecipe = {
    ingredients: ingredients,
    prepTimeMinutes: prepTimeMinutes,
    energyType: energyType,
    packagingCost: packagingCost,
    wastePct: wastePct,
    portionCount: portionCount,
    sellingPrice: sellingPrice,
  };

  var ingredientTotal = calcIngredientCost(ingredients);
  var laborCost = calcLaborCost(prepTimeMinutes, config.hourlyRate);
  var energyCost = calcEnergyCost(energyType, prepTimeMinutes, config.energyCostPerHour);
  var subtotal = ingredientTotal + laborCost + energyCost + packagingCost;
  var wasteAmount = subtotal * ((wastePct || 0) / 100);
  var totalCost = subtotal + wasteAmount;
  var unitCost = totalCost / (portionCount || 1);
  var materialCostPctVal = sellingPrice > 0 ? (unitCost / sellingPrice) * 100 : 0;
  var marginVal = sellingPrice - unitCost;

  function handleSave() {
    onSave({
      name: name || (lk === "fr" ? "Nouvelle recette" : "New recipe"),
      category: category,
      ingredients: ingredients,
      prepTimeMinutes: prepTimeMinutes,
      energyType: energyType,
      packagingCost: packagingCost,
      portionCount: portionCount || 1,
      wastePct: wastePct,
      sellingPrice: sellingPrice,
      tvaRate: tvaRate,
      monthlySales: monthlySales,
      seasonProfile: seasonProfile,
      _configured: true,
    });
    onClose();
  }

  /* TVA dropdown options (language-aware) */
  var tvaOptions = [
    { value: 0.06, label: "6% — " + (lk === "fr" ? "Livraison" : "Delivery") },
    { value: 0.12, label: "12% — " + (lk === "fr" ? "Sur place" : "Dine-in") },
    { value: 0.21, label: "21% — " + (lk === "fr" ? "Alcool, standard" : "Alcohol, standard") },
  ];

  /* Season profile dropdown options */
  var seasonOptions = SEASON_PROFILES.map(function (sp) {
    return { value: sp.value, label: sp.label[lk] };
  });

  /* Apply a suggestion template */
  function applySuggestion(sug) {
    setName(sug.name[lk]);
    setCategory(sug.category);
    setSellingPrice(sug.sellingPrice);
    setTvaRate(sug.tvaRate);
    setPrepTimeMinutes(sug.prepTimeMinutes);
    setIngredients(sug.ingredients.map(function (ing) {
      return { id: makeId("ing"), name: ing.name, cost: ing.cost, qty: ing.qty, unit: ing.unit };
    }));
  }

  return (
    <Modal open onClose={onClose} size="lg" height={560}>
      {/* Progress bar */}
      <div style={{ padding: "var(--sp-4) var(--sp-5) 0" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: "var(--sp-4)" }}>
          {[0, 1, 2].map(function (i) {
            return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "var(--brand)" : "var(--bg-hover)", transition: "background 0.2s" }} />;
          })}
        </div>
      </div>

      <ModalBody>

        {/* Step 1 — Basic info */}
        {step === 0 ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Informations de base" : "Basic information"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Décrivez votre recette ou produit." : "Describe your recipe or product."}
            </div>

            {/* Suggestion templates — only when creating */}
            {!recipe ? (
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Sparkle size={12} weight="fill" />
                  {lk === "fr" ? "Démarrer depuis un modèle" : "Quick-start template"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-2)" }}>
                  {RECIPE_SUGGESTIONS.map(function (sug, si) {
                    var catMeta = RECIPE_CATEGORIES[sug.category] || {};
                    var SIcon = catMeta.icon || Cube;
                    return (
                      <button key={si} type="button" onClick={function () { applySuggestion(sug); }}
                        style={{
                          padding: "var(--sp-2)", border: "1px solid var(--border-light)",
                          borderRadius: "var(--r-md)", background: "var(--bg-accordion)",
                          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                        onMouseEnter={function (e) { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "var(--brand-bg)"; }}
                        onMouseLeave={function (e) { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "var(--bg-accordion)"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <SIcon size={14} weight="duotone" color="var(--text-muted)" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{sug.name[lk]}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-faint)" }}>
                          {sug.ingredients.length} {lk === "fr" ? "ingrédients" : "ingredients"} &middot; {eur(sug.sellingPrice)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={labelStyle}>{lk === "fr" ? "Nom" : "Name"} <span style={{ color: "var(--color-error)" }}>*</span></label>
              <input value={name} onChange={function (e) { setName(e.target.value); }} placeholder={lk === "fr" ? "ex. Burger maison" : "e.g. Homemade burger"} style={inputStyle} />
            </div>

            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={labelStyle}>{lk === "fr" ? "Catégorie" : "Category"}</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--sp-2)" }}>
                {CATEGORY_KEYS.map(function (ck) {
                  var m = RECIPE_CATEGORIES[ck];
                  var CIcon = m.icon;
                  var isActive = category === ck;
                  return (
                    <button key={ck} type="button" onClick={function () { setCategory(ck); }}
                      style={{
                        padding: "var(--sp-2)", border: "2px solid " + (isActive ? "var(--brand)" : "var(--border-light)"),
                        borderRadius: "var(--r-md)", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                        cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "border-color 0.15s",
                      }}>
                      <CIcon size={18} weight={isActive ? "fill" : "duotone"} color={isActive ? "var(--brand)" : "var(--text-muted)"} />
                      <div style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color: isActive ? "var(--brand)" : "var(--text-secondary)", marginTop: 2 }}>{m.label[lk]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Prix de vente (HTVA)" : "Selling price (excl. VAT)"}</label>
                <CurrencyInput value={sellingPrice} onChange={setSellingPrice} suffix="€" width="100%" />
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "TVA" : "VAT"}</label>
                <SelectDropdown value={tvaRate} onChange={function (v) { setTvaRate(v); }} options={tvaOptions} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Portions par recette" : "Portions per recipe"}</label>
                <NumberField value={portionCount} onChange={setPortionCount} min={1} max={9999} step={1} width="100%" />
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Ventes estimées / mois" : "Estimated sales / month"}</label>
                <NumberField value={monthlySales} onChange={setMonthlySales} min={0} max={99999} step={1} width="100%" />
              </div>
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>{lk === "fr" ? "Saisonnalité" : "Seasonality"}</label>
              <SelectDropdown value={seasonProfile} onChange={function (v) { setSeasonProfile(v); }} options={seasonOptions} />
              <div style={hintStyle}>{lk === "fr" ? "Profil de variation mensuelle des ventes" : "Monthly sales variation profile"}</div>
            </div>
          </div>
        ) : null}

        {/* Step 2 — Ingredients */}
        {step === 1 ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Ingrédients" : "Ingredients"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Listez les matières premières nécessaires à cette recette." : "List the raw materials needed for this recipe."}
            </div>

            {ingredients.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 32px", gap: "var(--sp-2)", alignItems: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Ingrédient" : "Ingredient"}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Coût unit." : "Unit cost"}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Quantité" : "Quantity"}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Unité" : "Unit"}</div>
                  <div />
                </div>
                {ingredients.map(function (ing, idx) {
                  return (
                    <div key={ing.id || idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 32px", gap: "var(--sp-2)", alignItems: "center" }}>
                      <input value={ing.name} onChange={function (e) { updateIngredient(idx, "name", e.target.value); }}
                        placeholder={lk === "fr" ? "ex. Farine" : "e.g. Flour"}
                        style={Object.assign({}, inputStyle, { height: 36, fontSize: 13 })} />
                      <CurrencyInput value={ing.cost} onChange={function (v) { updateIngredient(idx, "cost", v); }} suffix="€" width="100%" />
                      <NumberField value={ing.qty} onChange={function (v) { updateIngredient(idx, "qty", v); }} min={0} max={99999} step={0.01} width="100%" />
                      <select value={ing.unit} onChange={function (e) { updateIngredient(idx, "unit", e.target.value); }}
                        style={Object.assign({}, inputStyle, { height: 36, fontSize: 13, padding: "0 var(--sp-2)" })}>
                        {UNIT_OPTIONS.map(function (u) { return <option key={u.value} value={u.value}>{u.label}</option>; })}
                      </select>
                      <button type="button" onClick={function () { removeIngredient(idx); }}
                        style={{ width: 32, height: 32, border: "none", borderRadius: "var(--r-sm)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}
                        onMouseEnter={function (e) { e.currentTarget.style.color = "var(--color-error)"; }}
                        onMouseLeave={function (e) { e.currentTarget.style.color = "var(--text-muted)"; }}>
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "var(--sp-4)", color: "var(--text-faint)", fontSize: 13 }}>
                {lk === "fr" ? "Aucun ingrédient ajouté." : "No ingredients added."}
              </div>
            )}

            <Button color="tertiary" size="md" onClick={addIngredient} iconLeading={<Plus size={14} weight="bold" />}>
              {lk === "fr" ? "Ajouter un ingrédient" : "Add ingredient"}
            </Button>

            {ingredientTotal > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{lk === "fr" ? "Total ingrédients" : "Total ingredients"}</span>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(ingredientTotal)}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Step 3 — Costs + Summary */}
        {step === 2 ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Coûts & résumé" : "Costs & summary"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Temps de préparation, énergie et emballage." : "Prep time, energy and packaging costs."}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Temps de préparation (min)" : "Prep time (min)"}</label>
                <NumberField value={prepTimeMinutes} onChange={setPrepTimeMinutes} min={0} max={9999} step={1} width="100%" />
                <div style={hintStyle}>{lk === "fr" ? "Coût main d'œuvre : " + eur(laborCost) : "Labor cost: " + eur(laborCost)}</div>
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Type d'énergie" : "Energy type"}</label>
                <select value={energyType} onChange={function (e) { setEnergyType(e.target.value); }} style={inputStyle}>
                  {Object.keys(ENERGY_TYPES).map(function (ek) { return <option key={ek} value={ek}>{ENERGY_TYPES[ek].label[lk]}</option>; })}
                </select>
                <div style={hintStyle}>{lk === "fr" ? "Coût énergie : " + eur(energyCost) : "Energy cost: " + eur(energyCost)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Emballage (par portion)" : "Packaging (per portion)"}</label>
                <CurrencyInput value={packagingCost} onChange={setPackagingCost} suffix="€" width="100%" />
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Perte / gaspillage" : "Waste"}</label>
                <NumberField value={wastePct} onChange={setWastePct} min={0} max={100} step={1} width="100%" suffix="%" />
                <div style={hintStyle}>{lk === "fr" ? "Pertes de matières premières" : "Raw material losses"}</div>
              </div>
            </div>

            {/* Summary card */}
            <div style={{ padding: "var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-lg)", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-3)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {lk === "fr" ? "Résumé des coûts" : "Cost summary"}
              </div>
              {[
                { label: lk === "fr" ? "Ingrédients" : "Ingredients", value: ingredientTotal },
                { label: lk === "fr" ? "Main d'œuvre" : "Labor", value: laborCost },
                { label: lk === "fr" ? "Énergie" : "Energy", value: energyCost },
                { label: lk === "fr" ? "Emballage" : "Packaging", value: packagingCost },
                { label: lk === "fr" ? "Gaspillage" : "Waste", value: wasteAmount },
              ].map(function (line) {
                return (
                  <div key={line.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>{line.label}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(line.value)}</span>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid var(--border-light)", marginTop: "var(--sp-2)", paddingTop: "var(--sp-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{lk === "fr" ? "Coût total recette" : "Total recipe cost"}</span>
                  <span style={{ fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(totalCost)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Coût par portion" : "Cost per portion"}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(unitCost)}</span>
                </div>
                {sellingPrice > 0 ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--text-muted)" }}>Coût matière</span>
                      <Badge color={materialCostPctVal < 25 ? "success" : materialCostPctVal <= 35 ? "warning" : "error"} size="sm">
                        {materialCostPctVal.toFixed(1)}%
                      </Badge>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Marge par portion" : "Margin per portion"}</span>
                      <span style={{ fontWeight: 700, color: marginVal >= 0 ? "var(--color-success)" : "var(--color-error)", fontVariantNumeric: "tabular-nums" }}>{eur(marginVal)}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Material cost gauge */}
            {sellingPrice > 0 ? (
              <div style={{ marginTop: "var(--sp-3)" }}>
                <MaterialCostGauge pct={materialCostPctVal} lk={lk} />
              </div>
            ) : null}
          </div>
        ) : null}
      </ModalBody>

      {/* Navigation */}
      <ModalFooter>
        {step > 0 ? (
          <Button color="tertiary" size="lg" onClick={function () { setStep(function (s) { return s - 1; }); }}>
            {lk === "fr" ? "Retour" : "Back"}
          </Button>
        ) : (
          <Button color="tertiary" size="lg" onClick={onClose}>
            {lk === "fr" ? "Annuler" : "Cancel"}
          </Button>
        )}
        {step < 2 ? (
          <Button color="primary" size="lg" isDisabled={step === 0 && !name.trim()} onClick={function () { setStep(function (s) { return s + 1; }); }}>
            {lk === "fr" ? "Suivant" : "Next"}
          </Button>
        ) : (
          <Button color="primary" size="lg" onClick={handleSave} iconLeading={<Plus size={14} weight="bold" />}>
            {recipe ? (lk === "fr" ? "Enregistrer" : "Save") : (lk === "fr" ? "Ajouter" : "Add")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}


/* ══════════════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════════════ */
export default function ProductionPage({ appCfg, production, setProduction, streams, setStreams, costs, setCosts, sals, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var tAll = useT();
  var t = tAll.production || {};
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var { devMode } = useDevMode();

  var cfg = production || {};
  var config = Object.assign({}, DEFAULT_PRODUCTION_CONFIG, cfg.config || {});

  function cfgSet(key, val) {
    setProduction(function (prev) { var nc = Object.assign({}, prev); nc[key] = val; return nc; });
  }

  function configSet(key, val) {
    setProduction(function (prev) {
      var nc = Object.assign({}, prev);
      nc.config = Object.assign({}, nc.config || {}, { [key]: val });
      return nc;
    });
  }

  var [showCreate, setShowCreate] = useState(false);
  var [editing, setEditing] = useState(null);
  var [pendingDelete, setPendingDelete] = useState(null);
  var [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  var [search, setSearch] = useState("");
  var [filter, setFilter] = useState("all");

  var recipes = cfg.recipes || [];

  /* ── CRUD ── */
  function addRecipe(data) {
    var newRecipe = Object.assign({ id: makeId("rec"), createdAt: new Date().toISOString() }, data);
    var newRecipes = recipes.concat([newRecipe]);
    cfgSet("recipes", newRecipes);
    syncLinks(newRecipe);
  }

  function saveRecipe(idx, data) {
    var nc = recipes.slice();
    nc[idx] = Object.assign({}, nc[idx], data);
    cfgSet("recipes", nc);
    syncLinks(nc[idx]);
  }

  function removeRecipe(idx) {
    var removed = recipes[idx];
    var newRecipes = recipes.filter(function (_, j) { return j !== idx; });
    cfgSet("recipes", newRecipes);
    // Remove linked streams and costs
    if (removed) {
      setStreams(function (prev) {
        return (prev || []).map(function (cat) {
          return Object.assign({}, cat, { items: (cat.items || []).filter(function (s) { return s._linkedProduction !== removed.id; }) });
        });
      });
      setCosts(function (prev) {
        return (prev || []).map(function (cat) {
          return Object.assign({}, cat, { items: (cat.items || []).filter(function (c) { return c._linkedProduction !== removed.id; }) });
        });
      });
    }
  }

  function requestDelete(idx) {
    if (skipDeleteConfirm) { removeRecipe(idx); } else { setPendingDelete(idx); }
  }

  function cloneRecipe(idx) {
    var nc = recipes.slice();
    var clone = Object.assign({}, nc[idx], { id: makeId("rec"), name: nc[idx].name + (lk === "fr" ? " (copie)" : " (copy)"), createdAt: new Date().toISOString() });
    clone.ingredients = (clone.ingredients || []).map(function (ing) { return Object.assign({}, ing, { id: makeId("ing") }); });
    nc.splice(idx + 1, 0, clone);
    cfgSet("recipes", nc);
  }

  function bulkDeleteRecipes(ids) {
    var idSet = {};
    ids.forEach(function (id) { idSet[id] = true; });
    var removed = recipes.filter(function (r) { return idSet[String(r.id)]; });
    cfgSet("recipes", recipes.filter(function (r) { return !idSet[String(r.id)]; }));
    removed.forEach(function (rem) {
      setStreams(function (prev) {
        return (prev || []).map(function (cat) {
          return Object.assign({}, cat, { items: (cat.items || []).filter(function (s) { return s._linkedProduction !== rem.id; }) });
        });
      });
      setCosts(function (prev) {
        return (prev || []).map(function (cat) {
          return Object.assign({}, cat, { items: (cat.items || []).filter(function (c) { return c._linkedProduction !== rem.id; }) });
        });
      });
    });
  }

  /* ── Auto-link to Revenue Streams and Operating Costs ── */
  function syncLinks(recipe) {
    if (!recipe) return;
    var recipeId = recipe.id;

    // Revenue link — streams is [{ cat, items }]
    if ((recipe.monthlySales || 0) > 0 && (recipe.sellingPrice || 0) > 0) {
      setStreams(function (prev) {
        var cats = (prev || []).map(function (cat) {
          var existIdx = -1;
          (cat.items || []).forEach(function (s, i) { if (s._linkedProduction === recipeId) existIdx = i; });
          var linked = {
            id: existIdx >= 0 ? cat.items[existIdx].id : makeId("str"),
            behavior: "per_transaction", price: recipe.sellingPrice, qty: recipe.monthlySales,
            l: recipe.name, _linkedProduction: recipeId, _readOnly: true, _linkedPage: "production",
            tva: recipe.tvaRate || 0.21, growthRate: 0, seasonProfile: recipe.seasonProfile || "flat",
          };
          if (existIdx >= 0) {
            var ni = cat.items.slice(); ni[existIdx] = Object.assign({}, ni[existIdx], linked);
            return Object.assign({}, cat, { items: ni });
          }
          return cat;
        });
        var found = false;
        cats.forEach(function (cat) { (cat.items || []).forEach(function (s) { if (s._linkedProduction === recipeId) found = true; }); });
        if (!found && cats.length > 0) {
          cats[0] = Object.assign({}, cats[0], { items: (cats[0].items || []).concat([{
            id: makeId("str"), behavior: "per_transaction", price: recipe.sellingPrice, qty: recipe.monthlySales,
            l: recipe.name, _linkedProduction: recipeId, _readOnly: true, _linkedPage: "production",
            tva: recipe.tvaRate || 0.21, growthRate: 0, seasonProfile: recipe.seasonProfile || "flat",
          }]) });
        }
        return cats;
      });
    } else {
      setStreams(function (prev) {
        return (prev || []).map(function (cat) {
          return Object.assign({}, cat, { items: (cat.items || []).filter(function (s) { return s._linkedProduction !== recipeId; }) });
        });
      });
    }

    // Charge link — costs is [{ cat, items }]
    var ingCost = calcIngredientCost(recipe.ingredients);
    var portions = recipe.portionCount || 1;
    var monthlyIngCost = (ingCost / portions) * (recipe.monthlySales || 0);

    if (monthlyIngCost > 0) {
      setCosts(function (prev) {
        var cats = (prev || []).map(function (cat) {
          var existIdx = -1;
          (cat.items || []).forEach(function (c, i) { if (c._linkedProduction === recipeId) existIdx = i; });
          var linked = {
            id: existIdx >= 0 ? cat.items[existIdx].id : makeId("cost"),
            l: (lk === "fr" ? "Ingrédients \u2014 " : "Ingredients \u2014 ") + recipe.name,
            a: Math.round(monthlyIngCost * 100) / 100, freq: "monthly", pcmn: "6000", pu: false, u: 1,
            _linkedProduction: recipeId, _readOnly: true, _linkedPage: "production",
          };
          if (existIdx >= 0) {
            var ni = cat.items.slice(); ni[existIdx] = Object.assign({}, ni[existIdx], linked);
            return Object.assign({}, cat, { items: ni });
          }
          return cat;
        });
        var found = false;
        cats.forEach(function (cat) { (cat.items || []).forEach(function (c) { if (c._linkedProduction === recipeId) found = true; }); });
        if (!found && cats.length > 0) {
          cats[0] = Object.assign({}, cats[0], { items: (cats[0].items || []).concat([{
            id: makeId("cost"), l: (lk === "fr" ? "Ingrédients \u2014 " : "Ingredients \u2014 ") + recipe.name,
            a: Math.round(monthlyIngCost * 100) / 100, freq: "monthly", pcmn: "6000", pu: false, u: 1,
            _linkedProduction: recipeId, _readOnly: true, _linkedPage: "production",
          }]) });
        }
        return cats;
      });
    } else {
      setCosts(function (prev) {
        return (prev || []).map(function (cat) {
          return Object.assign({}, cat, { items: (cat.items || []).filter(function (c) { return c._linkedProduction !== recipeId; }) });
        });
      });
    }
  }

  /* ── Sync all recipes on recipe list change ── */
  useEffect(function () {
    if (!cfg.enabled || !recipes.length) return;
    recipes.forEach(function (r) { syncLinks(r); });
  }, []);

  /* ── KPIs ── */
  var kpiCount = recipes.length;

  var avgMaterialCost = useMemo(function () {
    if (recipes.length === 0) return 0;
    var sum = 0;
    var counted = 0;
    recipes.forEach(function (r) {
      var fc = calcMaterialCostPct(r, config);
      if ((r.sellingPrice || 0) > 0) { sum += fc; counted++; }
    });
    return counted > 0 ? sum / counted : 0;
  }, [recipes, config]);

  var avgMargin = useMemo(function () {
    if (recipes.length === 0) return 0;
    var sum = 0;
    var counted = 0;
    recipes.forEach(function (r) {
      if ((r.sellingPrice || 0) > 0) { sum += calcMargin(r, config); counted++; }
    });
    return counted > 0 ? sum / counted : 0;
  }, [recipes, config]);

  var estimatedRevenue = useMemo(function () {
    var total = 0;
    recipes.forEach(function (r) { total += (r.monthlySales || 0) * (r.sellingPrice || 0); });
    return total;
  }, [recipes]);

  /* ── Filter ── */
  var filterOptions = useMemo(function () {
    var cats = {};
    recipes.forEach(function (r) { var ck = r.category || "main"; if (RECIPE_CATEGORIES[ck]) cats[ck] = true; });
    var opts = [{ value: "all", label: lk === "fr" ? "Toutes les catégories" : "All categories" }];
    Object.keys(cats).forEach(function (ck) { opts.push({ value: ck, label: RECIPE_CATEGORIES[ck].label[lk] }); });
    return opts;
  }, [recipes, lk]);

  var filteredRecipes = useMemo(function () {
    var list = recipes;
    if (filter !== "all") list = list.filter(function (r) { return (r.category || "main") === filter; });
    if (search.trim()) {
      var q = search.trim().toLowerCase();
      list = list.filter(function (r) { return (r.name || "").toLowerCase().indexOf(q) !== -1; });
    }
    return list;
  }, [recipes, filter, search]);

  /* ── Chart data — category distribution ── */
  var categoryDistribution = useMemo(function () {
    var dist = {};
    recipes.forEach(function (r) {
      var ck = r.category || "main";
      dist[ck] = (dist[ck] || 0) + 1;
    });
    return dist;
  }, [recipes]);

  /* ── Top recipe by margin ── */
  var topRecipe = useMemo(function () {
    var best = null;
    var bestMargin = -Infinity;
    recipes.forEach(function (r) {
      if ((r.sellingPrice || 0) <= 0) return;
      var m = calcMargin(r, config);
      if (m > bestMargin) { bestMargin = m; best = r; }
    });
    if (!best) return null;
    return { recipe: best, margin: bestMargin, materialCostPct: calcMaterialCostPct(best, config) };
  }, [recipes, config]);

  /* ── Columns ── */
  var columns = useMemo(function () {
    return [
      {
        id: "name", accessorKey: "name",
        header: lk === "fr" ? "Nom" : "Name",
        enableSorting: true, meta: { align: "left", minWidth: 160, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
      },
      {
        id: "category",
        accessorFn: function (row) { return row.category || "main"; },
        header: lk === "fr" ? "Catégorie" : "Category",
        enableSorting: true, meta: { align: "left" },
        cell: function (info) {
          var cat = info.getValue();
          var m = RECIPE_CATEGORIES[cat];
          if (!m) return cat;
          return <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge>;
        },
      },
      {
        id: "totalCost",
        header: lk === "fr" ? "Coût total" : "Total cost",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return calcUnitCost(row, config); },
        cell: function (info) { return eur(info.getValue()); },
      },
      {
        id: "sellingPrice",
        header: lk === "fr" ? "Prix de vente" : "Selling price",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.sellingPrice || 0; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? eur(v) : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "materialCost",
        header: "Coût matière %",
        enableSorting: true, meta: { align: "center", minWidth: 120 },
        accessorFn: function (row) { return calcMaterialCostPct(row, config); },
        cell: function (info) {
          var v = info.getValue();
          if (v <= 0) return <span style={{ color: "var(--text-faint)" }}>—</span>;
          return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Badge color={v < 25 ? "success" : v <= 35 ? "warning" : "error"} size="sm">{v.toFixed(1)}%</Badge>
              <MaterialCostGauge pct={v} lk={lk} mini />
            </div>
          );
        },
      },
      {
        id: "margin",
        header: lk === "fr" ? "Marge" : "Margin",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return calcMargin(row, config); },
        cell: function (info) {
          var v = info.getValue();
          return <span style={{ fontWeight: 600, color: v >= 0 ? "var(--color-success)" : "var(--color-error)", fontVariantNumeric: "tabular-nums" }}>{eur(v)}</span>;
        },
      },
      {
        id: "monthlySales",
        header: lk === "fr" ? "Ventes/mois" : "Sales/mo",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.monthlySales || 0; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? String(v) : <span style={{ color: "var(--text-faint)" }}>—</span>;
        },
      },
      {
        id: "actions", header: "", enableSorting: false,
        meta: { align: "center", compactPadding: true, width: 1 },
        cell: function (info) {
          var row = info.row.original;
          var idx = recipes.findIndex(function (r) { return r.id === row.id; });
          return (
            <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <ActionBtn icon={PencilSimple} tooltip={lk === "fr" ? "Modifier" : "Edit"} onClick={function () { setEditing({ idx: idx, item: row }); }} />
              <ActionBtn icon={Copy} tooltip={lk === "fr" ? "Dupliquer" : "Duplicate"} onClick={function () { cloneRecipe(idx); }} />
              <ActionBtn icon={Trash} tooltip={lk === "fr" ? "Supprimer" : "Delete"} variant="danger" onClick={function () { requestDelete(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [recipes, config, lk]);

  /* ── Demo data ── */
  function randomize() {
    var demoRecipes = [
      { id: makeId("rec"), name: lk === "fr" ? "Burger classique" : "Classic burger", category: "main", ingredients: [{ id: makeId("ing"), name: lk === "fr" ? "Pain burger" : "Burger bun", cost: 0.40, qty: 1, unit: "pcs" }, { id: makeId("ing"), name: lk === "fr" ? "Steak haché" : "Beef patty", cost: 2.50, qty: 0.15, unit: "kg" }, { id: makeId("ing"), name: lk === "fr" ? "Cheddar" : "Cheddar", cost: 8, qty: 0.03, unit: "kg" }, { id: makeId("ing"), name: lk === "fr" ? "Salade, tomate" : "Lettuce, tomato", cost: 3, qty: 0.05, unit: "kg" }], prepTimeMinutes: 12, energyType: "stove", packagingCost: 0.30, portionCount: 1, wastePct: 5, sellingPrice: 12.50, tvaRate: 0.12, monthlySales: 350, seasonProfile: "summer_peak", _configured: true, createdAt: new Date().toISOString() },
      { id: makeId("rec"), name: "Tiramisu", category: "dessert", ingredients: [{ id: makeId("ing"), name: "Mascarpone", cost: 5, qty: 0.25, unit: "kg" }, { id: makeId("ing"), name: lk === "fr" ? "Biscuits" : "Biscuits", cost: 3, qty: 0.10, unit: "kg" }, { id: makeId("ing"), name: lk === "fr" ? "Café" : "Coffee", cost: 15, qty: 0.02, unit: "kg" }, { id: makeId("ing"), name: lk === "fr" ? "Oeufs" : "Eggs", cost: 0.30, qty: 3, unit: "pcs" }], prepTimeMinutes: 20, energyType: "cold", packagingCost: 0, portionCount: 4, wastePct: 3, sellingPrice: 7.50, tvaRate: 0.12, monthlySales: 200, seasonProfile: "flat", _configured: true, createdAt: new Date().toISOString() },
      { id: makeId("rec"), name: lk === "fr" ? "Limonade maison" : "Homemade lemonade", category: "drink", ingredients: [{ id: makeId("ing"), name: lk === "fr" ? "Citrons" : "Lemons", cost: 3, qty: 0.20, unit: "kg" }, { id: makeId("ing"), name: lk === "fr" ? "Sucre" : "Sugar", cost: 1.50, qty: 0.05, unit: "kg" }, { id: makeId("ing"), name: lk === "fr" ? "Eau gazeuse" : "Sparkling water", cost: 0.80, qty: 0.33, unit: "L" }], prepTimeMinutes: 5, energyType: "none", packagingCost: 0, portionCount: 1, wastePct: 2, sellingPrice: 4.50, tvaRate: 0.21, monthlySales: 500, seasonProfile: "summer_peak", _configured: true, createdAt: new Date().toISOString() },
      { id: makeId("rec"), name: lk === "fr" ? "Salade César" : "Caesar Salad", category: "starter", ingredients: [{ id: makeId("ing"), name: lk === "fr" ? "Laitue romaine" : "Romaine lettuce", cost: 2.50, qty: 0.15, unit: "kg" }, { id: makeId("ing"), name: lk === "fr" ? "Poulet grillé" : "Grilled chicken", cost: 8, qty: 0.10, unit: "kg" }, { id: makeId("ing"), name: lk === "fr" ? "Parmesan" : "Parmesan", cost: 18, qty: 0.02, unit: "kg" }, { id: makeId("ing"), name: "Croutons", cost: 4, qty: 0.03, unit: "kg" }], prepTimeMinutes: 10, energyType: "stove", packagingCost: 0, portionCount: 1, wastePct: 5, sellingPrice: 11, tvaRate: 0.12, monthlySales: 180, seasonProfile: "bimodal", _configured: true, createdAt: new Date().toISOString() },
    ];
    cfgSet("recipes", demoRecipes);
    cfgSet("enabled", true);
    demoRecipes.forEach(function (r) { syncLinks(r); });
  }

  /* ── Wizard (when not enabled) ── */
  var [wizHourly, setWizHourly] = useState(config.hourlyRate);
  var [wizEnergy, setWizEnergy] = useState(config.energyCostPerHour);
  var [wizMargin, setWizMargin] = useState(config.targetMargin);
  var [wizActivity, setWizActivity] = useState(config.activityType);

  if (!cfg.enabled) {
    var wizardSteps = [
      {
        key: "intro",
        content: (
          <div style={{ textAlign: "center" }}>
            <CookingPot size={56} weight="duotone" style={{ color: "var(--brand)", marginBottom: "var(--sp-4)" }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-3)" }}>
              {lk === "fr" ? "Coûts de production" : "Production Costs"}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "var(--sp-4)", textAlign: "left" }}>
              {lk === "fr"
                ? "Calculez le coût réel de chaque recette ou produit en décomposant les ingrédients, la main d'œuvre et l'énergie. Optimisez vos marges et fixez les bons prix."
                : "Calculate the real cost of each recipe or product by breaking down ingredients, labor and energy. Optimize your margins and set the right prices."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-5)", textAlign: "left" }}>
              {[
                { icon: Cookie, title: lk === "fr" ? "Ingrédients" : "Ingredients", desc: lk === "fr" ? "Le coût des matières premières pour chaque recette ou produit." : "Raw material costs for each recipe or product." },
                { icon: Clock, title: lk === "fr" ? "Main d'œuvre" : "Labor", desc: lk === "fr" ? "Le temps de préparation multiplié par le coût horaire de votre équipe." : "Preparation time multiplied by your team's hourly rate." },
                { icon: Lightning, title: lk === "fr" ? "Énergie & emballage" : "Energy & packaging", desc: lk === "fr" ? "Les coûts d'énergie (four, frigo) et d'emballage si applicable." : "Energy costs (oven, fridge) and packaging if applicable." },
              ].map(function (card, ci) {
                var CIcon = card.icon;
                return (
                  <div key={ci} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--r-lg)", padding: "var(--sp-3)", background: "var(--bg-accordion)" }}>
                    <CIcon size={20} weight="duotone" color="var(--brand)" style={{ marginBottom: "var(--sp-2)" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{card.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{card.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      },
      {
        key: "config",
        content: (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Paramètres de base" : "Base settings"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr"
                ? "Ces valeurs serviront de base pour estimer le coût total de chaque recette."
                : "These values will be used as the base for estimating each recipe's total cost."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Coût horaire moyen de l'équipe" : "Average hourly team cost"}</label>
                <CurrencyInput value={wizHourly} onChange={setWizHourly} suffix="€/h" width="100%" />
                <div style={hintStyle}>{lk === "fr" ? "Coût brut chargé moyen par heure de travail" : "Average loaded gross cost per work hour"}</div>
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Coût énergie moyen" : "Average energy cost"}</label>
                <CurrencyInput value={wizEnergy} onChange={setWizEnergy} suffix="€/h" width="100%" />
                <div style={hintStyle}>{lk === "fr" ? "Coût moyen par heure d'utilisation d'un équipement" : "Average cost per hour of equipment usage"}</div>
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Objectif de marge" : "Target margin"}</label>
                <NumberField value={wizMargin} onChange={setWizMargin} min={0} max={1} step={0.01} width="100%" pct />
                <div style={hintStyle}>{lk === "fr" ? "La marge visée sur le prix de vente (ex. 70% = coût matière cible 30%)" : "Target margin on selling price (e.g. 70% = 30% material cost target)"}</div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "type",
        content: (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: "var(--sp-1)", textAlign: "center" }}>
              {lk === "fr" ? "Quel type d'activité ?" : "What type of activity?"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
              {lk === "fr" ? "Cela nous aide à adapter les catégories et suggestions." : "This helps us adapt categories and suggestions."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
              {ACTIVITY_TYPES.map(function (at) {
                var AIcon = at.icon;
                var isActive = wizActivity === at.id;
                return (
                  <button key={at.id} type="button" onClick={function () { setWizActivity(at.id); }}
                    style={{
                      padding: "var(--sp-4)", border: "2px solid " + (isActive ? "var(--brand)" : "var(--border-light)"),
                      borderRadius: "var(--r-lg)", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "border-color 0.15s",
                    }}>
                    <AIcon size={28} weight={isActive ? "fill" : "duotone"} color={isActive ? "var(--brand)" : "var(--text-muted)"} style={{ marginBottom: "var(--sp-2)" }} />
                    <div style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--brand)" : "var(--text-secondary)" }}>{at.label[lk]}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ),
      },
    ];

    function wizardFinish() {
      cfgSet("enabled", true);
      cfgSet("recipes", []);
      cfgSet("config", {
        hourlyRate: wizHourly,
        energyCostPerHour: wizEnergy,
        targetMargin: wizMargin,
        activityType: wizActivity,
      });
    }

    return (
      <PageLayout
        title={lk === "fr" ? "Production" : "Production"}
        subtitle={lk === "fr" ? "Calculez le coût de revient de vos recettes et produits." : "Calculate the cost price of your recipes and products."}
        icon={CookingPot} iconColor="var(--brand)"
      >
        <Wizard
          steps={wizardSteps}
          onFinish={wizardFinish}
          finishLabel={lk === "fr" ? "Commencer" : "Get started"}
          finishIcon={<ToggleRight size={16} />}
        />
      </PageLayout>
    );
  }

  /* ── Toolbar ── */
  var toolbarNode = (
    <>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
        <SearchInput value={search} onChange={setSearch} placeholder={lk === "fr" ? "Rechercher..." : "Search..."} />
        <FilterDropdown value={filter} onChange={setFilter} options={filterOptions} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center" }}>
        {devMode ? (
          <DevOptionsButton onRandomize={randomize} onClear={function () { cfgSet("recipes", []); }} />
        ) : null}
        <ExportButtons cfg={appCfg} data={filteredRecipes} columns={columns} filename="production" title="Production" subtitle={lk === "fr" ? "Coûts de production" : "Production costs"} getPcmn={function () { return "6000"; }} />
        <Button color="primary" size="lg" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />}>
          {lk === "fr" ? "Ajouter" : "Add"}
        </Button>
      </div>
    </>
  );

  var emptyNode = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-6)" }}>
      <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "var(--bg-accordion)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CookingPot size={24} weight="duotone" color="var(--text-muted)" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{lk === "fr" ? "Aucune recette" : "No recipes"}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 360, textAlign: "center" }}>{lk === "fr" ? "Ajoutez vos recettes ou produits pour calculer les coûts de production." : "Add your recipes or products to calculate production costs."}</div>
      <Button color="primary" size="md" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {lk === "fr" ? "Ajouter" : "Add"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={lk === "fr" ? "Production" : "Production"}
      subtitle={lk === "fr" ? "Calculez le coût de revient de vos recettes et produits." : "Calculate the cost price of your recipes and products."}
      icon={CookingPot} iconColor="var(--brand)"
    >
      {showCreate ? <RecipeModal onSave={addRecipe} onClose={function () { setShowCreate(false); }} lang={lang} config={config} /> : null}
      {editing ? <RecipeModal recipe={editing.item} onSave={function (data) { saveRecipe(editing.idx, data); }} onClose={function () { setEditing(null); }} lang={lang} config={config} /> : null}
      {pendingDelete !== null ? <ConfirmDeleteModal
        onConfirm={function () { removeRecipe(pendingDelete); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm} setSkipNext={setSkipDeleteConfirm}
        t={{
          confirm_title: lk === "fr" ? "Supprimer cette recette ?" : "Delete this recipe?",
          confirm_body: lk === "fr" ? "Cette recette et ses liens (revenus, charges) seront supprimés." : "This recipe and its links (revenue, costs) will be removed.",
          confirm_skip: lk === "fr" ? "Ne plus demander" : "Don't ask again",
          cancel: lk === "fr" ? "Annuler" : "Cancel",
          delete: lk === "fr" ? "Supprimer" : "Delete",
        }}
      /> : null}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={lk === "fr" ? "Recettes" : "Recipes"} value={String(kpiCount)} glossaryKey="production_count" />
        <KpiCard label={lk === "fr" ? "Coût matière moyen" : "Avg. material cost"} value={avgMaterialCost > 0 ? avgMaterialCost.toFixed(1) + "%" : "\u2014"} glossaryKey="production_material_cost" />
        <KpiCard label={lk === "fr" ? "Marge moyenne" : "Avg. margin"} value={avgMargin !== 0 ? eur(avgMargin) : "\u2014"} glossaryKey="production_margin" />
        <KpiCard label={lk === "fr" ? "CA estimé / mois" : "Est. revenue / mo"} value={estimatedRevenue > 0 ? eurShort(estimatedRevenue) : "\u2014"} fullValue={estimatedRevenue > 0 ? eur(estimatedRevenue) : undefined} glossaryKey="production_revenue" />
      </div>

      {/* Insights section */}
      {recipes.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {lk === "fr" ? "Répartition par catégorie" : "Distribution by category"}
              </div>
              <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
            </div>
            <ChartLegend palette={chartPalette} distribution={categoryDistribution} meta={RECIPE_CATEGORIES} total={recipes.length} lk={lk}>
              <DonutChart data={categoryDistribution} palette={chartPalette} />
            </ChartLegend>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {lk === "fr" ? "Meilleure marge" : "Top margin"}
            </div>
            {topRecipe ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <Trophy size={18} weight="fill" color="var(--color-warning)" />
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{topRecipe.recipe.name}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  <span style={{ fontWeight: 700, color: "var(--color-success)", fontVariantNumeric: "tabular-nums" }}>{eur(topRecipe.margin)}</span>
                  {" "}{lk === "fr" ? "de marge par portion" : "margin per portion"}
                </div>
                <div style={{ marginTop: "var(--sp-3)" }}>
                  <MaterialCostGauge pct={topRecipe.materialCostPct} lk={lk} mini />
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", fontSize: 13 }}>
                {lk === "fr" ? "Ajoutez des recettes avec un prix de vente" : "Add recipes with a selling price"}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* DataTable — adding columns incrementally */}
      <DataTable
        data={filteredRecipes}
        columns={[
          { id: "name", accessorKey: "name", header: "Nom", cell: function (info) { return info.getValue() || "\u2014"; } },
          { id: "category", accessorFn: function (row) { return row.category || "main"; }, header: lk === "fr" ? "Catégorie" : "Category", cell: function (info) { var cat = info.getValue(); var m = RECIPE_CATEGORIES[cat]; if (!m) return cat; return <Badge color={m.badge} size="sm" dot>{m.label[lk]}</Badge>; } },
          { id: "totalCost", accessorFn: function (row) { return calcUnitCost(row, config); }, header: lk === "fr" ? "Coût" : "Cost", meta: { align: "right" }, cell: function (info) { return eur(info.getValue()); } },
          { id: "sellingPrice", accessorFn: function (row) { return row.sellingPrice || 0; }, header: "Prix", meta: { align: "right" }, cell: function (info) { return eur(info.getValue()); } },
          { id: "materialCost", accessorFn: function (row) { return calcMaterialCostPct(row, config); }, header: lk === "fr" ? "Coût matière %" : "Material cost %", meta: { align: "center", minWidth: 120 }, cell: function (info) { var v = info.getValue(); if (v <= 0) return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>; return (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><Badge color={v < 25 ? "success" : v <= 35 ? "warning" : "error"} size="sm">{v.toFixed(1)}%</Badge><MaterialCostGauge pct={v} lk={lk} mini /></div>); } },
          { id: "margin", accessorFn: function (row) { return calcMargin(row, config); }, header: lk === "fr" ? "Marge" : "Margin", meta: { align: "right" }, cell: function (info) { var v = info.getValue(); return <span style={{ fontWeight: 600, color: v >= 0 ? "var(--color-success)" : "var(--color-error)", fontVariantNumeric: "tabular-nums" }}>{eur(v)}</span>; } },
          { id: "monthlySales", accessorFn: function (row) { return row.monthlySales || 0; }, header: "Ventes/mois", meta: { align: "right" }, cell: function (info) { var v = info.getValue(); return v > 0 ? String(v) : "\u2014"; } },
          { id: "actions", header: "", enableSorting: false, meta: { align: "center", compactPadding: true, width: 1 }, cell: function (info) { var row = info.row.original; var idx = recipes.findIndex(function (r) { return r.id === row.id; }); return (<div style={{ display: "flex", gap: 2, justifyContent: "center" }}><ActionBtn icon={<PencilSimple size={14} />} title={lk === "fr" ? "Modifier" : "Edit"} onClick={function () { setEditing({ idx: idx, item: row }); }} /><ActionBtn icon={<Copy size={14} />} title={lk === "fr" ? "Dupliquer" : "Duplicate"} onClick={function () { cloneRecipe(idx); }} /><ActionBtn icon={<Trash size={14} />} title={lk === "fr" ? "Supprimer" : "Delete"} variant="danger" onClick={function () { requestDelete(idx); }} /></div>); } },
        ]}
        toolbar={toolbarNode}
        emptyState={emptyNode}
        emptyMinHeight={200}
        pageSize={10}
        getRowId={function (row) { return String(row.id); }}
        selectable
        onDeleteSelected={bulkDeleteRecipes}
      />
    </PageLayout>
  );
}
