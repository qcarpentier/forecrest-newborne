import { useState, useMemo, useEffect } from "react";
import {
  Plus, Trash, PencilSimple, Copy, ToggleRight,
  CookingPot, Cookie, Clock, Lightning, Factory,
  ForkKnife, BowlFood, Wine, Hamburger, Cube,
  Oven, Fire, Snowflake, Prohibit,
  Sparkle, Warning, X, Package, Link,
} from "@phosphor-icons/react";
import { PageLayout, Badge, KpiCard, Button, DataTable, ConfirmDeleteModal, ActionBtn, SearchInput, FilterDropdown, Wizard, ExportButtons, DevOptionsButton, Modal, ModalFooter, CurrencyInput, NumberField, SelectDropdown, DonutChart, ChartLegend, PaletteToggle, FinanceLink } from "../../components";
import { eur, eurShort, makeId, calcItemAutonomy } from "../../utils";
import { SEASONALITY_PROFILES } from "../../constants";
import { useLang, useDevMode } from "../../context";

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
};
var CATEGORY_KEYS = Object.keys(RECIPE_CATEGORIES);

/* Categories visible per activity type */
var CATEGORIES_BY_ACTIVITY = {
  restaurant: ["starter", "main", "dessert", "drink", "snack"],
  handmade: ["product"],
  manufacturing: ["product"],
  catering: ["starter", "main", "dessert", "drink"],
};
var DEFAULT_CATEGORY_BY_ACTIVITY = {
  restaurant: "main",
  handmade: "product",
  manufacturing: "product",
  catering: "main",
};

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

