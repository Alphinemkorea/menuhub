export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';
  cuisine: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  equipmentNeeded: string[];
  caloriesPerServing: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fitnessGoalAlignment: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  isFavorite: boolean;
  isAiGenerated: boolean;
  collections?: string[];
  dietaryTags?: string[];
  modifiedFromId?: string;
  adaptationNote?: string;
  customNotes?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Produce' | 'Protein & Dairy' | 'Pantry & Grains' | 'Spices & Sauces' | 'Bakery' | 'Other';
  quantity: number;
  unit: string;
  expiryDate: string; // YYYY-MM-DD
  location: 'Fridge' | 'Pantry' | 'Freezer';
  estimatedPrice?: number;
  addedDate: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'Stovetop & Cooktop' | 'Oven & Baking' | 'Small Appliances' | 'Cookware & Pans' | 'Prep Tools';
  owned: boolean;
  notes?: string;
}

export interface FoodPreferences {
  allergies: string[];
  dislikes: string[];
  dietaryRestrictions: string[];
  favoriteIngredients: string[];
  favoriteCuisines: string[];
  spiceLevel: 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  cookingStyles: string[];
}

export interface LifeHubContext {
  user_id: string;
  user_name: string;
  source: string;
  last_synced: string;
  isLiveConnection?: boolean;
  customApiUrl?: string;
  fitness: {
    goal: string;
    goal_label: string;
    current_weight: number;
    target_weight: number;
    unit: string;
    weekly_change_target: string;
  };
  activity: {
    level: string;
    workouts_per_week: number;
    primary_discipline: string;
    today_active_energy: string;
  };
  nutrition: {
    calorie_target: number;
    protein_target: number;
    carbs_target: number;
    fats_target: number;
    meal_split: Record<string, { calories: number; protein: number; note: string }>;
  };
  biometrics: {
    hydration_target_liters: number;
    allergies_synced: string[];
    dietary_flags: string[];
  };
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanItem {
  id: string;
  day: DayOfWeek;
  mealType: MealType;
  recipeId: string;
  servings: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantityNeeded: number;
  quantityInStock: number;
  quantityToBuy: number;
  unit: string;
  checked: boolean;
  recipesReferenced: string[];
  isManual?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionData?: {
    type: 'recipe_suggestion' | 'inventory_action';
    action?: 'add' | 'remove';
    recipe?: Partial<Recipe>;
    items?: Array<{ name: string; quantity: number; unit: string }>;
  };
}

export interface CookingSession {
  recipeId: string;
  currentStepIndex: number;
  startedAt: string;
  completedSteps: number[];
  notes?: string;
}
