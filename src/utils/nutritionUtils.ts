import { RecipeIngredient } from '../types';

export interface IngredientNutrition {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface TotalNutritionBreakdown {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  perServingCalories: number;
  perServingProtein: number;
  perServingCarbs: number;
  perServingFat: number;
  items: IngredientNutrition[];
  macroRatios: {
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
}

interface IngredientMacroProfile {
  // Macros per 100 grams
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  // Grams per piece or standard unit if given in pcs, slices, cloves, etc.
  gramsPerPiece?: number;
  gramsPerTbsp?: number;
  gramsPerTsp?: number;
}

const NUTRITION_DATABASE: Record<string, IngredientMacroProfile> = {
  chicken: { caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, gramsPerPiece: 200 },
  beef: { caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 17, gramsPerPiece: 180 },
  fish: { caloriesPer100g: 170, proteinPer100g: 24, carbsPer100g: 0, fatPer100g: 8, gramsPerPiece: 150 },
  salmon: { caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, gramsPerPiece: 170 },
  egg: { caloriesPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 0.8, fatPer100g: 9.5, gramsPerPiece: 50 },
  eggs: { caloriesPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 0.8, fatPer100g: 9.5, gramsPerPiece: 50 },
  rice: { caloriesPer100g: 360, proteinPer100g: 7.5, carbsPer100g: 80, fatPer100g: 0.7, gramsPerTbsp: 15 },
  pasta: { caloriesPer100g: 355, proteinPer100g: 12, carbsPer100g: 72, fatPer100g: 1.5, gramsPerTbsp: 12 },
  couscous: { caloriesPer100g: 360, proteinPer100g: 13, carbsPer100g: 73, fatPer100g: 0.6, gramsPerTbsp: 14 },
  flour: { caloriesPer100g: 364, proteinPer100g: 10, carbsPer100g: 76, fatPer100g: 1, gramsPerTbsp: 15 },
  bread: { caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, gramsPerPiece: 35 },
  toast: { caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3.2, gramsPerPiece: 35 },
  bean: { caloriesPer100g: 127, proteinPer100g: 8.7, carbsPer100g: 22.8, fatPer100g: 0.5, gramsPerTbsp: 15 },
  beans: { caloriesPer100g: 127, proteinPer100g: 8.7, carbsPer100g: 22.8, fatPer100g: 0.5, gramsPerTbsp: 15 },
  tomato: { caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, gramsPerPiece: 120 },
  tomatoes: { caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, gramsPerPiece: 120 },
  onion: { caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.1, gramsPerPiece: 110 },
  onions: { caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.1, gramsPerPiece: 110 },
  garlic: { caloriesPer100g: 149, proteinPer100g: 6.4, carbsPer100g: 33, fatPer100g: 0.5, gramsPerPiece: 3 },
  oil: { caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, gramsPerTbsp: 14, gramsPerTsp: 4.5 },
  'olive oil': { caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, gramsPerTbsp: 14, gramsPerTsp: 4.5 },
  butter: { caloriesPer100g: 717, proteinPer100g: 0.8, carbsPer100g: 0.1, fatPer100g: 81, gramsPerTbsp: 14, gramsPerTsp: 4.5 },
  'coconut milk': { caloriesPer100g: 197, proteinPer100g: 2, carbsPer100g: 4, fatPer100g: 21, gramsPerTbsp: 15 },
  'soy sauce': { caloriesPer100g: 60, proteinPer100g: 9, carbsPer100g: 5, fatPer100g: 0.1, gramsPerTbsp: 15, gramsPerTsp: 5 },
  pepper: { caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3, gramsPerPiece: 120 },
  'bell pepper': { caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3, gramsPerPiece: 120 },
  'bell peppers': { caloriesPer100g: 31, proteinPer100g: 1, carbsPer100g: 6, fatPer100g: 0.3, gramsPerPiece: 120 },
  lemon: { caloriesPer100g: 29, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.3, gramsPerPiece: 60 },
  cheese: { caloriesPer100g: 402, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33, gramsPerTbsp: 10 },
  milk: { caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3, gramsPerTbsp: 15 },
  coriander: { caloriesPer100g: 23, proteinPer100g: 2.1, carbsPer100g: 3.7, fatPer100g: 0.5, gramsPerPiece: 25 },
  dhania: { caloriesPer100g: 23, proteinPer100g: 2.1, carbsPer100g: 3.7, fatPer100g: 0.5, gramsPerPiece: 25 },
  curry: { caloriesPer100g: 325, proteinPer100g: 12, carbsPer100g: 58, fatPer100g: 14, gramsPerTbsp: 7, gramsPerTsp: 2.5 },
  cumin: { caloriesPer100g: 375, proteinPer100g: 18, carbsPer100g: 44, fatPer100g: 22, gramsPerTbsp: 6, gramsPerTsp: 2 },
  paprika: { caloriesPer100g: 282, proteinPer100g: 14, carbsPer100g: 54, fatPer100g: 13, gramsPerTbsp: 7, gramsPerTsp: 2.3 },
  cinnamon: { caloriesPer100g: 247, proteinPer100g: 4, carbsPer100g: 81, fatPer100g: 1.2, gramsPerTsp: 2.6 },
  oregano: { caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 69, fatPer100g: 4.3, gramsPerTsp: 1 },
  ginger: { caloriesPer100g: 80, proteinPer100g: 1.8, carbsPer100g: 18, fatPer100g: 0.8, gramsPerPiece: 15, gramsPerTsp: 2 },
  potato: { caloriesPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1, gramsPerPiece: 180 },
  potatoes: { caloriesPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1, gramsPerPiece: 180 },
  'sweet potato': { caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, gramsPerPiece: 150 },
  'sweet potatoes': { caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, gramsPerPiece: 150 },
  avocado: { caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 8.5, fatPer100g: 14.7, gramsPerPiece: 150 },
  spinach: { caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, gramsPerPiece: 30 },
  broccoli: { caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, gramsPerPiece: 150 },
  carrot: { caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 9.6, fatPer100g: 0.2, gramsPerPiece: 80 },
  carrots: { caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 9.6, fatPer100g: 0.2, gramsPerPiece: 80 },
  mushroom: { caloriesPer100g: 22, proteinPer100g: 3.1, carbsPer100g: 3.3, fatPer100g: 0.3, gramsPerPiece: 20 },
  mushrooms: { caloriesPer100g: 22, proteinPer100g: 3.1, carbsPer100g: 3.3, fatPer100g: 0.3, gramsPerPiece: 20 },
  tuna: { caloriesPer100g: 132, proteinPer100g: 28, carbsPer100g: 0, fatPer100g: 1.3, gramsPerPiece: 140 },
  shrimp: { caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, gramsPerPiece: 15 },
  prawns: { caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3, gramsPerPiece: 15 },
  turkey: { caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1.5, gramsPerPiece: 150 },
  tofu: { caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8, gramsPerPiece: 100 },
  yogurt: { caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4, gramsPerTbsp: 15 },
  oats: { caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66, fatPer100g: 6.9, gramsPerTbsp: 10 },
  lentils: { caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, gramsPerTbsp: 15 },
  honey: { caloriesPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82, fatPer100g: 0, gramsPerTbsp: 21, gramsPerTsp: 7 },
  sugar: { caloriesPer100g: 387, proteinPer100g: 0, carbsPer100g: 100, fatPer100g: 0, gramsPerTbsp: 12, gramsPerTsp: 4 },
  salt: { caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, gramsPerTsp: 6 },
};

function findProfile(name: string): IngredientMacroProfile {
  const norm = name.toLowerCase().trim();

  // Exact match
  if (NUTRITION_DATABASE[norm]) {
    return NUTRITION_DATABASE[norm];
  }

  // Key phrase search
  for (const [key, profile] of Object.entries(NUTRITION_DATABASE)) {
    if (norm.includes(key)) {
      return profile;
    }
  }

  // Fallbacks based on broad classification
  if (/meat|steak|lamb|pork/.test(norm)) {
    return { caloriesPer100g: 230, proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 15, gramsPerPiece: 180 };
  }
  if (/grain|cereal|oat/.test(norm)) {
    return { caloriesPer100g: 360, proteinPer100g: 11, carbsPer100g: 70, fatPer100g: 3, gramsPerTbsp: 15 };
  }
  if (/sauce|dressing|paste/.test(norm)) {
    return { caloriesPer100g: 120, proteinPer100g: 2, carbsPer100g: 10, fatPer100g: 8, gramsPerTbsp: 15 };
  }
  if (/vegetable|leaf|greens|herb|spinach|carrot|broccoli/.test(norm)) {
    return { caloriesPer100g: 28, proteinPer100g: 2, carbsPer100g: 5, fatPer100g: 0.3, gramsPerPiece: 80 };
  }

  // Default neutral vegetable/seasoning
  return { caloriesPer100g: 45, proteinPer100g: 2, carbsPer100g: 8, fatPer100g: 0.5, gramsPerPiece: 50 };
}

export function calculateSingleIngredientNutrition(
  ingredient: RecipeIngredient,
  scale: number = 1
): IngredientNutrition {
  const scaledQty = ingredient.quantity * scale;
  const unit = ingredient.unit.toLowerCase().trim();
  const profile = findProfile(ingredient.name);

  let grams = 0;

  if (unit === 'g' || unit === 'grams' || unit === 'gram') {
    grams = scaledQty;
  } else if (unit === 'kg' || unit === 'kilograms') {
    grams = scaledQty * 1000;
  } else if (unit === 'ml' || unit === 'milliliters') {
    grams = scaledQty * 1.0; // Approx 1g/ml
  } else if (unit === 'l' || unit === 'liters') {
    grams = scaledQty * 1000;
  } else if (unit === 'tbsp' || unit === 'tablespoon' || unit === 'tablespoons') {
    grams = scaledQty * (profile.gramsPerTbsp || 14);
  } else if (unit === 'tsp' || unit === 'teaspoon' || unit === 'teaspoons') {
    grams = scaledQty * (profile.gramsPerTsp || 4.5);
  } else if (unit === 'cup' || unit === 'cups') {
    grams = scaledQty * 240;
  } else if (unit === 'slices' || unit === 'slice') {
    grams = scaledQty * 35;
  } else if (unit === 'cloves' || unit === 'clove') {
    grams = scaledQty * 3;
  } else if (unit === 'bunch') {
    grams = scaledQty * 40;
  } else {
    // pcs, items, or unspecified
    grams = scaledQty * (profile.gramsPerPiece || 100);
  }

  const factor = grams / 100;
  const calories = Math.round(profile.caloriesPer100g * factor);
  const protein = Math.round(profile.proteinPer100g * factor * 10) / 10;
  const carbs = Math.round(profile.carbsPer100g * factor * 10) / 10;
  const fat = Math.round(profile.fatPer100g * factor * 10) / 10;

  return {
    name: ingredient.name,
    quantity: Math.round(scaledQty * 10) / 10,
    unit: ingredient.unit,
    calories,
    protein,
    carbs,
    fat,
  };
}

export function calculateTotalRecipeNutrition(
  ingredients: RecipeIngredient[],
  servings: number,
  scale: number = 1
): TotalNutritionBreakdown {
  const items = ingredients.map((ing) => calculateSingleIngredientNutrition(ing, scale));

  const totalCalories = Math.round(items.reduce((sum, i) => sum + i.calories, 0));
  const totalProtein = Math.round(items.reduce((sum, i) => sum + i.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(items.reduce((sum, i) => sum + i.carbs, 0) * 10) / 10;
  const totalFat = Math.round(items.reduce((sum, i) => sum + i.fat, 0) * 10) / 10;

  const validServings = Math.max(1, servings);

  const perServingCalories = Math.round(totalCalories / validServings);
  const perServingProtein = Math.round((totalProtein / validServings) * 10) / 10;
  const perServingCarbs = Math.round((totalCarbs / validServings) * 10) / 10;
  const perServingFat = Math.round((totalFat / validServings) * 10) / 10;

  // Macro calorie contributions (Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g)
  const proteinKcal = totalProtein * 4;
  const carbsKcal = totalCarbs * 4;
  const fatKcal = totalFat * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal || 1;

  const macroRatios = {
    proteinPercent: Math.round((proteinKcal / totalMacroKcal) * 100),
    carbsPercent: Math.round((carbsKcal / totalMacroKcal) * 100),
    fatPercent: Math.round((fatKcal / totalMacroKcal) * 100),
  };

  return {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    perServingCalories,
    perServingProtein,
    perServingCarbs,
    perServingFat,
    items,
    macroRatios,
  };
}
