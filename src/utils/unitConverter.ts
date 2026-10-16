import { RecipeIngredient } from '../types';

export type UnitSystem = 'metric' | 'imperial';

export interface ConvertedIngredient {
  name: string;
  quantity: number;
  unit: string;
  originalText?: string;
}

export function convertIngredientUnit(
  ingredient: RecipeIngredient,
  targetSystem: UnitSystem
): ConvertedIngredient {
  const { name, quantity, unit = 'pcs' } = ingredient;
  const u = unit.toLowerCase().trim();

  if (targetSystem === 'imperial') {
    // Convert Metric to Imperial
    if (u === 'g' || u === 'grams' || u === 'gram') {
      const oz = quantity / 28.3495;
      if (oz >= 16) {
        return { name, quantity: Math.round((oz / 16) * 10) / 10, unit: 'lbs' };
      }
      return { name, quantity: Math.round(oz * 10) / 10, unit: 'oz' };
    }
    if (u === 'kg' || u === 'kilograms' || u === 'kilogram') {
      return { name, quantity: Math.round(quantity * 2.20462 * 10) / 10, unit: 'lbs' };
    }
    if (u === 'ml' || u === 'milliliters') {
      if (quantity >= 240) {
        return { name, quantity: Math.round((quantity / 240) * 10) / 10, unit: 'cups' };
      } else if (quantity >= 15) {
        return { name, quantity: Math.round((quantity / 15) * 10) / 10, unit: 'tbsp' };
      } else if (quantity >= 5) {
        return { name, quantity: Math.round((quantity / 5) * 10) / 10, unit: 'tsp' };
      }
      return { name, quantity: Math.round((quantity / 29.5735) * 10) / 10, unit: 'fl oz' };
    }
    if (u === 'l' || u === 'liters' || u === 'liter') {
      return { name, quantity: Math.round((quantity * 4.22675) * 10) / 10, unit: 'cups' };
    }
  } else {
    // Convert Imperial to Metric
    if (u === 'oz' || u === 'ounce' || u === 'ounces') {
      return { name, quantity: Math.round(quantity * 28.3495), unit: 'g' };
    }
    if (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds') {
      if (quantity < 1) {
        return { name, quantity: Math.round(quantity * 453.592), unit: 'g' };
      }
      return { name, quantity: Math.round(quantity * 0.453592 * 10) / 10, unit: 'kg' };
    }
    if (u === 'cup' || u === 'cups') {
      return { name, quantity: Math.round(quantity * 240), unit: 'ml' };
    }
    if (u === 'tbsp' || u === 'tablespoon' || u === 'tablespoons') {
      return { name, quantity: Math.round(quantity * 15), unit: 'ml' };
    }
    if (u === 'tsp' || u === 'teaspoon' || u === 'teaspoons') {
      return { name, quantity: Math.round(quantity * 5), unit: 'ml' };
    }
    if (u === 'fl oz') {
      return { name, quantity: Math.round(quantity * 29.5735), unit: 'ml' };
    }
  }

  // Fallback for pcs, cloves, pinch, etc.
  return { name, quantity, unit };
}