/* ── Mini sparkline for seasonality ── */
function SeasonSpark(props) {
  var coefs = props.coefs; var w = props.width || 80; var h = props.height || 24;
  var max = Math.max.apply(null, coefs); var min = Math.min.apply(null, coefs);
  var range = max - min || 1; var pad = 2;
  var points = coefs.map(function (c, i) {
    var x = pad + (i / 11) * (w - pad * 2);
    var y = h - pad - ((c - min) / range) * (h - pad * 2);
    return x + "," + y;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }} role="img" aria-hidden="true">
      <polyline points={points} fill="none" stroke={props.color || "var(--brand)"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Suggestion templates by activity type ── */
/* Suggestions keyed by category — shown based on selected category in modal */
var SUGGESTIONS_BY_CATEGORY = {
  starter: [
    { name: { fr: "Soupe de saison", en: "Seasonal soup" }, ingredients: [
      { name: { fr: "Légumes de saison", en: "Seasonal vegetables" }, cost: 3.00, qty: 0.30, unit: "kg" },
      { name: { fr: "Oignon", en: "Onion" }, cost: 1.50, qty: 0.08, unit: "kg" },
      { name: { fr: "Crème fraîche", en: "Fresh cream" }, cost: 3.20, qty: 0.03, unit: "L" },
      { name: { fr: "Bouillon", en: "Broth" }, cost: 0.80, qty: 0.25, unit: "L" },
    ], prepTimeMinutes: 25, sellingPrice: 8.50, tvaRate: 0.12 },
    { name: { fr: "Bruschetta", en: "Bruschetta" }, ingredients: [
      { name: { fr: "Pain ciabatta", en: "Ciabatta bread" }, cost: 1.20, qty: 2, unit: "pcs" },
      { name: { fr: "Tomates", en: "Tomatoes" }, cost: 3.00, qty: 0.15, unit: "kg" },
      { name: { fr: "Basilic frais", en: "Fresh basil" }, cost: 0.30, qty: 1, unit: "pcs" },
      { name: { fr: "Huile d'olive", en: "Olive oil" }, cost: 8.00, qty: 0.02, unit: "L" },
    ], prepTimeMinutes: 10, sellingPrice: 7.00, tvaRate: 0.12, portionCount: 2 },
    { name: { fr: "Plateau apéro", en: "Appetizer platter" }, ingredients: [
      { name: { fr: "Houmous maison", en: "Homemade hummus" }, cost: 2.00, qty: 0.30, unit: "kg" },
      { name: { fr: "Crudités", en: "Raw vegetables" }, cost: 3.00, qty: 0.50, unit: "kg" },
      { name: { fr: "Pain pita", en: "Pita bread" }, cost: 1.50, qty: 5, unit: "pcs" },
    ], prepTimeMinutes: 20, sellingPrice: 35.00, tvaRate: 0.12, portionCount: 10 },
  ],
  main: [
    { name: { fr: "Bowl végétarien", en: "Veggie bowl" }, ingredients: [
      { name: { fr: "Quinoa", en: "Quinoa" }, cost: 4.50, qty: 0.08, unit: "kg" },
      { name: { fr: "Avocat", en: "Avocado" }, cost: 1.20, qty: 0.5, unit: "pcs" },
      { name: { fr: "Pois chiches", en: "Chickpeas" }, cost: 1.80, qty: 0.06, unit: "kg" },
      { name: { fr: "Patate douce", en: "Sweet potato" }, cost: 2.50, qty: 0.12, unit: "kg" },
    ], prepTimeMinutes: 20, sellingPrice: 14.50, tvaRate: 0.12 },
    { name: { fr: "Risotto aux champignons", en: "Mushroom risotto" }, ingredients: [
      { name: { fr: "Riz arborio", en: "Arborio rice" }, cost: 3.50, qty: 0.08, unit: "kg" },
      { name: { fr: "Champignons", en: "Mushrooms" }, cost: 8.00, qty: 0.10, unit: "kg" },
      { name: { fr: "Parmesan", en: "Parmesan" }, cost: 18.00, qty: 0.02, unit: "kg" },
      { name: { fr: "Bouillon", en: "Broth" }, cost: 0.80, qty: 0.30, unit: "L" },
    ], prepTimeMinutes: 30, sellingPrice: 16.00, tvaRate: 0.12 },
    { name: { fr: "Curry de légumes", en: "Vegetable curry" }, ingredients: [
      { name: { fr: "Lait de coco", en: "Coconut milk" }, cost: 2.50, qty: 0.20, unit: "L" },
      { name: { fr: "Légumes variés", en: "Mixed vegetables" }, cost: 3.00, qty: 0.25, unit: "kg" },
      { name: { fr: "Pâte de curry", en: "Curry paste" }, cost: 6.00, qty: 0.02, unit: "kg" },
      { name: { fr: "Riz basmati", en: "Basmati rice" }, cost: 2.00, qty: 0.08, unit: "kg" },
    ], prepTimeMinutes: 25, sellingPrice: 13.50, tvaRate: 0.12 },
  ],
  dessert: [
    { name: { fr: "Tiramisu maison", en: "Homemade tiramisu" }, ingredients: [
      { name: { fr: "Mascarpone", en: "Mascarpone" }, cost: 5.00, qty: 0.25, unit: "kg" },
      { name: { fr: "Biscuits", en: "Biscuits" }, cost: 3.00, qty: 0.10, unit: "kg" },
      { name: { fr: "Café", en: "Coffee" }, cost: 15.00, qty: 0.02, unit: "kg" },
      { name: { fr: "Oeufs", en: "Eggs" }, cost: 0.30, qty: 3, unit: "pcs" },
    ], prepTimeMinutes: 20, sellingPrice: 7.50, tvaRate: 0.12 },
    { name: { fr: "Fondant au chocolat", en: "Chocolate lava cake" }, ingredients: [
      { name: { fr: "Chocolat noir", en: "Dark chocolate" }, cost: 12.00, qty: 0.08, unit: "kg" },
      { name: { fr: "Beurre", en: "Butter" }, cost: 8.00, qty: 0.05, unit: "kg" },
      { name: { fr: "Oeufs", en: "Eggs" }, cost: 0.30, qty: 2, unit: "pcs" },
      { name: { fr: "Sucre", en: "Sugar" }, cost: 1.50, qty: 0.03, unit: "kg" },
    ], prepTimeMinutes: 15, sellingPrice: 8.00, tvaRate: 0.12 },
    { name: { fr: "Panna cotta fruits rouges", en: "Berry panna cotta" }, ingredients: [
      { name: { fr: "Crème", en: "Cream" }, cost: 4.00, qty: 0.15, unit: "L" },
      { name: { fr: "Fruits rouges", en: "Mixed berries" }, cost: 10.00, qty: 0.05, unit: "kg" },
      { name: { fr: "Gélatine", en: "Gelatin" }, cost: 8.00, qty: 0.003, unit: "kg" },
      { name: { fr: "Sucre", en: "Sugar" }, cost: 1.50, qty: 0.02, unit: "kg" },
    ], prepTimeMinutes: 15, sellingPrice: 7.00, tvaRate: 0.12 },
  ],
  drink: [
    { name: { fr: "Thé glacé maison", en: "Homemade iced tea" }, ingredients: [
      { name: { fr: "Thé en vrac", en: "Loose leaf tea" }, cost: 12.00, qty: 0.005, unit: "kg" },
      { name: { fr: "Miel", en: "Honey" }, cost: 8.00, qty: 0.015, unit: "kg" },
      { name: { fr: "Citron", en: "Lemon" }, cost: 0.40, qty: 0.5, unit: "pcs" },
      { name: { fr: "Menthe fraîche", en: "Fresh mint" }, cost: 0.30, qty: 1, unit: "pcs" },
    ], prepTimeMinutes: 10, sellingPrice: 4.50, tvaRate: 0.21 },
    { name: { fr: "Smoothie vert", en: "Green smoothie" }, ingredients: [
      { name: { fr: "Épinards", en: "Spinach" }, cost: 4.00, qty: 0.05, unit: "kg" },
      { name: { fr: "Banane", en: "Banana" }, cost: 0.25, qty: 1, unit: "pcs" },
      { name: { fr: "Lait d'avoine", en: "Oat milk" }, cost: 2.50, qty: 0.25, unit: "L" },
    ], prepTimeMinutes: 5, sellingPrice: 5.50, tvaRate: 0.21 },
    { name: { fr: "Cocktail signature", en: "Signature cocktail" }, ingredients: [
      { name: { fr: "Jus de fruits frais", en: "Fresh fruit juice" }, cost: 3.00, qty: 0.15, unit: "L" },
      { name: { fr: "Sirop maison", en: "Homemade syrup" }, cost: 5.00, qty: 0.03, unit: "L" },
      { name: { fr: "Eau pétillante", en: "Sparkling water" }, cost: 0.80, qty: 0.20, unit: "L" },
    ], prepTimeMinutes: 5, sellingPrice: 6.00, tvaRate: 0.21 },
  ],
  snack: [
    { name: { fr: "Granola maison", en: "Homemade granola" }, ingredients: [
      { name: { fr: "Flocons d'avoine", en: "Oat flakes" }, cost: 2.00, qty: 0.15, unit: "kg" },
      { name: { fr: "Miel", en: "Honey" }, cost: 8.00, qty: 0.03, unit: "kg" },
      { name: { fr: "Noix mélangées", en: "Mixed nuts" }, cost: 12.00, qty: 0.05, unit: "kg" },
    ], prepTimeMinutes: 25, sellingPrice: 6.00, tvaRate: 0.12 },
    { name: { fr: "Energy balls", en: "Energy balls" }, ingredients: [
      { name: { fr: "Dattes", en: "Dates" }, cost: 6.00, qty: 0.10, unit: "kg" },
      { name: { fr: "Amandes", en: "Almonds" }, cost: 14.00, qty: 0.05, unit: "kg" },
      { name: { fr: "Cacao", en: "Cocoa" }, cost: 10.00, qty: 0.02, unit: "kg" },
    ], prepTimeMinutes: 15, sellingPrice: 3.50, tvaRate: 0.12 },
    { name: { fr: "Cookies véganes", en: "Vegan cookies" }, ingredients: [
      { name: { fr: "Farine", en: "Flour" }, cost: 1.50, qty: 0.12, unit: "kg" },
      { name: { fr: "Huile de coco", en: "Coconut oil" }, cost: 8.00, qty: 0.04, unit: "kg" },
      { name: { fr: "Pépites de chocolat", en: "Chocolate chips" }, cost: 10.00, qty: 0.04, unit: "kg" },
      { name: { fr: "Sucre de coco", en: "Coconut sugar" }, cost: 5.00, qty: 0.04, unit: "kg" },
    ], prepTimeMinutes: 20, sellingPrice: 3.00, tvaRate: 0.12 },
  ],
  product: [
    { name: { fr: "Bougie parfumée", en: "Scented candle" }, ingredients: [
      { name: { fr: "Cire de soja", en: "Soy wax" }, cost: 8.00, qty: 0.20, unit: "kg" },
      { name: { fr: "Mèche coton", en: "Cotton wick" }, cost: 0.15, qty: 1, unit: "pcs" },
      { name: { fr: "Huile essentielle", en: "Essential oil" }, cost: 12.00, qty: 0.01, unit: "L" },
      { name: { fr: "Pot en verre", en: "Glass jar" }, cost: 1.20, qty: 1, unit: "pcs" },
    ], prepTimeMinutes: 30, sellingPrice: 18.00, tvaRate: 0.21 },
    { name: { fr: "Savon naturel", en: "Natural soap" }, ingredients: [
      { name: { fr: "Huile d'olive", en: "Olive oil" }, cost: 6.00, qty: 0.15, unit: "L" },
      { name: { fr: "Beurre de karité", en: "Shea butter" }, cost: 15.00, qty: 0.03, unit: "kg" },
      { name: { fr: "Soude caustique", en: "Lye" }, cost: 4.00, qty: 0.02, unit: "kg" },
    ], prepTimeMinutes: 45, sellingPrice: 8.50, tvaRate: 0.21 },
    { name: { fr: "T-shirt sérigraphié", en: "Screen-printed t-shirt" }, ingredients: [
      { name: { fr: "T-shirt blanc", en: "Blank t-shirt" }, cost: 3.50, qty: 1, unit: "pcs" },
      { name: { fr: "Encre textile", en: "Textile ink" }, cost: 15.00, qty: 0.01, unit: "L" },
      { name: { fr: "Emballage", en: "Packaging" }, cost: 0.40, qty: 1, unit: "pcs" },
    ], prepTimeMinutes: 15, sellingPrice: 25.00, tvaRate: 0.21 },
  ],
};

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

/* ── Registry migration helper ── */
function migrateToRegistry(production) {
  if (production._registryMigrated) return production;
  var registry = [];
  var nameMap = {};
  var recipes = (production.recipes || []).map(function (r) {
    var newIngs = (r.ingredients || []).map(function (ing) {
      /* Already migrated ingredient — has ingredientId */
      if (ing.ingredientId) return ing;
      var key = (ing.name || "").toLowerCase().trim();
      if (!key) return ing;
      if (!nameMap[key]) {
        var regItem = { id: makeId("ing"), name: ing.name, unitCost: ing.cost || 0, unit: ing.unit || "kg" };
        registry.push(regItem);
        nameMap[key] = regItem.id;
      }
      return { ingredientId: nameMap[key], qty: ing.qty || 0 };
    });
    return Object.assign({}, r, { ingredients: newIngs });
  });
  return Object.assign({}, production, { ingredients: registry, recipes: recipes, _registryMigrated: true });
}

/* ── Resolve ingredient from registry ── */
function resolveIngredient(ri, registry) {
  if (!ri.ingredientId) return { name: ri.name || "", unitCost: ri.cost || ri.unitCost || 0, unit: ri.unit || "kg" };
  var reg = (registry || []).find(function (r) { return r.id === ri.ingredientId; });
  if (reg) return reg;
  return { name: "", unitCost: 0, unit: "kg" };
}

/* ── Calculation helpers ── */
function calcIngredientCost(ingredients, registry) {
  var total = 0;
  (ingredients || []).forEach(function (ri) {
    var reg = resolveIngredient(ri, registry);
    var cost = reg.unitCost || 0;
    total += cost * (ri.qty || 0);
  });
  return total;
}

function calcLaborCost(laborEntries) {
  var total = 0;
  (laborEntries || []).forEach(function (e) {
    total += ((e.minutes || 0) / 60) * (e.hourlyRate || 0);
  });
  return total;
}

function calcEnergyCost(energyEntries) {
  var total = 0;
  (energyEntries || []).forEach(function (e) {
    var meta = ENERGY_TYPES[e.type] || ENERGY_TYPES.none;
    var rate = e.costPerHour != null ? e.costPerHour : meta.costPerHour;
    total += ((e.minutes || 0) / 60) * rate;
  });
  return total;
}

/* Backward-compat: migrate old prepTimeMinutes/energyType to new arrays */
function migrateLaborEntries(recipe, config) {
  if (recipe.laborEntries && recipe.laborEntries.length > 0) return recipe.laborEntries;
  if (recipe.prepTimeMinutes > 0) {
    return [{ id: makeId("lab"), role: "", minutes: recipe.prepTimeMinutes, hourlyRate: config.hourlyRate || 18 }];
  }
  return [];
}

function migrateEnergyEntries(recipe) {
  if (recipe.energyEntries && recipe.energyEntries.length > 0) return recipe.energyEntries;
  if (recipe.energyType && recipe.energyType !== "none" && recipe.prepTimeMinutes > 0) {
    return [{ id: makeId("nrg"), type: recipe.energyType, minutes: recipe.prepTimeMinutes }];
  }
  return [];
}

function calcRecipeTotalCost(recipe, config, registry) {
  var ingredientCost = calcIngredientCost(recipe.ingredients, registry);
  var laborEntries = migrateLaborEntries(recipe, config);
  var energyEntries = migrateEnergyEntries(recipe);
  var labor = calcLaborCost(laborEntries);
  var energy = calcEnergyCost(energyEntries);
  var packaging = recipe.packagingCost || 0;
  var subtotal = ingredientCost + labor + energy + packaging;
  var waste = subtotal * ((recipe.wastePct || 0) / 100);
  return subtotal + waste;
}

function calcUnitCost(recipe, config, registry) {
  var total = calcRecipeTotalCost(recipe, config, registry);
  var portions = recipe.portionCount || 1;
  return total / portions;
}

function calcMaterialCostPct(recipe, config, registry) {
  var unitCost = calcUnitCost(recipe, config, registry);
  var price = recipe.sellingPrice || 0;
  if (price <= 0) return 0;
  return (unitCost / price) * 100;
}

function calcMargin(recipe, config, registry) {
  var unitCost = calcUnitCost(recipe, config, registry);
  return (recipe.sellingPrice || 0) - unitCost;
}

/* ── MaterialCostGauge — benchmark bar for cost percentage ── */
function materialCostGaugeColor(pct) { return pct <= 25 ? "var(--color-success)" : pct <= 35 ? "var(--color-warning)" : "var(--color-error)"; }

function MaterialCostGauge({ pct, lk, mini }) {
  var col = materialCostGaugeColor(pct);
  if (mini) {
    return (
      <div style={{ position: "relative", height: 6, borderRadius: 3, overflow: "hidden", background: "var(--bg-accordion)", width: "100%" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "31.25%", background: "var(--color-success-bg)" }} />
        <div style={{ position: "absolute", left: "31.25%", top: 0, bottom: 0, width: "12.5%", background: "var(--color-warning-bg)" }} />
        <div style={{ position: "absolute", left: "43.75%", top: 0, bottom: 0, right: 0, background: "var(--color-error-bg)" }} />
        {pct > 0 && pct < 80 ? (
          <div style={{ position: "absolute", left: (pct / 80 * 100) + "%", top: -1, bottom: -1, width: 3, background: col, borderRadius: 2, transform: "translateX(-50%)", transition: "left 0.3s ease" }} />
        ) : null}
      </div>
    );
  }
  return (
    <div>
      <div style={{ position: "relative", height: 40, borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--bg-accordion)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "31.25%", background: "var(--color-success-bg)" }} />
        <div style={{ position: "absolute", left: "31.25%", top: 0, bottom: 0, width: "12.5%", background: "var(--color-warning-bg)" }} />
        <div style={{ position: "absolute", left: "43.75%", top: 0, bottom: 0, right: 0, background: "var(--color-error-bg)" }} />
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
function RecipeModal({ recipe, onSave, onClose, lang, config, sals, registry, onRegistryUpdate }) {
  var lk = lang === "en" ? "en" : "fr";
  var [step, setStep] = useState(0);

  /* Step 1 fields */
  var [name, setName] = useState(recipe ? recipe.name : "");
  var defaultCat = DEFAULT_CATEGORY_BY_ACTIVITY[config.activityType] || "main";
  var visibleCategories = CATEGORIES_BY_ACTIVITY[config.activityType] || CATEGORY_KEYS;
  var [category, setCategory] = useState(recipe ? recipe.category : defaultCat);
  var [portionCount, setPortionCount] = useState(recipe ? recipe.portionCount : 1);
  var [sellingPrice, setSellingPrice] = useState(recipe ? recipe.sellingPrice : 0);
  var [tvaRate, setTvaRate] = useState(recipe ? recipe.tvaRate : 0.21);
  var [monthlySales, setMonthlySales] = useState(recipe ? recipe.monthlySales : 0);
  var [seasonProfile, setSeasonProfile] = useState(recipe ? (recipe.seasonProfile || "flat") : "flat");

  /* Step 2 fields — ingredients (local working copies with resolved data) */
  var [ingredients, setIngredients] = useState(function () {
    if (!recipe || !recipe.ingredients) return [];
    return recipe.ingredients.map(function (ri) {
      var reg = resolveIngredient(ri, registry);
      return { id: ri.id || makeId("ri"), ingredientId: ri.ingredientId || null, name: reg.name, unitCost: reg.unitCost, qty: ri.qty || 0, unit: reg.unit, _fromRegistry: !!ri.ingredientId };
    });
  });

  /* Step 3 fields — costs */
  var [laborEntries, setLaborEntries] = useState(
    recipe && recipe.laborEntries && recipe.laborEntries.length > 0
      ? recipe.laborEntries.slice()
      : recipe && recipe.prepTimeMinutes > 0
        ? [{ id: makeId("lab"), role: "", minutes: recipe.prepTimeMinutes, hourlyRate: config.hourlyRate || 18 }]
        : []
  );
  var [energyEntries, setEnergyEntries] = useState(
    recipe && recipe.energyEntries && recipe.energyEntries.length > 0
      ? recipe.energyEntries.slice()
      : recipe && recipe.energyType && recipe.energyType !== "none" && recipe.prepTimeMinutes > 0
        ? [{ id: makeId("nrg"), type: recipe.energyType, minutes: recipe.prepTimeMinutes }]
        : []
  );
  var [packagingCost, setPackagingCost] = useState(recipe ? recipe.packagingCost : 0);
  var [wastePct, setWastePct] = useState(recipe ? recipe.wastePct : 0);

  /* Build registry options for ingredient dropdown */
  var registryOptions = useMemo(function () {
    var opts = (registry || []).map(function (reg) {
      return { value: reg.id, label: reg.name + " (" + reg.unit + " \u2014 " + eur(reg.unitCost) + "/" + reg.unit + ")" };
    });
    opts.push({ value: "__new__", label: lk === "fr" ? "+ Cr\u00e9er un nouvel ingr\u00e9dient..." : "+ Create a new ingredient..." });
    return opts;
  }, [registry, lk]);

  function addIngredient() {
    setIngredients(function (prev) {
      var hasEmpty = prev.some(function (ing) { return !ing._fromRegistry && !(ing.name || "").trim(); });
      if (hasEmpty) return prev;
      return prev.concat([{ id: makeId("ri"), ingredientId: null, name: "", unitCost: 0, qty: 0, unit: "kg", _fromRegistry: false }]);
    });
  }

  function selectRegistryIngredient(idx, regId) {
    setIngredients(function (prev) {
      var nc = prev.slice();
      if (regId === "__new__" || !regId) {
        nc[idx] = Object.assign({}, nc[idx], { ingredientId: null, name: "", unitCost: 0, unit: "kg", _fromRegistry: false });
      } else {
        var reg = (registry || []).find(function (r) { return r.id === regId; });
        if (reg) {
          nc[idx] = Object.assign({}, nc[idx], { ingredientId: reg.id, name: reg.name, unitCost: reg.unitCost, unit: reg.unit, _fromRegistry: true });
        }
      }
      return nc;
    });
  }

  function updateIngredient(idx, field, value) {
    setIngredients(function (prev) {
      var nc = prev.slice();
      var v = value;
      /* Clamp cost and qty to non-negative */
      if (field === "unitCost" || field === "qty") v = Math.max(0, v || 0);
      nc[idx] = Object.assign({}, nc[idx], { [field]: v });
      return nc;
    });
  }

  function removeIngredient(idx) {
    setIngredients(function (prev) { return prev.filter(function (_, i) { return i !== idx; }); });
  }

  /* Labor entry CRUD */
  function addLaborEntry() {
    setLaborEntries(function (prev) {
      return prev.concat([{ id: makeId("lab"), role: "", minutes: 0, hourlyRate: config.hourlyRate || 18 }]);
    });
  }
  function updateLaborEntry(idx, field, value) {
    setLaborEntries(function (prev) {
      var nc = prev.slice();
      var v = value;
      if (field === "minutes" || field === "hourlyRate") v = Math.max(0, v || 0);
      nc[idx] = Object.assign({}, nc[idx], { [field]: v });
      return nc;
    });
  }
  function removeLaborEntry(idx) {
    setLaborEntries(function (prev) { return prev.filter(function (_, i) { return i !== idx; }); });
  }

  /* Energy entry CRUD */
  var energyTypeOptions = Object.keys(ENERGY_TYPES).filter(function (k) { return k !== "none"; }).map(function (ek) {
    return { value: ek, label: ENERGY_TYPES[ek].label[lk] };
  });
  function addEnergyEntry() {
    setEnergyEntries(function (prev) {
      return prev.concat([{ id: makeId("nrg"), type: "oven", minutes: 0 }]);
    });
  }
  function updateEnergyEntry(idx, field, value) {
    setEnergyEntries(function (prev) {
      var nc = prev.slice();
      var v = value;
      if (field === "minutes") v = Math.max(0, v || 0);
      nc[idx] = Object.assign({}, nc[idx], { [field]: v });
      return nc;
    });
  }
  function removeEnergyEntry(idx) {
    setEnergyEntries(function (prev) { return prev.filter(function (_, i) { return i !== idx; }); });
  }

  /* Summary calculations — use local ingredient data directly */
  var ingredientTotal = 0;
  ingredients.forEach(function (ing) { ingredientTotal += (ing.unitCost || 0) * (ing.qty || 0); });
  var laborCost = calcLaborCost(laborEntries);
  var energyCost = calcEnergyCost(energyEntries);
  var subtotal = ingredientTotal + laborCost + energyCost + packagingCost;
  var wasteAmount = subtotal * ((wastePct || 0) / 100);
  var totalCost = subtotal + wasteAmount;
  var unitCost = totalCost / (portionCount || 1);
  var materialCostPctVal = sellingPrice > 0 ? (unitCost / sellingPrice) * 100 : 0;
  var marginVal = sellingPrice - unitCost;

  function handleSave() {
    /* Sync new ingredients to registry, convert all to references */
    var newRegistryItems = [];
    var savedIngredients = ingredients.map(function (ing) {
      if (ing._fromRegistry && ing.ingredientId) {
        /* Already in registry — just save reference + qty */
        return { ingredientId: ing.ingredientId, qty: ing.qty || 0 };
      }
      /* New ingredient — add to registry, then reference */
      var key = (ing.name || "").toLowerCase().trim();
      if (!key) return { ingredientId: ing.ingredientId, qty: ing.qty || 0 };
      /* Check if name already exists in registry */
      var existing = (registry || []).find(function (r) { return r.name.toLowerCase().trim() === key; });
      if (existing) {
        return { ingredientId: existing.id, qty: ing.qty || 0 };
      }
      /* Also check already-queued new items in this save */
      var queued = newRegistryItems.find(function (r) { return r.name.toLowerCase().trim() === key; });
      if (queued) {
        return { ingredientId: queued.id, qty: ing.qty || 0 };
      }
      var newReg = { id: makeId("ing"), name: ing.name, unitCost: ing.unitCost || 0, unit: ing.unit || "kg" };
      newRegistryItems.push(newReg);
      return { ingredientId: newReg.id, qty: ing.qty || 0 };
    });

    /* Push new registry items upstream */
    if (newRegistryItems.length > 0 && onRegistryUpdate) {
      onRegistryUpdate(function (prev) { return (prev || []).concat(newRegistryItems); });
    }

    onSave({
      name: name || (lk === "fr" ? "Nouvelle recette" : "New recipe"),
      category: category,
      ingredients: savedIngredients,
      laborEntries: laborEntries,
      energyEntries: energyEntries,
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
    setSellingPrice(sug.sellingPrice);
    setTvaRate(sug.tvaRate);
    if (sug.portionCount) setPortionCount(sug.portionCount);
    setIngredients(sug.ingredients.map(function (ing) {
      var ingName = typeof ing.name === "object" ? ing.name[lk] : ing.name;
      /* Check if this ingredient already exists in the registry */
      var key = ingName.toLowerCase().trim();
      var existing = (registry || []).find(function (r) { return r.name.toLowerCase().trim() === key; });
      if (existing) {
        return { id: makeId("ri"), ingredientId: existing.id, name: existing.name, unitCost: existing.unitCost, qty: ing.qty, unit: existing.unit, _fromRegistry: true };
      }
      return { id: makeId("ri"), ingredientId: null, name: ingName, unitCost: ing.cost, qty: ing.qty, unit: ing.unit, _fromRegistry: false };
    }));
    /* Migrate suggestion's prepTimeMinutes to laborEntries */
    if (sug.laborEntries) {
      setLaborEntries(sug.laborEntries.slice());
    } else if (sug.prepTimeMinutes) {
      setLaborEntries([{ id: makeId("lab"), role: "", minutes: sug.prepTimeMinutes, hourlyRate: config.hourlyRate || 18 }]);
    }
    /* Migrate suggestion's energyEntries */
    if (sug.energyEntries) {
      setEnergyEntries(sug.energyEntries.slice());
    } else {
      setEnergyEntries([]);
    }
  }

  var stepTitles = [
    { title: lk === "fr" ? "Informations de base" : "Basic information", desc: lk === "fr" ? "Décrivez votre recette ou produit." : "Describe your recipe or product." },
    { title: lk === "fr" ? "Ingrédients" : "Ingredients", desc: lk === "fr" ? "Quantités et coûts pour une recette complète (" + (portionCount || 1) + (portionCount > 1 ? " portions" : " portion") + ")." : "Quantities and costs for one full recipe (" + (portionCount || 1) + (portionCount > 1 ? " portions" : " portion") + ")." },
    { title: lk === "fr" ? "Coûts et résumé" : "Costs & summary", desc: lk === "fr" ? "Main d'œuvre, énergie, emballage et vue d'ensemble." : "Labor, energy, packaging and overview." },
  ];

  return (
    <Modal open onClose={onClose} size="lg" height={520}>
      {/* Progress bar only */}
      <div style={{ padding: "0 var(--sp-5)", paddingTop: "var(--sp-4)" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2].map(function (i) {
            return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "var(--brand)" : "var(--bg-hover)", transition: "background 0.2s" }} />;
          })}
        </div>
      </div>

      <div className="custom-scroll" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-5)", scrollbarWidth: "thin", scrollbarColor: "var(--border-strong) transparent" }}>
        {/* Step title inside scroll */}
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 4, textAlign: "center" }}>
          {stepTitles[step].title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: "var(--sp-4)", textAlign: "center" }}>
          {stepTitles[step].desc}
        </div>

        {/* Step 1 — Basic info */}
        {step === 0 ? (
          <div>

            {/* Suggestion templates — only when creating */}
            {!recipe ? (
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Sparkle size={12} weight="fill" />
                  {lk === "fr" ? "Démarrer depuis un modèle" : "Quick-start template"}
                </div>
                <div className="resp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-2)" }}>
                  {(SUGGESTIONS_BY_CATEGORY[category] || []).map(function (sug, si) {
                    var catMeta = RECIPE_CATEGORIES[category] || {};
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
                          {sug.ingredients.length} {lk === "fr" ? "ingr." : "ingr."} &middot; {eur(sug.sellingPrice)}{sug.portionCount > 1 ? " \u00b7 " + sug.portionCount + " port." : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={labelStyle}>{lk === "fr" ? "Nom" : "Name"} <span style={{ color: "var(--color-error)" }}>*</span></label>
              <input value={name} onChange={function (e) { setName(e.target.value); }} placeholder={(function () {
                var ph = {
                  starter: { fr: "ex. Soupe de saison", en: "e.g. Seasonal soup" },
                  main: { fr: "ex. Risotto aux champignons", en: "e.g. Mushroom risotto" },
                  dessert: { fr: "ex. Fondant au chocolat", en: "e.g. Chocolate lava cake" },
                  drink: { fr: "ex. Smoothie vert", en: "e.g. Green smoothie" },
                  snack: { fr: "ex. Granola maison", en: "e.g. Homemade granola" },
                  product: { fr: "ex. Bougie parfumée", en: "e.g. Scented candle" },
                };
                var p = ph[category] || ph.main;
                return p[lk];
              })()} style={inputStyle} />
            </div>

            {visibleCategories.length > 1 ? (
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <label style={labelStyle}>{lk === "fr" ? "Catégorie" : "Category"}</label>
              <div className="resp-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--sp-2)" }}>
                {visibleCategories.map(function (ck) {
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
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Prix de vente (HTVA)" : "Selling price (excl. VAT)"}</label>
                <div style={sellingPrice <= 0 && monthlySales > 0 ? { border: "1px solid var(--color-warning)", borderRadius: "var(--r-md)" } : undefined}>
                  <CurrencyInput value={sellingPrice} onChange={setSellingPrice} suffix="€" width="100%" decimals={2} />
                </div>
                <div style={{ fontSize: 10, color: sellingPrice <= 0 && monthlySales > 0 ? "var(--color-warning)" : "var(--text-faint)", marginTop: 3 }}>
                  {sellingPrice <= 0 && monthlySales > 0
                    ? (lk === "fr" ? "Définissez un prix pour calculer la marge" : "Set a price to calculate margin")
                    : (lk === "fr" ? "Par portion" : "Per portion")}
                </div>
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
                <div style={hintStyle}>{lk === "fr" ? "Combien de portions cette recette produit" : "How many portions this recipe makes"}</div>
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Ventes estimées / mois" : "Estimated sales / month"}</label>
                <div style={monthlySales > 0 && monthlySales < portionCount ? { border: "1px solid var(--color-error)", borderRadius: "var(--r-md)" } : undefined}>
                  <NumberField value={monthlySales} onChange={setMonthlySales} min={0} max={99999} step={1} width="100%" />
                </div>
                <div style={{ fontSize: 10, color: monthlySales > 0 && monthlySales < portionCount ? "var(--color-error)" : "var(--text-faint)", marginTop: 3 }}>
                  {monthlySales > 0 && monthlySales < portionCount
                    ? (lk === "fr"
                      ? "Inférieur au nombre de portions (" + portionCount + ") — moins d'une recette par mois"
                      : "Below portion count (" + portionCount + ") — less than one recipe per month")
                    : (lk === "fr" ? "Nombre de portions vendues" : "Number of portions sold")}
                </div>
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
                  var isLinked = ing._fromRegistry && !!ing.ingredientId;
                  var lineTotal = (ing.unitCost || 0) * (ing.qty || 0);
                  return (
                    <div key={ing.id || idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 32px", gap: "var(--sp-2)", alignItems: "center" }}>
                      {isLinked ? (
                        <SelectDropdown
                          value={ing.ingredientId}
                          onChange={function (v) { selectRegistryIngredient(idx, v); }}
                          options={registryOptions}
                          height={36}
                        />
                      ) : (
                        <input value={ing.name} onChange={function (e) { updateIngredient(idx, "name", e.target.value); }}
                          placeholder={lk === "fr" ? "Nouvel ingrédient" : "New ingredient"}
                          style={Object.assign({}, inputStyle, { height: 36, fontSize: 13 })} />
                      )}
                      <CurrencyInput value={ing.unitCost} onChange={function (v) { updateIngredient(idx, "unitCost", v); }} suffix={"€/" + (ing.unit || "kg")} width="100%" decimals={2} disabled={isLinked} />
                      <NumberField value={ing.qty} onChange={function (v) { updateIngredient(idx, "qty", v); }} min={0} max={99999} step={0.001} width="100%" />
                      {isLinked ? (
                        <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Badge color="gray" size="sm">{ing.unit}</Badge>
                        </div>
                      ) : (
                        <SelectDropdown value={ing.unit} onChange={function (v) { updateIngredient(idx, "unit", v); }} options={UNIT_OPTIONS} height={36} />
                      )}
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

            <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
              {(registry || []).length > 0 ? (
                <SelectDropdown
                  value=""
                  onChange={function (v) {
                    if (!v) return;
                    var reg = (registry || []).find(function (r) { return r.id === v; });
                    if (reg) {
                      setIngredients(function (prev) {
                        return prev.concat([{ id: makeId("ri"), ingredientId: reg.id, name: reg.name, unitCost: reg.unitCost, qty: 0, unit: reg.unit, _fromRegistry: true }]);
                      });
                    }
                  }}
                  options={[{ value: "", label: lk === "fr" ? "Ajouter depuis le registre..." : "Add from registry..." }].concat(
                    (registry || []).filter(function (reg) {
                      /* Hide ingredients already in the list */
                      return !ingredients.some(function (ing) { return ing.ingredientId === reg.id; });
                    }).map(function (reg) {
                      return { value: reg.id, label: reg.name + " (" + eur(reg.unitCost) + "/" + reg.unit + ")" };
                    })
                  )}
                  height={36}
                />
              ) : null}
              <Button color="tertiary" size="md" onClick={addIngredient} iconLeading={<Plus size={14} weight="bold" />}>
                {lk === "fr" ? "Nouvel ingrédient" : "New ingredient"}
              </Button>
            </div>

            {ingredientTotal > 0 ? (
              <div style={{ marginTop: "var(--sp-3)", padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{lk === "fr" ? "Total ingrédients (1 recette)" : "Total ingredients (1 recipe)"}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(ingredientTotal)}</span>
                </div>
                {(portionCount || 1) > 1 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--text-faint)" }}>{lk === "fr" ? "Coût par portion" : "Cost per portion"}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(ingredientTotal / (portionCount || 1))}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Step 3 — Costs + Summary */}
        {step === 2 ? (
          <div>
            {/* ── Labor entries ── */}
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)" }}>
                {lk === "fr" ? "Main d'œuvre" : "Labor"}
              </div>
              {laborEntries.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
                  {/* Header row */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 32px", gap: "var(--sp-2)", alignItems: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Rôle" : "Role"}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Temps (min)" : "Time (min)"}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Tarif/h" : "Rate/h"}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Coût" : "Cost"}</div>
                    <div />
                  </div>
                  {laborEntries.map(function (entry, idx) {
                    var entryCost = ((entry.minutes || 0) / 60) * (entry.hourlyRate || 0);
                    return (
                      <div key={entry.id || idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 32px", gap: "var(--sp-2)", alignItems: "center" }}>
                        <SelectDropdown
                          value={entry.salId || ""}
                          onChange={function (v) {
                            var sal = (sals || []).find(function (s) { return String(s.id) === String(v); });
                            updateLaborEntry(idx, "salId", v);
                            updateLaborEntry(idx, "role", sal ? sal.role : "");
                            if (sal) {
                              var monthlyCost = sal.type === "independant" ? sal.net : sal.net / (1 - 0.1307 - 0.1723) * (1 + 0.2507);
                              var hourlyRate = Math.round(monthlyCost / 160 * 100) / 100;
                              updateLaborEntry(idx, "hourlyRate", hourlyRate);
                            }
                          }}
                          options={[{ value: "", label: lk === "fr" ? "Sélectionner..." : "Select..." }].concat((sals || []).map(function (s) { return { value: String(s.id), label: s.role }; }))}
                          height={36}
                          placeholder={lk === "fr" ? "Membre de l'équipe" : "Team member"}
                        />
                        <NumberField value={entry.minutes} onChange={function (v) { updateLaborEntry(idx, "minutes", v); }} min={0} max={9999} step={1} width="100%" />
                        <CurrencyInput value={entry.hourlyRate} onChange={function (v) { updateLaborEntry(idx, "hourlyRate", v); }} suffix="€/h" width="100%" decimals={2} />
                        <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>{eur(entryCost)}</span>
                        <button type="button" onClick={function () { removeLaborEntry(idx); }}
                          style={{ width: 32, height: 32, border: "none", borderRadius: "var(--r-sm)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}
                          onMouseEnter={function (e) { e.currentTarget.style.color = "var(--color-error)"; }}
                          onMouseLeave={function (e) { e.currentTarget.style.color = "var(--text-muted)"; }}>
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <Button color="tertiary" size="md" onClick={addLaborEntry} iconLeading={<Plus size={14} weight="bold" />}>
                {lk === "fr" ? "Ajouter un poste" : "Add a role"}
              </Button>
            </div>

            {/* ── Energy entries ── */}
            <div style={{ marginBottom: "var(--sp-4)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-2)" }}>
                {lk === "fr" ? "Énergie" : "Energy"}
              </div>
              {energyEntries.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
                  {/* Header row */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 32px", gap: "var(--sp-2)", alignItems: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Type" : "Type"}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Durée (min)" : "Duration (min)"}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Coût/h" : "Cost/h"}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase" }}>{lk === "fr" ? "Total" : "Total"}</div>
                    <div />
                  </div>
                  {energyEntries.map(function (entry, idx) {
                    var meta = ENERGY_TYPES[entry.type] || ENERGY_TYPES.none;
                    var rate = entry.costPerHour != null ? entry.costPerHour : meta.costPerHour;
                    var entryCost = ((entry.minutes || 0) / 60) * rate;
                    return (
                      <div key={entry.id || idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 32px", gap: "var(--sp-2)", alignItems: "center" }}>
                        <SelectDropdown value={entry.type} onChange={function (v) {
                          var newMeta = ENERGY_TYPES[v] || ENERGY_TYPES.none;
                          updateEnergyEntry(idx, "type", v);
                          updateEnergyEntry(idx, "costPerHour", newMeta.costPerHour);
                        }} options={energyTypeOptions} height={36} />
                        <NumberField value={entry.minutes} onChange={function (v) { updateEnergyEntry(idx, "minutes", v); }} min={0} max={9999} step={1} width="100%" />
                        <CurrencyInput value={rate} onChange={function (v) { updateEnergyEntry(idx, "costPerHour", v); }} suffix="€/h" width="100%" decimals={2} />
                        <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>{eur(entryCost)}</span>
                        <button type="button" onClick={function () { removeEnergyEntry(idx); }}
                          style={{ width: 32, height: 32, border: "none", borderRadius: "var(--r-sm)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}
                          onMouseEnter={function (e) { e.currentTarget.style.color = "var(--color-error)"; }}
                          onMouseLeave={function (e) { e.currentTarget.style.color = "var(--text-muted)"; }}>
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <Button color="tertiary" size="md" onClick={addEnergyEntry} iconLeading={<Plus size={14} weight="bold" />}>
                {lk === "fr" ? "Ajouter une source" : "Add a source"}
              </Button>
            </div>

            {/* ── Packaging + Waste ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Emballage (par portion)" : "Packaging (per portion)"}</label>
                <CurrencyInput value={packagingCost} onChange={setPackagingCost} suffix="€" width="100%" decimals={2} />
              </div>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Perte / gaspillage (%)" : "Waste / loss (%)"}</label>
                <div style={wastePct > 15 ? { border: "1px solid var(--color-warning)", borderRadius: "var(--r-md)" } : undefined}>
                  <NumberField value={wastePct} onChange={setWastePct} min={0} max={100} step={1} width="100%" suffix="%" />
                </div>
                <div style={{ fontSize: 10, color: wastePct > 15 ? "var(--color-warning)" : "var(--text-faint)", marginTop: 3 }}>
                  {wastePct > 15
                    ? (lk === "fr" ? "Taux élevé — la moyenne est de 5 à 10% en restauration" : "High rate — average is 5-10% in food service")
                    : (lk === "fr" ? "Épluchures, casse, évaporation" : "Peeling, breakage, evaporation")}
                </div>
              </div>
            </div>

            {/* ── Summary card ── */}
            <div style={{ padding: "var(--sp-4)", background: "var(--bg-accordion)", borderRadius: "var(--r-lg)", border: "1px solid var(--border-light)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: "var(--sp-3)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {lk === "fr" ? "Résumé des coûts" : "Cost summary"}
              </div>

              {/* Ingredients */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Ingrédients (1 recette)" : "Ingredients (1 recipe)"}</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(ingredientTotal)}</span>
              </div>

              {/* Labor with sub-lines */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: laborEntries.length > 0 ? 0 : 4 }}>
                <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Main d'œuvre" : "Labor"}</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(laborCost)}</span>
              </div>
              {laborEntries.length > 0 ? (
                <div style={{ marginBottom: 4 }}>
                  {laborEntries.map(function (entry) {
                    var ec = ((entry.minutes || 0) / 60) * (entry.hourlyRate || 0);
                    var roleLabel = entry.role || (lk === "fr" ? "Sans rôle" : "No role");
                    return (
                      <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, paddingLeft: "var(--sp-3)", color: "var(--text-faint)", marginTop: 2 }}>
                        <span>{roleLabel} ({entry.minutes || 0} min × {eur(entry.hourlyRate || 0)}/h)</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(ec)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Energy with sub-lines */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: energyEntries.length > 0 ? 0 : 4 }}>
                <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Énergie" : "Energy"}</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(energyCost)}</span>
              </div>
              {energyEntries.length > 0 ? (
                <div style={{ marginBottom: 4 }}>
                  {energyEntries.map(function (entry) {
                    var meta = ENERGY_TYPES[entry.type] || ENERGY_TYPES.none;
                    var rate = entry.costPerHour != null ? entry.costPerHour : meta.costPerHour;
                    var ec = ((entry.minutes || 0) / 60) * rate;
                    return (
                      <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, paddingLeft: "var(--sp-3)", color: "var(--text-faint)", marginTop: 2 }}>
                        <span>{meta.label[lk]} ({entry.minutes || 0} min)</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(ec)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Packaging */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Emballage" : "Packaging"}</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(packagingCost)}</span>
              </div>

              {/* Subtotal */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Sous-total" : "Subtotal"}</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(subtotal)}</span>
              </div>

              {/* Waste */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Perte / gaspillage (" + (wastePct || 0) + "%)" : "Waste / loss (" + (wastePct || 0) + "%)"}</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>+{eur(wasteAmount)}</span>
              </div>

              {/* Divider + Total recipe cost */}
              <div style={{ borderTop: "1px solid var(--border-light)", marginTop: "var(--sp-2)", paddingTop: "var(--sp-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{lk === "fr" ? "Coût total (1 recette)" : "Total cost (1 recipe)"}</span>
                  <span style={{ fontWeight: 700, fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(totalCost)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Coût par portion (\u00f7 " + (portionCount || 1) + ")" : "Cost per portion (\u00f7 " + (portionCount || 1) + ")"}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(unitCost)}</span>
                </div>
              </div>

              {/* Divider + Selling price / Margin / Material cost */}
              {sellingPrice > 0 ? (
                <div style={{ borderTop: "1px solid var(--border-light)", marginTop: "var(--sp-2)", paddingTop: "var(--sp-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Prix de vente" : "Selling price"}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(sellingPrice)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Marge par portion" : "Margin per portion"}</span>
                    <span style={{ fontWeight: 700, color: marginVal >= 0 ? "var(--color-success)" : "var(--color-error)", fontVariantNumeric: "tabular-nums" }}>{eur(marginVal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Coût matière" : "Material cost"}</span>
                    <Badge color={materialCostPctVal < 25 ? "success" : materialCostPctVal <= 35 ? "warning" : "error"} size="sm">
                      {materialCostPctVal.toFixed(1)}%
                    </Badge>
                  </div>
                  {/* Contextual warnings */}
                  {marginVal < 0 ? (
                    <div style={{ marginTop: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-error-bg)", borderRadius: "var(--r-md)", fontSize: 11, color: "var(--color-error)", fontWeight: 500 }}>
                      {lk === "fr" ? "Marge négative — le coût dépasse le prix de vente. Réduisez les coûts ou augmentez le prix." : "Negative margin — cost exceeds selling price. Reduce costs or increase the price."}
                    </div>
                  ) : materialCostPctVal > 35 ? (
                    <div style={{ marginTop: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)", background: "var(--color-warning-bg)", borderRadius: "var(--r-md)", fontSize: 11, color: "var(--color-warning)", fontWeight: 500 }}>
                      {lk === "fr" ? "Coût matière élevé (" + materialCostPctVal.toFixed(0) + "%) — l'objectif est généralement < 30% en restauration." : "High material cost (" + materialCostPctVal.toFixed(0) + "%) — target is usually < 30% in food service."}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Material cost gauge */}
            {sellingPrice > 0 ? (
              <div style={{ marginTop: "var(--sp-3)" }}>
                <MaterialCostGauge pct={materialCostPctVal} lk={lk} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

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
        {(function () {
          /* Step 0 validation: name, price, portions, sales */
          var step0Valid = name.trim() && portionCount > 0;
          /* Step 1 validation: at least 1 ingredient with cost > 0 and qty > 0 */
          var step1Valid = ingredients.length > 0 && ingredients.every(function (ing) { return (ing._fromRegistry || (ing.name || "").trim()) && (ing.unitCost || 0) > 0 && (ing.qty || 0) > 0; });
          /* Step 2 validation: always valid (labor/energy/packaging are optional) */
          var canAdvance = step === 0 ? step0Valid : step === 1 ? step1Valid : true;
          /* Save validation: all steps must be valid */
          var canSave = step0Valid && step1Valid;

          return step < 2 ? (
            <Button color="primary" size="lg" isDisabled={!canAdvance} onClick={function () { setStep(function (s) { return s + 1; }); }}>
              {lk === "fr" ? "Suivant" : "Next"}
            </Button>
          ) : (
            <Button color="primary" size="lg" isDisabled={!canSave} onClick={handleSave} iconLeading={<Plus size={14} weight="bold" />}>
              {recipe ? (lk === "fr" ? "Enregistrer" : "Save") : (lk === "fr" ? "Ajouter" : "Add")}
            </Button>
          );
        })()}
      </ModalFooter>
    </Modal>
  );
}


/* ══════════════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════════════ */
export default function ProductionPage({ appCfg, production, setProduction, streams, setStreams, costs, setCosts, sals, stocks, setStocks, chartPalette, chartPaletteMode, onChartPaletteChange, accentRgb }) {
  var { lang } = useLang();
  var lk = lang === "en" ? "en" : "fr";
  var { devMode } = useDevMode();

  /* ── Run registry migration once on mount ── */
  useEffect(function () {
    setProduction(function (prev) {
      if (!prev || prev._registryMigrated) return prev;
      return migrateToRegistry(prev);
    });
  }, []);

  var cfg = production ? (production._registryMigrated ? production : migrateToRegistry(production)) : {};
  var config = Object.assign({}, DEFAULT_PRODUCTION_CONFIG, cfg.config || {});

  /* ── Ingredient registry ── */
  var ingredientRegistry = cfg.ingredients || [];

  function cfgSet(key, val) {
    setProduction(function (prev) { var nc = Object.assign({}, prev); nc[key] = val; return nc; });
  }

  function cfgSetIngredients(fn) {
    setProduction(function (prev) {
      var nc = Object.assign({}, prev);
      nc.ingredients = fn(nc.ingredients || []);
      return nc;
    });
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
  var [ingRecipeFilter, setIngRecipeFilter] = useState("all");
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
    /* Enhancement 5: track price history */
    if (nc[idx].sellingPrice !== data.sellingPrice) {
      var history = (nc[idx].priceHistory || []).slice();
      history.push({ date: new Date().toISOString().slice(0, 10), sellingPrice: data.sellingPrice });
      data.priceHistory = history;
    } else {
      data.priceHistory = nc[idx].priceHistory || [];
    }
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
          return Object.assign({}, cat, { items: (cat.items || []).filter(function (c) { return !c._linkedProduction || c._linkedProduction.indexOf(removed.id) !== 0; }) });
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
    /* Ingredients are references (ingredientId + qty) — just shallow-clone */
    clone.ingredients = (clone.ingredients || []).map(function (ing) { return Object.assign({}, ing); });
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
          return Object.assign({}, cat, { items: (cat.items || []).filter(function (c) { return !c._linkedProduction || c._linkedProduction.indexOf(rem.id) !== 0; }) });
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
        if (!found) {
          var newItem = {
            id: makeId("str"), behavior: "per_transaction", price: recipe.sellingPrice, qty: recipe.monthlySales,
            l: recipe.name, _linkedProduction: recipeId, _readOnly: true, _linkedPage: "production",
            tva: recipe.tvaRate || 0.21, growthRate: 0, seasonProfile: recipe.seasonProfile || "flat",
          };
          if (cats.length > 0) {
            cats[0] = Object.assign({}, cats[0], { items: (cats[0].items || []).concat([newItem]) });
          } else {
            cats.push({ cat: lk === "fr" ? "Revenus" : "Revenue", items: [newItem] });
          }
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

    // Charge links — costs is [{ cat, items }]
    // Helper to upsert a single linked cost
    function upsertCost(linkKey, label, amount, pcmn) {
      if (amount > 0) {
        setCosts(function (prev) {
          var cats = (prev || []).map(function (cat) {
            var existIdx = -1;
            (cat.items || []).forEach(function (c, i) { if (c._linkedProduction === linkKey) existIdx = i; });
            var linked = {
              id: existIdx >= 0 ? cat.items[existIdx].id : makeId("cost"),
              l: label, a: Math.round(amount * 100) / 100, freq: "monthly", pcmn: pcmn, pu: false, u: 1,
              _linkedProduction: linkKey, _readOnly: true, _linkedPage: "production",
            };
            if (existIdx >= 0) {
              var ni = cat.items.slice(); ni[existIdx] = Object.assign({}, ni[existIdx], linked);
              return Object.assign({}, cat, { items: ni });
            }
            return cat;
          });
          var found = false;
          cats.forEach(function (cat) { (cat.items || []).forEach(function (c) { if (c._linkedProduction === linkKey) found = true; }); });
          if (!found) {
            var newCost = { id: makeId("cost"), l: label, a: Math.round(amount * 100) / 100, freq: "monthly", pcmn: pcmn, pu: false, u: 1, _linkedProduction: linkKey, _readOnly: true, _linkedPage: "production" };
            if (cats.length > 0) { cats[0] = Object.assign({}, cats[0], { items: (cats[0].items || []).concat([newCost]) }); }
            else { cats.push({ cat: lk === "fr" ? "Charges" : "Costs", items: [newCost] }); }
          }
          return cats;
        });
      } else {
        setCosts(function (prev) {
          return (prev || []).map(function (cat) {
            return Object.assign({}, cat, { items: (cat.items || []).filter(function (c) { return c._linkedProduction !== linkKey; }) });
          });
        });
      }
    }

    var portions = recipe.portionCount || 1;
    var sales = recipe.monthlySales || 0;

    // Ingredients charge (PCMN 6000) — includes waste
    var ingCost = calcIngredientCost(recipe.ingredients, ingredientRegistry);
    var monthlyIngCost = ((ingCost * (1 + (recipe.wastePct || 0) / 100)) / portions) * sales;
    upsertCost(recipeId + "_ing", (lk === "fr" ? "Ingrédients \u2014 " : "Ingredients \u2014 ") + recipe.name, monthlyIngCost, "6000");

    // Packaging charge (PCMN 6010)
    var monthlyPkgCost = (recipe.packagingCost || 0) * sales;
    upsertCost(recipeId + "_pkg", (lk === "fr" ? "Emballage \u2014 " : "Packaging \u2014 ") + recipe.name, monthlyPkgCost, "6010");
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
      var fc = calcMaterialCostPct(r, config, ingredientRegistry);
      if ((r.sellingPrice || 0) > 0) { sum += fc; counted++; }
    });
    return counted > 0 ? sum / counted : 0;
  }, [recipes, config, ingredientRegistry]);

  var avgMargin = useMemo(function () {
    if (recipes.length === 0) return 0;
    var sum = 0;
    var counted = 0;
    recipes.forEach(function (r) {
      if ((r.sellingPrice || 0) > 0) { sum += calcMargin(r, config, ingredientRegistry); counted++; }
    });
    return counted > 0 ? sum / counted : 0;
  }, [recipes, config, ingredientRegistry]);

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


  /* ── Top recipe by margin ── */
  var topRecipe = useMemo(function () {
    var best = null;
    var bestMargin = -Infinity;
    recipes.forEach(function (r) {
      if ((r.sellingPrice || 0) <= 0) return;
      var m = calcMargin(r, config, ingredientRegistry);
      if (m > bestMargin) { bestMargin = m; best = r; }
    });
    if (!best) return null;
    return { recipe: best, margin: bestMargin, materialCostPct: calcMaterialCostPct(best, config, ingredientRegistry) };
  }, [recipes, config, ingredientRegistry]);

  /* ── Enhancement 2: Margin by category ── */
  var marginByCategory = useMemo(function () {
    var dist = {};
    recipes.forEach(function (r) {
      var cat = r.category || "main";
      var margin = calcMargin(r, config, ingredientRegistry) * (r.monthlySales || 0);
      dist[cat] = (dist[cat] || 0) + margin;
    });
    return dist;
  }, [recipes, config, ingredientRegistry]);

  /* ── Enhancement 3: Ingredient consumption (from registry) ── */
  var ingredientConsumption = useMemo(function () {
    var map = {};
    recipes.forEach(function (r) {
      var sales = r.monthlySales || 0;
      (r.ingredients || []).forEach(function (ri) {
        var reg = resolveIngredient(ri, ingredientRegistry);
        var key = ri.ingredientId || (reg.name || "").toLowerCase().trim();
        if (!key) return;
        if (!map[key]) map[key] = { id: ri.ingredientId || null, name: reg.name, unit: reg.unit, unitCost: reg.unitCost || 0, totalQty: 0, totalCost: 0, recipeCount: 0, recipeNames: [] };
        map[key].totalQty += (ri.qty || 0) * sales;
        map[key].totalCost += (reg.unitCost || 0) * (ri.qty || 0) * sales;
        map[key].recipeCount += 1;
        if (r.name && map[key].recipeNames.indexOf(r.name) < 0) map[key].recipeNames.push(r.name);
      });
    });
    return Object.values(map).sort(function (a, b) { return b.totalCost - a.totalCost; });
  }, [recipes, ingredientRegistry]);

  var ingredientTotalCost = useMemo(function () {
    var s = 0;
    ingredientConsumption.forEach(function (ic) { s += ic.totalCost; });
    return s;
  }, [ingredientConsumption]);

  /* ── Stock linking: create stock item from ingredient ── */
  function createStockFromIngredient(reg) {
    var ic = ingredientConsumption.find(function (c) { return c.id === reg.id; });
    var monthlyConsumption = ic ? Math.round(ic.totalQty) : 0;
    var newStock = {
      id: makeId("st"),
      name: reg.name,
      category: "raw",
      unitCost: reg.unitCost || 0,
      sellingPrice: 0,
      quantity: monthlyConsumption * 2,
      monthlySales: monthlyConsumption,
      minStock: Math.round(monthlyConsumption * 0.5),
      reorderQty: monthlyConsumption,
      unit: reg.unit || "kg",
      _linkedIngredient: reg.id,
      _linkedPage: "production",
    };
    if (setStocks) {
      setStocks(function (prev) { return (prev || []).concat([newStock]); });
    }
    /* Save stockId back to ingredient registry */
    cfgSetIngredients(function (prev) {
      return prev.map(function (r) {
        if (r.id === reg.id) return Object.assign({}, r, { stockId: newStock.id });
        return r;
      });
    });
  }

  /* Find linked stock item for an ingredient */
  function findLinkedStock(reg) {
    if (!reg.stockId || !stocks) return null;
    return (stocks || []).find(function (s) { return s.id === reg.stockId; }) || null;
  }

  /* Sync production consumption to linked stock items */
  useEffect(function () {
    if (!stocks || !setStocks || ingredientConsumption.length === 0) return;
    var updates = {};
    ingredientConsumption.forEach(function (ic) {
      if (!ic.id) return;
      var reg = ingredientRegistry.find(function (r) { return r.id === ic.id; });
      if (!reg || !reg.stockId) return;
      updates[reg.stockId] = Math.round(ic.totalQty);
    });
    if (Object.keys(updates).length === 0) return;
    setStocks(function (prev) {
      var changed = false;
      var next = (prev || []).map(function (s) {
        if (updates[s.id] !== undefined && s.monthlySales !== updates[s.id]) {
          changed = true;
          return Object.assign({}, s, { monthlySales: updates[s.id] });
        }
        return s;
      });
      return changed ? next : prev;
    });
  }, [ingredientConsumption, ingredientRegistry]);

  /* ── Enhancement 4: Comparison state ── */
  var [comparison, setComparison] = useState(null);
  var [prodTab, setProdTab] = useState("recipes");

  /* ── Columns ── */
  var columns = useMemo(function () {
    return [
      {
        id: "name", accessorKey: "name",
        header: lk === "fr" ? "Nom" : "Name",
        enableSorting: true, meta: { align: "left", minWidth: 160, grow: true },
        cell: function (info) { return info.getValue() || "—"; },
        footer: function () {
          return (
            <>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{recipes.length} {lk === "fr" ? "productions" : "productions"}</span>
            </>
          );
        },
      },
      {
        id: "category",
        accessorFn: function (row) { return row.category || "main"; },
        header: lk === "fr" ? "Catégorie" : "Category",
        enableSorting: true, meta: { align: "left", formatPrint: function (v) { var m = RECIPE_CATEGORIES[v]; return m ? m.label[lk] : v; } },
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
        accessorFn: function (row) { return calcUnitCost(row, config, ingredientRegistry); },
        cell: function (info) { return eur(info.getValue()); },
      },
      {
        id: "laborCost",
        header: lk === "fr" ? "Main d'œuvre" : "Labor",
        enableSorting: true,
        accessorFn: function (row) { return calcLaborCost(migrateLaborEntries(row, config)) / (row.portionCount || 1); },
        cell: function (info) { var v = info.getValue(); return v > 0 ? eur(v) : <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>; },
        meta: { align: "right" },
      },
      {
        id: "sellingPrice",
        header: lk === "fr" ? "Prix de vente" : "Selling price",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.sellingPrice || 0; },
        cell: function (info) {
          var v = info.getValue();
          var row = info.row.original;
          var history = row.priceHistory || [];
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
              {history.length > 1 ? (
                <SeasonSpark coefs={history.map(function (h) { return h.sellingPrice; })} width={40} height={16} color="var(--text-muted)" />
              ) : null}
              {v > 0 ? eur(v) : <span style={{ color: "var(--text-faint)" }}>—</span>}
            </div>
          );
        },
      },
      {
        id: "materialCost",
        header: lk === "fr" ? "Coût matière %" : "Material cost %",
        enableSorting: true, meta: { align: "center", minWidth: 120, formatPrint: function (v) { return typeof v === "number" ? v.toFixed(1).replace(".", ",") + " %" : String(v); } },
        accessorFn: function (row) { return calcMaterialCostPct(row, config, ingredientRegistry); },
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
        accessorFn: function (row) { return calcMargin(row, config, ingredientRegistry); },
        cell: function (info) {
          var v = info.getValue();
          return <span style={{ fontWeight: 600, color: v >= 0 ? "var(--color-success)" : "var(--color-error)", fontVariantNumeric: "tabular-nums" }}>{eur(v)}</span>;
        },
      },
      {
        id: "tva",
        header: "TVA",
        enableSorting: true,
        accessorFn: function (row) { return row.tvaRate || 0.21; },
        cell: function (info) { var v = info.getValue(); return <Badge color="gray" size="sm">{Math.round(v * 100) + "%"}</Badge>; },
        meta: { align: "center", formatPrint: function (v) { return Math.round(v * 100) + "%"; } },
      },
      {
        id: "season",
        header: lk === "fr" ? "Saisonnalité" : "Seasonality",
        enableSorting: true,
        accessorFn: function (row) { return row.seasonProfile || "flat"; },
        cell: function (info) {
          var key = info.getValue();
          var profile = SEASONALITY_PROFILES[key] || SEASONALITY_PROFILES.flat;
          return <SeasonSpark coefs={profile.coefs} width={80} height={24} />;
        },
        meta: { align: "center", minWidth: 110, formatPrint: function (v) { var sp = SEASON_PROFILES.find(function (s) { return s.value === v; }); return sp ? sp.label[lk] : v; } },
      },
      {
        id: "monthlySales",
        header: lk === "fr" ? "Ventes/mois" : "Sales/mo",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return row.monthlySales || 0; },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? String(v) : <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
        },
      },
      {
        id: "portionsMonth",
        header: lk === "fr" ? "Portions/mois" : "Portions/mo",
        enableSorting: true, meta: { align: "right" },
        accessorFn: function (row) { return (row.monthlySales || 0) * (row.portionCount || 1); },
        cell: function (info) {
          var v = info.getValue();
          return v > 0 ? String(v) : <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
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
              <ActionBtn icon={<PencilSimple size={14} />} title={lk === "fr" ? "Modifier" : "Edit"} onClick={function () { setEditing({ idx: idx, item: row }); }} />
              <ActionBtn icon={<Copy size={14} />} title={lk === "fr" ? "Dupliquer" : "Duplicate"} onClick={function () { cloneRecipe(idx); }} />
              <ActionBtn icon={<Trash size={14} />} title={lk === "fr" ? "Supprimer" : "Delete"} variant="danger" onClick={function () { requestDelete(idx); }} />
            </div>
          );
        },
      },
    ];
  }, [recipes, config, lk, ingredientRegistry]);

  /* ── Demo data ── */
  function randomize() {
    /* Build shared registry first */
    var regMap = {};
    function regRef(nameStr, cost, unit) {
      var key = nameStr.toLowerCase().trim();
      if (!regMap[key]) {
        regMap[key] = { id: makeId("ing"), name: nameStr, unitCost: cost, unit: unit };
      }
      return regMap[key].id;
    }
    var ts = new Date().toISOString();
    /* Create refs for all demo ingredients */
    var bun = regRef(lk === "fr" ? "Pain burger" : "Burger bun", 0.40, "pcs");
    var patty = regRef(lk === "fr" ? "Steak haché" : "Beef patty", 2.50, "kg");
    var cheddar = regRef("Cheddar", 8, "kg");
    var lettTom = regRef(lk === "fr" ? "Salade, tomate" : "Lettuce, tomato", 3, "kg");
    var mascarpone = regRef("Mascarpone", 5, "kg");
    var biscuits = regRef(lk === "fr" ? "Biscuits" : "Biscuits", 3, "kg");
    var coffee = regRef(lk === "fr" ? "Café" : "Coffee", 15, "kg");
    var eggs = regRef(lk === "fr" ? "Oeufs" : "Eggs", 0.30, "pcs");
    var lemons = regRef(lk === "fr" ? "Citrons" : "Lemons", 3, "kg");
    var sugar = regRef(lk === "fr" ? "Sucre" : "Sugar", 1.50, "kg");
    var sparkling = regRef(lk === "fr" ? "Eau gazeuse" : "Sparkling water", 0.80, "L");
    var romaine = regRef(lk === "fr" ? "Laitue romaine" : "Romaine lettuce", 2.50, "kg");
    var chicken = regRef(lk === "fr" ? "Poulet grillé" : "Grilled chicken", 8, "kg");
    var parmesan = regRef("Parmesan", 18, "kg");
    var croutons = regRef("Croutons", 4, "kg");

    var demoRegistry = Object.values(regMap);
    var demoRecipes = [
      { id: makeId("rec"), name: lk === "fr" ? "Burger classique" : "Classic burger", category: "main", ingredients: [{ ingredientId: bun, qty: 1 }, { ingredientId: patty, qty: 0.15 }, { ingredientId: cheddar, qty: 0.03 }, { ingredientId: lettTom, qty: 0.05 }], laborEntries: [{ id: makeId("lab"), role: lk === "fr" ? "Cuisinier" : "Cook", minutes: 8, hourlyRate: 18 }, { id: makeId("lab"), role: lk === "fr" ? "Commis" : "Line cook", minutes: 4, hourlyRate: 14 }], energyEntries: [{ id: makeId("nrg"), type: "stove", minutes: 10 }], packagingCost: 0.30, portionCount: 1, wastePct: 5, sellingPrice: 12.50, tvaRate: 0.12, monthlySales: 350, seasonProfile: "summer_peak", _configured: true, createdAt: ts },
      { id: makeId("rec"), name: "Tiramisu", category: "dessert", ingredients: [{ ingredientId: mascarpone, qty: 0.25 }, { ingredientId: biscuits, qty: 0.10 }, { ingredientId: coffee, qty: 0.02 }, { ingredientId: eggs, qty: 3 }], laborEntries: [{ id: makeId("lab"), role: lk === "fr" ? "Pâtissier" : "Pastry chef", minutes: 20, hourlyRate: 20 }], energyEntries: [{ id: makeId("nrg"), type: "cold", minutes: 240 }], packagingCost: 0, portionCount: 4, wastePct: 3, sellingPrice: 7.50, tvaRate: 0.12, monthlySales: 200, seasonProfile: "flat", _configured: true, createdAt: ts },
      { id: makeId("rec"), name: lk === "fr" ? "Limonade maison" : "Homemade lemonade", category: "drink", ingredients: [{ ingredientId: lemons, qty: 0.20 }, { ingredientId: sugar, qty: 0.05 }, { ingredientId: sparkling, qty: 0.33 }], laborEntries: [{ id: makeId("lab"), role: lk === "fr" ? "Barman" : "Bartender", minutes: 5, hourlyRate: 16 }], energyEntries: [], packagingCost: 0, portionCount: 1, wastePct: 2, sellingPrice: 4.50, tvaRate: 0.21, monthlySales: 500, seasonProfile: "summer_peak", _configured: true, createdAt: ts },
      { id: makeId("rec"), name: lk === "fr" ? "Salade César" : "Caesar Salad", category: "starter", ingredients: [{ ingredientId: romaine, qty: 0.15 }, { ingredientId: chicken, qty: 0.10 }, { ingredientId: parmesan, qty: 0.02 }, { ingredientId: croutons, qty: 0.03 }], laborEntries: [{ id: makeId("lab"), role: lk === "fr" ? "Cuisinier" : "Cook", minutes: 5, hourlyRate: 18 }, { id: makeId("lab"), role: lk === "fr" ? "Commis" : "Line cook", minutes: 5, hourlyRate: 14 }], energyEntries: [{ id: makeId("nrg"), type: "stove", minutes: 8 }], packagingCost: 0, portionCount: 1, wastePct: 5, sellingPrice: 11, tvaRate: 0.12, monthlySales: 180, seasonProfile: "bimodal", _configured: true, createdAt: ts },
    ];
    setProduction(function (prev) {
      var nc = Object.assign({}, prev);
      nc.recipes = demoRecipes;
      nc.ingredients = demoRegistry;
      nc.enabled = true;
      nc._registryMigrated = true;
      return nc;
    });
    demoRecipes.forEach(function (r) { syncLinks(r); });
  }

  /* ── Wizard (when not enabled) ── */
  var [wizHourly, setWizHourly] = useState(config.hourlyRate);
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
                ? "Calculez le coût réel de chaque production en décomposant les ingrédients, la main d'œuvre et l'énergie. Optimisez vos marges et fixez les bons prix."
                : "Calculate the real cost of each production by breaking down ingredients, labor and energy. Optimize your margins and set the right prices."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--sp-3)", marginBottom: "var(--sp-5)", textAlign: "left" }}>
              {[
                { icon: Cookie, title: lk === "fr" ? "Ingrédients" : "Ingredients", desc: lk === "fr" ? "Le coût des matières premières pour chaque production." : "Raw material costs for each production." },
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
                ? "Ces valeurs serviront de base pour estimer le coût total de chaque production."
                : "These values will be used as the base for estimating each production's total cost."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              <div>
                <label style={labelStyle}>{lk === "fr" ? "Coût horaire moyen de l'équipe" : "Average hourly team cost"}</label>
                <CurrencyInput value={wizHourly} onChange={function (v) { setWizHourly(Math.max(0, v || 0)); }} suffix="€/h" width="100%" />
                <div style={hintStyle}>{lk === "fr" ? "Coût brut chargé moyen par heure de travail" : "Average loaded gross cost per work hour"}</div>
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
      setProduction(function (prev) {
        var nc = Object.assign({}, prev);
        nc.enabled = true;
        nc.recipes = [];
        nc.ingredients = [];
        nc._registryMigrated = true;
        nc.config = { hourlyRate: wizHourly, targetMargin: wizMargin, activityType: wizActivity };
        return nc;
      });
    }

    return (
      <PageLayout
        title={lk === "fr" ? "Production" : "Production"}
        subtitle={lk === "fr" ? "Calculez le coût de revient de vos productions." : "Calculate the cost price of your productions."}
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
          <DevOptionsButton onRandomize={randomize} onClear={function () { cfgSet("recipes", []); cfgSet("ingredients", []); }} />
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
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{lk === "fr" ? "Aucune production" : "No productions"}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 360, textAlign: "center" }}>{lk === "fr" ? "Ajoutez vos productions pour calculer les coûts de revient." : "Add your productions to calculate cost prices."}</div>
      <Button color="primary" size="md" onClick={function () { setShowCreate(true); }} iconLeading={<Plus size={14} weight="bold" />} sx={{ marginTop: "var(--sp-2)" }}>
        {lk === "fr" ? "Ajouter" : "Add"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={lk === "fr" ? "Production" : "Production"}
      subtitle={lk === "fr" ? "Calculez le coût de revient de vos productions." : "Calculate the cost price of your productions."}
      icon={CookingPot} iconColor="var(--brand)"
    >
      {showCreate ? <RecipeModal onSave={addRecipe} onClose={function () { setShowCreate(false); }} lang={lang} config={config} sals={sals} registry={ingredientRegistry} onRegistryUpdate={cfgSetIngredients} /> : null}
      {editing ? <RecipeModal recipe={editing.item} onSave={function (data) { saveRecipe(editing.idx, data); }} onClose={function () { setEditing(null); }} lang={lang} config={config} sals={sals} registry={ingredientRegistry} onRegistryUpdate={cfgSetIngredients} /> : null}
      {pendingDelete !== null ? <ConfirmDeleteModal
        onConfirm={function () { removeRecipe(pendingDelete); setPendingDelete(null); }}
        onCancel={function () { setPendingDelete(null); }}
        skipNext={skipDeleteConfirm} setSkipNext={setSkipDeleteConfirm}
        t={{
          confirm_title: lk === "fr" ? "Supprimer cette production ?" : "Delete this production?",
          confirm_body: lk === "fr" ? "Cette production et ses liens (revenus, charges) seront supprimés." : "This production and its links (revenue, costs) will be removed.",
          confirm_skip: lk === "fr" ? "Ne plus demander" : "Don't ask again",
          cancel: lk === "fr" ? "Annuler" : "Cancel",
          delete: lk === "fr" ? "Supprimer" : "Delete",
        }}
      /> : null}

      {/* KPIs */}
      <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
        <KpiCard label={lk === "fr" ? "Productions" : "Productions"} value={String(kpiCount)} glossaryKey="production_count" />
        <KpiCard label={lk === "fr" ? "Coût matière moyen" : "Avg. material cost"} value={avgMaterialCost > 0 ? avgMaterialCost.toFixed(1) + "%" : "\u2014"} glossaryKey="production_material_cost" />
        <KpiCard label={lk === "fr" ? "Marge moyenne" : "Avg. margin"} value={avgMargin !== 0 ? eur(avgMargin) : "\u2014"} glossaryKey="production_margin" />
        <KpiCard label={lk === "fr" ? "CA estimé / mois" : "Est. revenue / mo"} value={estimatedRevenue > 0 ? eurShort(estimatedRevenue) : "\u2014"} fullValue={estimatedRevenue > 0 ? eur(estimatedRevenue) : undefined} glossaryKey="production_revenue" />
      </div>

      {/* Insights section — always visible, skeleton when empty */}
      <div className="resp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-md)", marginBottom: "var(--gap-lg)" }}>
          {/* Left column: gauge + margin donut */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-md)" }}>
            {/* Material cost gauge with per-recipe hover */}
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "var(--sp-3)" }}>
                {lk === "fr" ? "Coût matière moyen" : "Average material cost"}
              </div>
              <MaterialCostGauge pct={avgMaterialCost} lk={lk} />
              {recipes.length > 0 ? (
                <div style={{ marginTop: "var(--sp-4)", display: "flex", flexDirection: "column", gap: 6 }}>
                  {recipes.slice().sort(function (a, b) { return calcMaterialCostPct(a, config, ingredientRegistry) - calcMaterialCostPct(b, config, ingredientRegistry); }).map(function (r) {
                    var pctV = calcMaterialCostPct(r, config, ingredientRegistry);
                    var col = pctV <= 25 ? "var(--color-success)" : pctV <= 35 ? "var(--color-warning)" : "var(--color-error)";
                    return (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", fontSize: 12 }}>
                        <span style={{ flex: 1, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                        <div style={{ width: 80, height: 6, borderRadius: 3, background: "var(--bg-accordion)", overflow: "hidden", flexShrink: 0 }}>
                          <div style={{ height: "100%", width: Math.min(pctV / 50 * 100, 100) + "%", background: col, borderRadius: 3, transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: col, minWidth: 42, textAlign: "right" }}>{pctV > 0 ? pctV.toFixed(1) + "%" : "\u2014"}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ marginTop: "var(--sp-4)", display: "flex", flexDirection: "column", gap: 8 }}>
                  {[0, 1, 2, 3].map(function (i) {
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                        <div style={{ flex: 1, height: 10, borderRadius: 4, background: "var(--bg-hover)" }} />
                        <div style={{ width: 80, height: 6, borderRadius: 3, background: "var(--bg-hover)" }} />
                        <div style={{ width: 36, height: 10, borderRadius: 4, background: "var(--bg-hover)" }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Margin by category donut */}
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {lk === "fr" ? "Marge par catégorie" : "Margin by category"}
                </div>
                <PaletteToggle value={chartPaletteMode} onChange={onChartPaletteChange} accentRgb={accentRgb} />
              </div>
              <ChartLegend palette={chartPalette} distribution={marginByCategory} meta={RECIPE_CATEGORIES} total={Object.values(marginByCategory).reduce(function (a, b) { return a + b; }, 0)} lk={lk}>
                <DonutChart data={marginByCategory} palette={chartPalette} />
              </ChartLegend>
            </div>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--sp-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {lk === "fr" ? "Meilleure marge" : "Top margin"}
            </div>
            {topRecipe ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>{topRecipe.recipe.name}</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "var(--sp-2)", marginTop: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "var(--color-success)", fontFamily: "'Bricolage Grotesque', sans-serif", fontVariantNumeric: "tabular-nums" }}>{eur(topRecipe.margin)}</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{lk === "fr" ? "de marge / portion" : "margin / portion"}</span>
                  </div>
                </div>
                {/* Stacked bar: cost vs margin */}
                {(function () {
                  var cost = calcUnitCost(topRecipe.recipe, config, ingredientRegistry);
                  var price = topRecipe.recipe.sellingPrice || 0;
                  var costPct = price > 0 ? (cost / price) * 100 : 0;
                  var marginPct = 100 - costPct;
                  return (
                    <div>
                      <div style={{ display: "flex", borderRadius: "var(--r-md)", overflow: "hidden", height: 24 }}>
                        <div style={{ width: costPct + "%", background: "var(--color-error-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "var(--color-error)", padding: "0 6px" }}>
                          {costPct > 15 ? costPct.toFixed(0) + "%" : ""}
                        </div>
                        <div style={{ width: marginPct + "%", background: "var(--color-success-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "var(--color-success)", padding: "0 6px" }}>
                          {marginPct > 15 ? marginPct.toFixed(0) + "%" : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11 }}>
                        <span style={{ color: "var(--color-error)" }}>{lk === "fr" ? "Coût " : "Cost "}{eur(cost)}</span>
                        <span style={{ color: "var(--color-success)" }}>{lk === "fr" ? "Marge " : "Margin "}{eur(topRecipe.margin)}</span>
                      </div>
                    </div>
                  );
                })()}
                {/* Detail rows */}
                <div style={{ padding: "var(--sp-3)", background: "var(--bg-accordion)", borderRadius: "var(--r-md)", border: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Prix de vente" : "Selling price"}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(topRecipe.recipe.sellingPrice)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Coût matière" : "Material cost"}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{topRecipe.materialCostPct.toFixed(1)}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: "var(--text-muted)" }}>{lk === "fr" ? "Ventes / mois" : "Sales / month"}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{topRecipe.recipe.monthlySales || 0}</span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{lk === "fr" ? "Marge mensuelle" : "Monthly margin"}</span>
                    <span style={{ fontWeight: 700, color: "var(--color-success)", fontVariantNumeric: "tabular-nums" }}>{eur(topRecipe.margin * (topRecipe.recipe.monthlySales || 0))}</span>
                  </div>
                </div>
                {/* Contextual margin insight */}
                {(function () {
                  var mp = topRecipe.materialCostPct;
                  var cat = topRecipe.recipe.category || "main";
                  var targets = { starter: 25, main: 30, dessert: 28, drink: 20, snack: 30, product: 35 };
                  var target = targets[cat] || 30;
                  var isGood = mp <= target;
                  var catLabel = RECIPE_CATEGORIES[cat] ? RECIPE_CATEGORIES[cat].label[lk] : cat;

                  return (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 2 }}>
                      {isGood ? (
                        lk === "fr"
                          ? <span>Votre <FinanceLink term="production_material_cost" label="coût matière" desc="Part du prix de vente consacrée aux matières premières. Plus il est bas, plus votre marge est confortable." /> est à {mp.toFixed(0)}%, sous l'objectif de {target}% pour un{cat === "starter" ? "e entrée" : cat === "drink" ? "e boisson" : " " + catLabel.toLowerCase()}. C'est un bon ratio.</span>
                          : <span>Your <FinanceLink term="production_material_cost" label="material cost" desc="Share of selling price spent on raw materials. The lower, the more comfortable your margin." /> is at {mp.toFixed(0)}%, below the {target}% target for a {catLabel.toLowerCase()}. Good ratio.</span>
                      ) : (
                        lk === "fr"
                          ? <span>Votre <FinanceLink term="production_material_cost" label="coût matière" desc="Part du prix de vente consacrée aux matières premières. Plus il est bas, plus votre marge est confortable." /> est à {mp.toFixed(0)}%, au-dessus de l'objectif de {target}% pour un{cat === "starter" ? "e entrée" : cat === "drink" ? "e boisson" : " " + catLabel.toLowerCase()}. Envisagez d'ajuster vos portions ou votre prix de vente.</span>
                          : <span>Your <FinanceLink term="production_material_cost" label="material cost" desc="Share of selling price spent on raw materials. The lower, the more comfortable your margin." /> is at {mp.toFixed(0)}%, above the {target}% target for a {catLabel.toLowerCase()}. Consider adjusting portions or selling price.</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", fontSize: 13 }}>
                {lk === "fr" ? "Ajoutez des productions avec un prix de vente" : "Add productions with a selling price"}
              </div>
            )}
          </div>
        </div>

      {/* Tablist: Productions / Ingrédients */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: "var(--sp-4)" }}>
        {["recipes", "ingredients"].map(function (tabKey) {
          var isActive = prodTab === tabKey;
          var tabLabels = { recipes: lk === "fr" ? "Productions" : "Productions", ingredients: lk === "fr" ? "Ingrédients" : "Ingredients" };
          var tabCounts = { recipes: recipes.length, ingredients: ingredientRegistry.length };
          return (
            <button key={tabKey} type="button" onClick={function () { setProdTab(tabKey); }}
              style={{
                padding: "var(--sp-2) var(--sp-4)", border: "none", background: "none",
                fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: "pointer", fontFamily: "inherit",
                color: isActive ? "var(--brand)" : "var(--text-muted)",
                borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
                marginBottom: -2, transition: "color 0.15s, border-color 0.15s",
              }}>
              {tabLabels[tabKey]}
              {tabCounts[tabKey] > 0 ? <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: isActive ? "var(--brand)" : "var(--text-faint)", background: isActive ? "var(--brand-bg)" : "var(--bg-accordion)", padding: "1px 6px", borderRadius: "var(--r-full)" }}>{tabCounts[tabKey]}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Enhancement 4: Comparison card */}
      {comparison ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--bg-card)", padding: "var(--sp-4)", marginBottom: "var(--gap-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-3)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {lk === "fr" ? "Comparaison" : "Comparison"}
            </div>
            <button type="button" onClick={function () { setComparison(null); }} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--r-sm)" }}
              onMouseEnter={function (e) { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.color = "var(--text-muted)"; }}>
              <X size={16} weight="bold" />
            </button>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-3)", marginBottom: "var(--sp-3)", fontSize: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{comparison[0].name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-info)", flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{comparison[1].name}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
            {(function () {
              var metrics = [
                { label: lk === "fr" ? "Prix de vente" : "Selling price", a: comparison[0].sellingPrice || 0, b: comparison[1].sellingPrice || 0, fmt: eur },
                { label: lk === "fr" ? "Coût total" : "Total cost", a: calcUnitCost(comparison[0], config, ingredientRegistry), b: calcUnitCost(comparison[1], config, ingredientRegistry), fmt: eur },
                { label: lk === "fr" ? "Marge" : "Margin", a: calcMargin(comparison[0], config, ingredientRegistry), b: calcMargin(comparison[1], config, ingredientRegistry), fmt: eur },
                { label: lk === "fr" ? "Coût matière %" : "Material cost %", a: calcMaterialCostPct(comparison[0], config, ingredientRegistry), b: calcMaterialCostPct(comparison[1], config, ingredientRegistry), fmt: function (v) { return v.toFixed(1) + "%"; } },
                { label: lk === "fr" ? "Ventes / mois" : "Sales / month", a: comparison[0].monthlySales || 0, b: comparison[1].monthlySales || 0, fmt: String },
                { label: lk === "fr" ? "Portions / mois" : "Portions / month", a: (comparison[0].monthlySales || 0) * (comparison[0].portionCount || 1), b: (comparison[1].monthlySales || 0) * (comparison[1].portionCount || 1), fmt: String },
              ];
              return metrics.map(function (m, mi) {
                var maxVal = Math.max(Math.abs(m.a), Math.abs(m.b)) || 1;
                var pctA = (Math.abs(m.a) / maxVal) * 100;
                var pctB = (Math.abs(m.b) / maxVal) * 100;
                return (
                  <div key={mi}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ height: 20, borderRadius: "var(--r-sm)", background: "var(--brand)", width: pctA + "%", minWidth: 2, transition: "width 0.3s ease", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, paddingLeft: 6 }}>
                          {pctA > 25 ? <span style={{ fontSize: 10, fontWeight: 600, color: "white", whiteSpace: "nowrap" }}>{m.fmt(m.a)}</span> : null}
                        </div>
                        {pctA <= 25 ? <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{m.fmt(m.a)}</span> : null}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ height: 20, borderRadius: "var(--r-sm)", background: "var(--color-info)", width: pctB + "%", minWidth: 2, transition: "width 0.3s ease", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, paddingLeft: 6 }}>
                          {pctB > 25 ? <span style={{ fontSize: 10, fontWeight: 600, color: "white", whiteSpace: "nowrap" }}>{m.fmt(m.b)}</span> : null}
                        </div>
                        {pctB <= 25 ? <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{m.fmt(m.b)}</span> : null}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : null}

      {/* Tab: Productions */}
      {prodTab === "recipes" ? (
        <DataTable
          data={filteredRecipes}
          columns={columns}
          toolbar={toolbarNode}
          emptyState={emptyNode}
          emptyMinHeight={200}
          pageSize={10}
          getRowId={function (row) { return String(row.id); }}
          selectable
          onDeleteSelected={bulkDeleteRecipes}
          selectionExtraActions={function (selectedIds) {
            var ids = Object.keys(selectedIds).filter(function (k) { return selectedIds[k]; });
            if (ids.length === 2) {
              return (
                <button type="button" onClick={function () {
                  var r1 = recipes.find(function (r) { return String(r.id) === String(ids[0]); });
                  var r2 = recipes.find(function (r) { return String(r.id) === String(ids[1]); });
                  if (r1 && r2) setComparison([r1, r2]);
                }}
                  style={{
                    height: 40, padding: "0 20px",
                  display: "inline-flex", alignItems: "center",
                  border: "2px solid rgba(255,255,255,0.6)",
                  borderRadius: "var(--r-md)",
                  background: "transparent",
                  color: "white", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.12s, border-color 0.12s",
                }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "white"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; }}
              >
                {lk === "fr" ? "Comparer" : "Compare"}
              </button>
            );
          }
          return null;
        }}
          scrollable
        />
      ) : null}

      {/* Tab: Ingredients (shared registry) */}
      {prodTab === "ingredients" ? (
        <DataTable
          data={(function () {
            /* Merge registry with consumption data */
            var consumptionMap = {};
            ingredientConsumption.forEach(function (ic) { if (ic.id) consumptionMap[ic.id] = ic; });
            var items = ingredientRegistry.map(function (reg) {
              var cons = consumptionMap[reg.id] || { totalQty: 0, totalCost: 0, recipeCount: 0, recipeNames: [] };
              return Object.assign({}, reg, { totalQty: cons.totalQty, totalCost: cons.totalCost, recipeCount: cons.recipeCount, recipeNames: cons.recipeNames });
            });
            if (ingRecipeFilter && ingRecipeFilter !== "all") {
              items = items.filter(function (ic) { return (ic.recipeNames || []).indexOf(ingRecipeFilter) >= 0; });
            }
            if (search.trim()) {
              var q = search.trim().toLowerCase();
              items = items.filter(function (ic) { return (ic.name || "").toLowerCase().indexOf(q) !== -1; });
            }
            return items;
          })()}
          toolbar={
            <>
              <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
                <SearchInput value={search} onChange={setSearch} placeholder={lk === "fr" ? "Rechercher..." : "Search..."} />
                <FilterDropdown value={ingRecipeFilter} onChange={setIngRecipeFilter} options={[{ value: "all", label: lk === "fr" ? "Toutes les productions" : "All productions" }].concat(
                  recipes.filter(function (r) { return r.name; }).map(function (r) { return { value: r.name, label: r.name }; })
                )} />
              </div>
              <ExportButtons cfg={appCfg} data={ingredientRegistry} columns={[
                { id: "name", accessorKey: "name", header: lk === "fr" ? "Ingrédient" : "Ingredient" },
                { id: "unitCost", accessorFn: function (r) { return r.unitCost; }, header: lk === "fr" ? "Coût unit." : "Unit cost", meta: { align: "right" } },
                { id: "unit", accessorKey: "unit", header: lk === "fr" ? "Unité" : "Unit" },
              ]} filename="ingredients" title={lk === "fr" ? "Registre d'ingrédients" : "Ingredient registry"} subtitle={lk === "fr" ? "Base partagée" : "Shared database"} />
            </>
          }
          columns={[
            {
              id: "name", accessorKey: "name",
              header: lk === "fr" ? "Ingrédient" : "Ingredient",
              enableSorting: true, meta: { align: "left", minWidth: 180, grow: true },
              cell: function (info) {
                var ic = info.row.original;
                var isHigh = ingredientTotalCost > 0 && (ic.totalCost / ingredientTotalCost) > 0.30;
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isHigh ? <Warning size={14} weight="fill" color="var(--color-warning)" /> : null}
                    <span style={{ fontWeight: 500 }}>{info.getValue()}</span>
                  </div>
                );
              },
              footer: function () {
                return (
                  <>
                    <span style={{ fontWeight: 600 }}>Total</span>
                    <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>{ingredientRegistry.length} {lk === "fr" ? "ingrédients" : "ingredients"}</span>
                  </>
                );
              },
            },
            {
              id: "unitCost",
              header: lk === "fr" ? "Coût unit." : "Unit cost",
              enableSorting: true, meta: { align: "right" },
              accessorFn: function (row) { return row.unitCost || 0; },
              cell: function (info) { return <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(info.getValue())}</span>; },
            },
            {
              id: "unit", accessorKey: "unit",
              header: lk === "fr" ? "Unité" : "Unit",
              enableSorting: true, meta: { align: "center" },
              cell: function (info) { return <Badge color="gray" size="sm">{info.getValue()}</Badge>; },
            },
            {
              id: "totalQty",
              header: lk === "fr" ? "Conso. / mois" : "Consumption / mo",
              enableSorting: true, meta: { align: "right" },
              accessorFn: function (row) { return row.totalQty || 0; },
              cell: function (info) { var v = info.getValue(); return v > 0 ? v.toFixed(1) : <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>; },
            },
            {
              id: "totalCost",
              header: lk === "fr" ? "Coût / mois" : "Cost / month",
              enableSorting: true, meta: { align: "right" },
              accessorFn: function (row) { return row.totalCost || 0; },
              cell: function (info) {
                var v = info.getValue();
                var isHigh = ingredientTotalCost > 0 && (v / ingredientTotalCost) > 0.30;
                return v > 0 ? <span style={{ fontWeight: 600, color: isHigh ? "var(--color-warning)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{eur(v)}</span> : <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
              },
            },
            {
              id: "pctOfTotal",
              header: "%",
              enableSorting: true, meta: { align: "center" },
              accessorFn: function (row) { return ingredientTotalCost > 0 ? ((row.totalCost || 0) / ingredientTotalCost) * 100 : 0; },
              cell: function (info) {
                var v = info.getValue();
                if (v <= 0) return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
                return <Badge color={v > 30 ? "warning" : "gray"} size="sm">{v.toFixed(1)}%</Badge>;
              },
            },
            {
              id: "recipeCount",
              header: lk === "fr" ? "Productions" : "Productions",
              enableSorting: true, meta: { align: "center" },
              accessorFn: function (row) { return row.recipeCount || 0; },
              cell: function (info) { var v = info.getValue(); return v > 0 ? String(v) : <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>; },
            },
            {
              id: "recipeNames",
              header: lk === "fr" ? "Utilisé dans" : "Used in",
              enableSorting: true, meta: { align: "left", minWidth: 160 },
              accessorFn: function (row) { return (row.recipeNames || []).join(", "); },
              cell: function (info) {
                var names = info.row.original.recipeNames || [];
                if (names.length === 0) return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {names.map(function (n) { return <Badge key={n} color="gray" size="sm">{n}</Badge>; })}
                  </div>
                );
              },
            },
            {
              id: "stockQty",
              header: lk === "fr" ? "Stock actuel" : "Current stock",
              enableSorting: true, meta: { align: "right" },
              accessorFn: function (row) {
                var linked = findLinkedStock(row);
                return linked ? (linked.quantity || 0) : -1;
              },
              cell: function (info) {
                var row = info.row.original;
                var linked = findLinkedStock(row);
                if (!linked) return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
                var isLow = (linked.minStock || 0) > 0 && (linked.quantity || 0) < (linked.minStock || 0);
                return (
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: isLow ? "var(--color-error)" : "var(--text-primary)" }}>
                    {linked.quantity || 0}{linked.unit ? " " + linked.unit : ""}
                  </span>
                );
              },
            },
            {
              id: "stockAutonomy",
              header: lk === "fr" ? "Autonomie" : "Autonomy",
              enableSorting: true, meta: { align: "center" },
              accessorFn: function (row) {
                var linked = findLinkedStock(row);
                if (!linked) return -1;
                var aut = calcItemAutonomy(linked);
                return aut !== null ? aut : -1;
              },
              cell: function (info) {
                var row = info.row.original;
                var linked = findLinkedStock(row);
                if (!linked) return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
                var days = calcItemAutonomy(linked);
                if (days === null) return <span style={{ color: "var(--text-faint)" }}>{"\u2014"}</span>;
                var color = days > 14 ? "success" : days > 7 ? "warning" : "error";
                return <Badge color={color} size="sm">{days + (lk === "fr" ? " j" : " d")}</Badge>;
              },
            },
            {
              id: "stockLink",
              header: lk === "fr" ? "Stock" : "Stock",
              enableSorting: false, meta: { align: "center" },
              cell: function (info) {
                var row = info.row.original;
                var linked = findLinkedStock(row);
                if (linked) {
                  return (
                    <Badge color="success" size="sm">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Link size={11} weight="bold" />
                        {lk === "fr" ? "Lié" : "Linked"}
                      </span>
                    </Badge>
                  );
                }
                return (
                  <button type="button" onClick={function () { createStockFromIngredient(row); }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 8px", border: "1px solid var(--border)", borderRadius: "var(--r-sm)",
                      background: "var(--bg-card)", color: "var(--brand)", fontSize: 11, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                    }}>
                    <Package size={12} weight="bold" />
                    {lk === "fr" ? "Créer le stock" : "Create stock"}
                  </button>
                );
              },
            },
            {
              id: "actions", header: "", enableSorting: false,
              meta: { align: "center", compactPadding: true, width: 1 },
              cell: function (info) {
                var row = info.row.original;
                return (
                  <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <ActionBtn icon={<PencilSimple size={14} />} title={lk === "fr" ? "Modifier le coût" : "Edit cost"} onClick={function () {
                      var newCost = window.prompt((lk === "fr" ? "Nouveau coût unitaire pour " : "New unit cost for ") + row.name, String(row.unitCost || 0));
                      if (newCost !== null) {
                        var parsed = parseFloat(newCost);
                        if (!isNaN(parsed) && parsed >= 0) {
                          cfgSetIngredients(function (prev) {
                            return prev.map(function (reg) {
                              if (reg.id === row.id) return Object.assign({}, reg, { unitCost: parsed });
                              return reg;
                            });
                          });
                        }
                      }
                    }} />
                    <ActionBtn icon={<Trash size={14} />} title={lk === "fr" ? "Supprimer" : "Delete"} variant="danger" onClick={function () {
                      if ((row.recipeCount || 0) > 0) {
                        if (!window.confirm((lk === "fr" ? "Cet ingrédient est utilisé dans " : "This ingredient is used in ") + row.recipeCount + (lk === "fr" ? " production(s). Supprimer quand même ?" : " production(s). Delete anyway?"))) return;
                      }
                      /* Remove from registry */
                      cfgSetIngredients(function (prev) {
                        return prev.filter(function (reg) { return reg.id !== row.id; });
                      });
                      /* Remove references from recipes */
                      cfgSet("recipes", recipes.map(function (r) {
                        var hasRef = (r.ingredients || []).some(function (ri) { return ri.ingredientId === row.id; });
                        if (!hasRef) return r;
                        return Object.assign({}, r, {
                          ingredients: (r.ingredients || []).filter(function (ri) { return ri.ingredientId !== row.id; }),
                        });
                      }));
                    }} />
                  </div>
                );
              },
            },
          ]}
          emptyState={
            <div style={{ textAlign: "center", padding: "var(--sp-6)", color: "var(--text-faint)" }}>
              {lk === "fr" ? "Ajoutez des productions avec des ingrédients pour construire votre registre." : "Add productions with ingredients to build your registry."}
            </div>
          }
          emptyMinHeight={150}
          pageSize={20}
          getRowId={function (row) { return String(row.id); }}
          showFooter
        />
      ) : null}
    </PageLayout>
  );
}
