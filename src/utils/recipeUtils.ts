import { Recipe, InventoryItem, EquipmentItem, MealPlanItem, ShoppingItem } from '../types';

// Normalize ingredient names for fuzzy comparison
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]*\)/g, '') // remove parens like (cooked)
    .replace(/s\b/g, ''); // simple plural trim
}

// Check ingredient availability
export function calculateIngredientMatch(
  recipe: Recipe,
  inventory: InventoryItem[]
): {
  percentage: number;
  matchedCount: number;
  totalCount: number;
  availableIngredients: { name: string; requiredQty: number; unit: string; inStockQty: number }[];
  missingIngredients: { name: string; requiredQty: number; unit: string }[];
  canMakeNow: boolean;
} {
  const totalCount = recipe.ingredients.length;
  if (totalCount === 0) {
    return {
      percentage: 100,
      matchedCount: 0,
      totalCount: 0,
      availableIngredients: [],
      missingIngredients: [],
      canMakeNow: true,
    };
  }

  const availableIngredients: { name: string; requiredQty: number; unit: string; inStockQty: number }[] = [];
  const missingIngredients: { name: string; requiredQty: number; unit: string }[] = [];

  for (const ing of recipe.ingredients) {
    const normIng = normalizeName(ing.name);
    // Find matching inventory item
    const matchedInv = inventory.find((inv) => {
      const normInv = normalizeName(inv.name);
      return normInv.includes(normIng) || normIng.includes(normInv);
    });

    if (matchedInv && matchedInv.quantity > 0) {
      availableIngredients.push({
        name: ing.name,
        requiredQty: ing.quantity,
        unit: ing.unit,
        inStockQty: matchedInv.quantity,
      });
    } else {
      if (!ing.optional) {
        missingIngredients.push({
          name: ing.name,
          requiredQty: ing.quantity,
          unit: ing.unit,
        });
      }
    }
  }

  const matchedCount = availableIngredients.length;
  const percentage = Math.round((matchedCount / totalCount) * 100);
  const canMakeNow = missingIngredients.length === 0;

  return {
    percentage,
    matchedCount,
    totalCount,
    availableIngredients,
    missingIngredients,
    canMakeNow,
  };
}

// Check equipment compatibility
export function checkEquipmentCompatibility(
  recipe: Recipe,
  equipment: EquipmentItem[]
): {
  isCompatible: boolean;
  missingEquipment: string[];
} {
  const missingEquipment: string[] = [];

  for (const reqEq of recipe.equipmentNeeded) {
    const normReq = reqEq.toLowerCase().trim();
    const found = equipment.find((eq) => {
      const normEq = eq.name.toLowerCase().trim();
      return (normEq.includes(normReq) || normReq.includes(normEq)) && eq.owned;
    });

    if (!found) {
      missingEquipment.push(reqEq);
    }
  }

  return {
    isCompatible: missingEquipment.length === 0,
    missingEquipment,
  };
}

// Generate smart shopping list subtracting current inventory
export function generateSmartShoppingList(
  mealPlan: MealPlanItem[],
  recipes: Recipe[],
  inventory: InventoryItem[]
): ShoppingItem[] {
  // Map of normalized ingredient name -> accumulated need
  const neededMap = new Map<
    string,
    {
      displayName: string;
      totalNeeded: number;
      unit: string;
      recipes: string[];
      category: string;
    }
  >();

  // Aggregate ingredients required across the planned meals
  for (const item of mealPlan) {
    const recipe = recipes.find((r) => r.id === item.recipeId);
    if (!recipe) continue;

    const scaleFactor = item.servings / (recipe.servings || 1);

    for (const ing of recipe.ingredients) {
      const norm = normalizeName(ing.name);
      const scaledQty = ing.quantity * scaleFactor;

      if (!neededMap.has(norm)) {
        neededMap.set(norm, {
          displayName: ing.name,
          totalNeeded: scaledQty,
          unit: ing.unit,
          recipes: [recipe.title],
          category: guessCategory(ing.name),
        });
      } else {
        const entry = neededMap.get(norm)!;
        entry.totalNeeded += scaledQty;
        if (!entry.recipes.includes(recipe.title)) {
          entry.recipes.push(recipe.title);
        }
      }
    }
  }

  const shoppingList: ShoppingItem[] = [];

  // Compare against inventory
  for (const [norm, data] of neededMap.entries()) {
    // Find matching inventory
    const matchedInv = inventory.find((inv) => {
      const normInv = normalizeName(inv.name);
      return normInv.includes(norm) || norm.includes(normInv);
    });

    let inStockQty = 0;
    if (matchedInv) {
      // Normalize units if needed (kg -> g, etc.)
      if (matchedInv.unit === 'kg' && data.unit === 'g') {
        inStockQty = matchedInv.quantity * 1000;
      } else if (matchedInv.unit === 'g' && data.unit === 'kg') {
        inStockQty = matchedInv.quantity / 1000;
      } else {
        inStockQty = matchedInv.quantity;
      }
    }

    const deficit = data.totalNeeded - inStockQty;

    // Only add to shopping list if there is a deficit
    if (deficit > 0) {
      shoppingList.push({
        id: `shop-${norm}-${Date.now().toString(36)}`,
        name: data.displayName,
        category: data.category,
        quantityNeeded: Math.round(data.totalNeeded * 10) / 10,
        quantityInStock: Math.round(inStockQty * 10) / 10,
        quantityToBuy: Math.round(deficit * 10) / 10,
        unit: data.unit,
        checked: false,
        recipesReferenced: data.recipes,
      });
    }
  }

  return shoppingList;
}

