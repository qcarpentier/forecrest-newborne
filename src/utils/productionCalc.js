export function getProductionPortionCount(recipe) {
  var portions = Number(recipe && recipe.portionCount);
  return portions > 0 ? portions : 1;
}

export function getProductionMonthlySales(recipe) {
  var sales = Number(recipe && recipe.monthlySales);
  return sales > 0 ? sales : 0;
}

export function getProductionRecipeRunsPerMonth(recipe) {
  return getProductionMonthlySales(recipe) / getProductionPortionCount(recipe);
}

export function resolveProductionIngredient(ri, registry) {
  if (!ri || !ri.ingredientId) {
    return {
      name: ri && ri.name ? ri.name : "",
      unitCost: Math.max(0, Number(ri && (ri.cost != null ? ri.cost : ri.unitCost)) || 0),
      unit: ri && ri.unit ? ri.unit : "kg",
    };
  }
  var reg = (registry || []).find(function (r) { return r.id === ri.ingredientId; });
  if (reg) return reg;
  return { name: "", unitCost: 0, unit: "kg" };
}

export function getProductionLaborEntries(recipe, config) {
  if (recipe && recipe.laborEntries && recipe.laborEntries.length > 0) return recipe.laborEntries;
  if (recipe && recipe.prepTimeMinutes > 0) {
    return [{ role: "", minutes: recipe.prepTimeMinutes, hourlyRate: (config && config.hourlyRate) || 18 }];
  }
  return [];
}

export function getProductionEnergyEntries(recipe) {
  if (recipe && recipe.energyEntries && recipe.energyEntries.length > 0) return recipe.energyEntries;
  if (recipe && recipe.energyType && recipe.energyType !== "none" && recipe.prepTimeMinutes > 0) {
    return [{ type: recipe.energyType, minutes: recipe.prepTimeMinutes }];
  }
  return [];
}

export function calcProductionIngredientCost(ingredients, registry) {
  var total = 0;
  (ingredients || []).forEach(function (ri) {
    var reg = resolveProductionIngredient(ri, registry);
    total += Math.max(0, reg.unitCost || 0) * Math.max(0, ri && ri.qty || 0);
  });
  return total;
}

export function calcProductionLaborCost(laborEntries) {
  var total = 0;
  (laborEntries || []).forEach(function (entry) {
    var minutes = Math.max(0, Number(entry && entry.minutes) || 0);
    var hourlyRate = Math.max(0, Number(entry && entry.hourlyRate) || 0);
    total += (minutes / 60) * hourlyRate;
  });
  return total;
}

export function calcProductionEnergyCost(energyEntries, energyTypes) {
  var total = 0;
  (energyEntries || []).forEach(function (entry) {
    var meta = energyTypes && energyTypes[entry && entry.type] ? energyTypes[entry.type] : null;
    var minutes = Math.max(0, Number(entry && entry.minutes) || 0);
    var costPerHour = entry && entry.costPerHour != null
      ? Math.max(0, Number(entry.costPerHour) || 0)
      : Math.max(0, Number(meta && meta.costPerHour) || 0);
    total += (minutes / 60) * costPerHour;
  });
  return total;
}

export function getProductionWasteMultiplier(recipe) {
  var wastePct = Math.max(0, Number(recipe && recipe.wastePct) || 0);
  return 1 + wastePct / 100;
}

export function calcProductionMaterialBatchCost(recipe, registry) {
  return calcProductionIngredientCost(recipe && recipe.ingredients, registry) * getProductionWasteMultiplier(recipe);
}

export function calcProductionPackagingBatchCost(recipe) {
  return Math.max(0, Number(recipe && recipe.packagingCost) || 0) * getProductionPortionCount(recipe);
}

export function calcProductionRecipeTotalCost(recipe, config, registry, energyTypes) {
  var material = calcProductionMaterialBatchCost(recipe, registry);
  var labor = calcProductionLaborCost(getProductionLaborEntries(recipe, config));
  var energy = calcProductionEnergyCost(getProductionEnergyEntries(recipe), energyTypes);
  var packaging = calcProductionPackagingBatchCost(recipe);
  return material + labor + energy + packaging;
}

export function calcProductionUnitCost(recipe, config, registry, energyTypes) {
  return calcProductionRecipeTotalCost(recipe, config, registry, energyTypes) / getProductionPortionCount(recipe);
}

export function calcProductionMaterialUnitCost(recipe, registry) {
  return calcProductionMaterialBatchCost(recipe, registry) / getProductionPortionCount(recipe);
}

export function calcProductionMaterialCostPct(recipe, config, registry, energyTypes) {
  var sellingPrice = Math.max(0, Number(recipe && recipe.sellingPrice) || 0);
  if (sellingPrice <= 0) return 0;
  return calcProductionMaterialUnitCost(recipe, registry, energyTypes) / sellingPrice * 100;
}

export function calcProductionMargin(recipe, config, registry, energyTypes) {
  var sellingPrice = Number(recipe && recipe.sellingPrice) || 0;
  return sellingPrice - calcProductionUnitCost(recipe, config, registry, energyTypes);
}

export function calcProductionMonthlyCostBreakdown(recipe, config, registry, energyTypes) {
  var monthlyFactor = getProductionRecipeRunsPerMonth(recipe);
  var material = calcProductionMaterialBatchCost(recipe, registry) * monthlyFactor;
  var labor = calcProductionLaborCost(getProductionLaborEntries(recipe, config)) * monthlyFactor;
  var energy = calcProductionEnergyCost(getProductionEnergyEntries(recipe), energyTypes) * monthlyFactor;
  var packaging = calcProductionPackagingBatchCost(recipe) * monthlyFactor;
  return {
    material: material,
    labor: labor,
    energy: energy,
    packaging: packaging,
    total: material + labor + energy + packaging,
  };
}

export function calcProductionIngredientConsumption(recipes, registry) {
  var map = {};

  (recipes || []).forEach(function (recipe) {
    var recipeRuns = getProductionRecipeRunsPerMonth(recipe);
    var wasteMultiplier = getProductionWasteMultiplier(recipe);

    (recipe && recipe.ingredients || []).forEach(function (ri) {
      var reg = resolveProductionIngredient(ri, registry);
      var key = ri && ri.ingredientId ? ri.ingredientId : (reg.name || "").toLowerCase().trim();
      if (!key) return;

      if (!map[key]) {
        map[key] = {
          id: ri && ri.ingredientId ? ri.ingredientId : null,
          name: reg.name,
          unit: reg.unit,
          unitCost: reg.unitCost || 0,
          totalQty: 0,
          totalCost: 0,
          recipeCount: 0,
          recipeNames: [],
        };
      }

      var qtyPerRecipe = Math.max(0, Number(ri && ri.qty) || 0);
      var totalQty = qtyPerRecipe * recipeRuns * wasteMultiplier;
      map[key].totalQty += totalQty;
      map[key].totalCost += (reg.unitCost || 0) * totalQty;
      map[key].recipeCount += 1;
      if (recipe && recipe.name && map[key].recipeNames.indexOf(recipe.name) < 0) {
        map[key].recipeNames.push(recipe.name);
      }
    });
  });

  return Object.values(map).sort(function (a, b) { return b.totalCost - a.totalCost; });
}
