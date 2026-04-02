import { describe, it, expect } from "vitest";
import {
  calcProductionRecipeTotalCost,
  calcProductionUnitCost,
  calcProductionMaterialCostPct,
  calcProductionMargin,
  calcProductionMonthlyCostBreakdown,
  calcProductionIngredientConsumption,
} from "./productionCalc.js";

var ENERGY_TYPES = {
  oven: { costPerHour: 0.5 },
  stove: { costPerHour: 0.3 },
  cold: { costPerHour: 0.05 },
  none: { costPerHour: 0 },
};

describe("production calculations", function () {
  it("applies waste only to ingredients, not labor or packaging", function () {
    var registry = [{ id: "flour", name: "Flour", unitCost: 10, unit: "kg" }];
    var recipe = {
      ingredients: [{ ingredientId: "flour", qty: 1 }],
      laborEntries: [{ minutes: 60, hourlyRate: 20 }],
      energyEntries: [{ type: "oven", minutes: 60 }],
      packagingCost: 2,
      portionCount: 1,
      wastePct: 10,
    };

    var total = calcProductionRecipeTotalCost(recipe, { hourlyRate: 18 }, registry, ENERGY_TYPES);
    expect(total).toBeCloseTo(33.5, 4);
  });

  it("treats packaging as a per-portion cost", function () {
    var registry = [{ id: "broth", name: "Broth", unitCost: 4, unit: "L" }];
    var recipe = {
      ingredients: [{ ingredientId: "broth", qty: 2 }],
      laborEntries: [],
      energyEntries: [],
      packagingCost: 0.5,
      portionCount: 4,
      wastePct: 0,
      sellingPrice: 8,
    };

    expect(calcProductionUnitCost(recipe, {}, registry, ENERGY_TYPES)).toBeCloseTo(2.5, 4);
  });

  it("computes material cost percentage from ingredients only", function () {
    var registry = [{ id: "veg", name: "Vegetables", unitCost: 10, unit: "kg" }];
    var recipe = {
      ingredients: [{ ingredientId: "veg", qty: 1 }],
      laborEntries: [{ minutes: 60, hourlyRate: 20 }],
      energyEntries: [{ type: "oven", minutes: 60 }],
      packagingCost: 2,
      portionCount: 2,
      wastePct: 10,
      sellingPrice: 20,
    };

    expect(calcProductionMaterialCostPct(recipe, {}, registry, ENERGY_TYPES)).toBeCloseTo(27.5, 4);
    expect(calcProductionMargin(recipe, {}, registry, ENERGY_TYPES)).toBeCloseTo(2.25, 4);
  });

  it("spreads monthly costs using sold portions", function () {
    var registry = [{ id: "veg", name: "Vegetables", unitCost: 10, unit: "kg" }];
    var recipe = {
      ingredients: [{ ingredientId: "veg", qty: 1 }],
      laborEntries: [{ minutes: 60, hourlyRate: 20 }],
      energyEntries: [{ type: "oven", minutes: 60 }],
      packagingCost: 2,
      portionCount: 2,
      monthlySales: 10,
      wastePct: 10,
    };

    var monthly = calcProductionMonthlyCostBreakdown(recipe, {}, registry, ENERGY_TYPES);
    expect(monthly.material).toBeCloseTo(55, 4);
    expect(monthly.labor).toBeCloseTo(100, 4);
    expect(monthly.energy).toBeCloseTo(2.5, 4);
    expect(monthly.packaging).toBeCloseTo(20, 4);
    expect(monthly.total).toBeCloseTo(177.5, 4);
  });

  it("computes ingredient consumption with portion scaling and waste", function () {
    var registry = [{ id: "veg", name: "Vegetables", unitCost: 10, unit: "kg" }];
    var recipes = [{
      name: "Soup",
      ingredients: [{ ingredientId: "veg", qty: 2 }],
      portionCount: 4,
      monthlySales: 20,
      wastePct: 10,
    }];

    var consumption = calcProductionIngredientConsumption(recipes, registry);
    expect(consumption).toHaveLength(1);
    expect(consumption[0].totalQty).toBeCloseTo(11, 4);
    expect(consumption[0].totalCost).toBeCloseTo(110, 4);
    expect(consumption[0].recipeCount).toBe(1);
  });
});
