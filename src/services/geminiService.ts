import { Recipe, InventoryItem, EquipmentItem, FoodPreferences, LifeHubContext } from '../types';

export interface ChatResponse {
  success: boolean;
  text: string;
  action?: {
    type: 'recipe_suggestion' | 'inventory_action';
    recipe?: Partial<Recipe>;
    items?: Array<{ name: string; quantity: number; unit: string }>;
  };
}

export function formatFriendlyError(rawError: any): string {
  if (!rawError) return 'An unexpected error occurred. Please try again.';
  const str = typeof rawError === 'string' ? rawError : rawError.message || String(rawError);
  try {
    const parsed = JSON.parse(str);
    if (parsed.error?.message) {
      if (parsed.error.code === 503 || parsed.error.status === 'UNAVAILABLE') {
        return 'The AI service is experiencing high traffic spikes. Please click Scan again in a few seconds.';
      }
      return parsed.error.message;
    }
  } catch {}
  if (str.includes('503') || str.includes('UNAVAILABLE') || str.includes('high demand')) {
    return 'The AI service is experiencing high traffic spikes. Please click Scan again in a few seconds.';
  }
  return str;
}

export async function sendBiancaMessage(
  message: string,
  history: { role: string; content: string }[],
  context: {
    inventory: InventoryItem[];
    equipment: EquipmentItem[];
    preferences: FoodPreferences;
    lifeHub: LifeHubContext;
    currentCookingSession?: any;
    recipes: Recipe[];
  }
): Promise<ChatResponse> {
  const response = await fetch('/api/bianca/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      ...context,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatFriendlyError(errorData.error || `Server responded with ${response.status}`));
  }

  return response.json();
}

export async function generateRecipeWithBianca(params: {
  prompt: string;
  targetCategory: string;
  maxCookTimeMinutes?: number;
  inventory: InventoryItem[];
  equipment: EquipmentItem[];
  preferences: FoodPreferences;
  lifeHub: LifeHubContext;
}): Promise<Recipe> {
  const response = await fetch('/api/bianca/generate-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatFriendlyError(errorData.error || 'Failed to generate recipe'));
  }

  const data = await response.json();
  const rawRecipe = data.recipe;

  // Add client-side ID and timestamps
  return {
    ...rawRecipe,
    id: `rec-ai-${Date.now().toString(36)}`,
    isFavorite: false,
    isAiGenerated: true,
    createdAt: new Date().toISOString(),
  };
}

export async function fetchLifeHubContext(): Promise<LifeHubContext> {
  const response = await fetch('/api/lifehub/context');
  if (!response.ok) {
    throw new Error('Failed to fetch LifeHub context');
  }
  const result = await response.json();
  return result.data;
}

export async function updateLifeHubContext(updates: Partial<LifeHubContext>): Promise<LifeHubContext> {
  const response = await fetch('/api/lifehub/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update LifeHub context');
  }
  const result = await response.json();
  return result.data;
}

export interface ScanRecipeParams {
  mode: 'file' | 'text' | 'url';
  fileBase64?: string;
  mimeType?: string;
  text?: string;
  url?: string;
}

export async function scanRecipeWithBianca(params: ScanRecipeParams): Promise<Recipe> {
  const response = await fetch('/api/bianca/scan-recipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatFriendlyError(errorData.error || `Server responded with error status ${response.status}`));
  }

  const data = await response.json();
  const raw = data.recipe || {};

  return {
    id: `rec-scanned-${Date.now().toString(36)}`,
    title: raw.title || 'Scanned Recipe',
    description: raw.description || '',
    category: raw.category || 'Dinner',
    cuisine: raw.cuisine || 'International',
    prepTimeMinutes: Number(raw.prepTimeMinutes) || 15,
    cookTimeMinutes: Number(raw.cookTimeMinutes) || 25,
    servings: Number(raw.servings) || 2,
    difficulty: raw.difficulty || 'Medium',
    equipmentNeeded: Array.isArray(raw.equipmentNeeded) ? raw.equipmentNeeded : [],
    caloriesPerServing: Number(raw.caloriesPerServing) || 520,
    proteinGrams: Number(raw.proteinGrams) || 30,
    carbsGrams: Number(raw.carbsGrams) || 45,
    fatGrams: Number(raw.fatGrams) || 16,
    fitnessGoalAlignment: raw.fitnessGoalAlignment || 'Nutritionally balanced meal',
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map((ing: any) => ({
          name: ing.name || 'Ingredient',
          quantity: Number(ing.quantity) || 1,
          unit: ing.unit || 'pcs',
          optional: Boolean(ing.optional),
        }))
      : [],
    instructions: Array.isArray(raw.instructions) ? raw.instructions : [],
    isFavorite: false,
    isAiGenerated: true,
    customNotes: raw.chefTips ? `Chef Tips: ${raw.chefTips}` : undefined,
    createdAt: new Date().toISOString(),
  };
}

export interface ScannedReceiptResult {
  storeName: string;
  purchaseDate: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: 'Produce' | 'Protein & Dairy' | 'Pantry & Grains' | 'Spices & Sauces' | 'Bakery' | 'Other';
    location: 'Fridge' | 'Pantry' | 'Freezer';
    estimatedExpiryDays: number;
    estimatedPrice?: number;
  }>;
}

export async function scanReceiptWithBianca(params: {
  mode: 'file' | 'text';
  fileBase64?: string;
  mimeType?: string;
  text?: string;
}): Promise<ScannedReceiptResult> {
  const response = await fetch('/api/bianca/scan-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatFriendlyError(errorData.error || 'Failed to scan receipt'));
  }

  const data = await response.json();
  return data.receipt;
}

export async function remixLeftoversWithBianca(params: {
  ingredients: string[];
  mealType?: string;
  maxCookTimeMinutes?: number;
  lifeHub?: LifeHubContext;
}): Promise<Recipe> {
  const response = await fetch('/api/bianca/remix-leftovers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(formatFriendlyError(errorData.error || 'Failed to generate zero-waste recipe'));
  }

  const data = await response.json();
  const raw = data.recipe || {};

  return {
    id: `rec-remix-${Date.now().toString(36)}`,
    title: raw.title || 'Fridge Cleanout Dish',
    description: raw.description || 'Rescued leftover ingredients into a delicious meal.',
    category: raw.category || 'Dinner',
    cuisine: raw.cuisine || 'Fusion',
    prepTimeMinutes: Number(raw.prepTimeMinutes) || 10,
    cookTimeMinutes: Number(raw.cookTimeMinutes) || 15,
    servings: Number(raw.servings) || 2,
    difficulty: raw.difficulty || 'Easy',
    equipmentNeeded: Array.isArray(raw.equipmentNeeded) ? raw.equipmentNeeded : ['Frying pan'],
    caloriesPerServing: Number(raw.caloriesPerServing) || 480,
    proteinGrams: Number(raw.proteinGrams) || 35,
    carbsGrams: Number(raw.carbsGrams) || 40,
    fatGrams: Number(raw.fatGrams) || 15,
    fitnessGoalAlignment: raw.fitnessGoalAlignment || 'High protein zero-waste meal',
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map((ing: any) => ({
          name: ing.name || 'Ingredient',
          quantity: Number(ing.quantity) || 1,
          unit: ing.unit || 'pcs',
          optional: Boolean(ing.optional),
        }))
      : [],
    instructions: Array.isArray(raw.instructions) ? raw.instructions : [],
    isFavorite: false,
    isAiGenerated: true,
    customNotes: raw.chefTips ? `Chef Tips: ${raw.chefTips}` : undefined,
    createdAt: new Date().toISOString(),
  };
}