// Compare two shopping lists to prevent unnecessary re-renders
export function areShoppingListsEqual(a: ShoppingItem[], b: ShoppingItem[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (
      itemA.name !== itemB.name ||
      itemA.quantityToBuy !== itemB.quantityToBuy ||
      itemA.quantityInStock !== itemB.quantityInStock ||
      itemA.checked !== itemB.checked ||
      itemA.isManual !== itemB.isManual
    ) {
      return false;
    }
  }
  return true;
}

// Real-time synchronization of shopping list from meal plan and inventory
export function syncSmartShoppingList(
  mealPlan: MealPlanItem[],
  recipes: Recipe[],
  inventory: InventoryItem[],
  currentList: ShoppingItem[]
): ShoppingItem[] {
  const generated = generateSmartShoppingList(mealPlan, recipes, inventory);

  // Preserve checked status and existing IDs
  const syncedGenerated = generated.map((genItem) => {
    const normGen = normalizeName(genItem.name);
    const existing = currentList.find((c) => normalizeName(c.name) === normGen && !c.isManual);
    if (existing) {
      return {
        ...genItem,
        id: existing.id,
        checked: existing.checked,
      };
    }
    return genItem;
  });

  // Preserve manual items added by the user
  const manualItems = currentList.filter((item) => item.isManual);

  const combined = [...syncedGenerated, ...manualItems];

  if (areShoppingListsEqual(currentList, combined)) {
    return currentList;
  }
  return combined;
}

// Check dietary conflicts against user food preferences
export function checkDietaryConflicts(
  recipe: Recipe,
  preferences: { dislikes: string[]; allergies: string[] }
): {
  hasDislike: boolean;
  dislikedItems: string[];
  hasAllergy: boolean;
  allergicItems: string[];
} {
  const dislikedItems: string[] = [];
  const allergicItems: string[] = [];

  for (const ing of recipe.ingredients) {
    const normIng = normalizeName(ing.name);

    for (const dis of preferences.dislikes) {
      const normDis = normalizeName(dis);
      if (normIng.includes(normDis) || normDis.includes(normIng)) {
        if (!dislikedItems.includes(dis)) dislikedItems.push(dis);
      }
    }

    for (const all of preferences.allergies) {
      const normAll = normalizeName(all);
      if (normIng.includes(normAll) || normAll.includes(normIng)) {
        if (!allergicItems.includes(all)) allergicItems.push(all);
      }
    }
  }

  return {
    hasDislike: dislikedItems.length > 0,
    dislikedItems,
    hasAllergy: allergicItems.length > 0,
    allergicItems,
  };
}

function guessCategory(name: string): string {
  const lower = name.toLowerCase();
  if (/tomato|onion|garlic|pepper|cilantro|lemon|herb|spinach|carrot|potato|lettuce/.test(lower)) return 'Produce';
  if (/chicken|beef|egg|milk|cheese|yogurt|fish|meat|pork|tofu/.test(lower)) return 'Protein & Dairy';
  if (/rice|flour|pasta|bean|lentil|couscous|oat|sugar|noodle/.test(lower)) return 'Pantry & Grains';
  if (/oil|sauce|soy|vinegar|salt|cumin|curry|paprika|spice|pepper/.test(lower)) return 'Spices & Condiments';
  if (/bread|toast|bun|chapati|tortilla/.test(lower)) return 'Bakery';
  return 'Other';
}
