import { Recipe, InventoryItem, EquipmentItem, FoodPreferences, LifeHubContext, MealPlanItem } from '../types';

export const initialRecipes: Recipe[] = [];

export const initialInventory: InventoryItem[] = [];

export const initialEquipment: EquipmentItem[] = [
  { id: 'eq-1', name: 'Gas cooker', category: 'Stovetop & Cooktop', owned: true },
  { id: 'eq-2', name: 'Frying pan', category: 'Cookware & Pans', owned: true },
  { id: 'eq-3', name: 'Pots', category: 'Cookware & Pans', owned: true },
  { id: 'eq-4', name: 'Oven', category: 'Oven & Baking', owned: false },
  { id: 'eq-5', name: 'Microwave', category: 'Small Appliances', owned: false },
  { id: 'eq-6', name: 'Air fryer', category: 'Small Appliances', owned: false },
  { id: 'eq-7', name: 'Blender', category: 'Small Appliances', owned: false },
  { id: 'eq-8', name: 'Rice cooker', category: 'Small Appliances', owned: false },
  { id: 'eq-9', name: 'Pressure cooker', category: 'Cookware & Pans', owned: false },
];

export const initialPreferences: FoodPreferences = {
  allergies: [],
  dislikes: [],
  dietaryRestrictions: [],
  favoriteIngredients: [],
  favoriteCuisines: [],
  spiceLevel: 'Medium',
  cookingStyles: [],
};

export const initialLifeHubContext: LifeHubContext = {
  user_id: '',
  user_name: '',
  source: 'LifeHub Connection Pending',
  last_synced: new Date().toISOString(),
  isLiveConnection: false,
  fitness: {
    goal: 'maintenance',
    goal_label: 'Target Wellness & Fitness',
    current_weight: 0,
    target_weight: 0,
    unit: 'kg',
    weekly_change_target: '0 kg/week',
  },
  activity: {
    level: 'moderate',
    workouts_per_week: 3,
    primary_discipline: 'General Fitness',
    today_active_energy: '0 kcal burned',
  },
  nutrition: {
    calorie_target: 2000,
    protein_target: 120,
    carbs_target: 250,
    fats_target: 65,
    meal_split: {
      breakfast: { calories: 500, protein: 30, note: 'Morning energizer' },
      lunch: { calories: 650, protein: 40, note: 'Midday meal' },
      dinner: { calories: 650, protein: 40, note: 'Evening recovery' },
      snack: { calories: 200, protein: 10, note: 'Light fuel' },
    },
  },
  biometrics: {
    hydration_target_liters: 2.5,
    allergies_synced: [],
    dietary_flags: [],
  },
};

export const initialMealPlan: MealPlanItem[] = [];
