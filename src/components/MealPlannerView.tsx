import React, { useState } from 'react';
import { 
  Calendar, 
  Sparkles, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Dumbbell, 
  ChevronRight, 
  Flame, 
  CheckCircle2,
  Utensils,
  Clock
} from 'lucide-react';
import { MealPlanItem, Recipe, LifeHubContext, DayOfWeek, MealType } from '../types';

interface MealPlannerViewProps {
  mealPlan: MealPlanItem[];
  recipes: Recipe[];
  lifeHub: LifeHubContext;
  onAddMealItem: (day: DayOfWeek, mealType: MealType, recipeId: string, servings: number) => void;
  onRemoveMealItem: (itemId: string) => void;
  onGenerateShoppingList: () => void;
  onAutoPlanWithBianca: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onStartCooking: (recipe: Recipe) => void;
}

export const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  mealPlan,
  recipes,
  lifeHub,
  onAddMealItem,
  onRemoveMealItem,
  onGenerateShoppingList,
  onAutoPlanWithBianca,
  onSelectRecipe,
  onStartCooking,
}) => {
  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const [activeSlotModal, setActiveSlotModal] = useState<{ day: DayOfWeek; mealType: MealType } | null>(null);

  // Helper to compute daily macros
  const getDailyTotals = (day: DayOfWeek) => {
    const dayItems = mealPlan.filter((m) => m.day === day);
    let totalCalories = 0;
    let totalProtein = 0;

    for (const item of dayItems) {
      const rec = recipes.find((r) => r.id === item.recipeId);
      if (rec) {
        const scale = item.servings / (rec.servings || 1);
        totalCalories += rec.caloriesPerServing * scale;
        totalProtein += rec.proteinGrams * scale;
      }
    }

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      caloriePercent: Math.round((totalCalories / lifeHub.nutrition.calorie_target) * 100),
      proteinPercent: Math.round((totalProtein / lifeHub.nutrition.protein_target) * 100),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
            Weekly Meal Planner
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Plan your weekly menu aligned with your LifeHub target (<span className="text-emerald-400 font-medium">{lifeHub.nutrition.protein_target}g protein</span> / <span className="text-stone-300 font-medium">{lifeHub.nutrition.calorie_target} kcal</span> per day).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onAutoPlanWithBianca}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Auto-Plan with Bianca</span>
          </button>
          <button
            onClick={onGenerateShoppingList}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-xs sm:text-sm transition-colors"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span>Generate Shopping List</span>
          </button>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {days.map((day) => {
          const totals = getDailyTotals(day);
          const dayItems = mealPlan.filter((m) => m.day === day);

          return (
            <div
              key={day}
              className="bg-stone-900 border border-stone-800 rounded-xl flex flex-col justify-between overflow-hidden"
            >
              {/* Day Header */}
              <div className="p-3 border-b border-stone-800 bg-stone-850/60">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-stone-200">{day}</h3>
                  <span className="text-[10px] font-mono text-stone-500">
                    {day === 'Saturday' ? '🌎 Exotic' : day === 'Sunday' ? 'Family Feast' : 'Daily'}
                  </span>
                </div>

                {/* Macro progress mini bar */}
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-stone-400">
                    <span className="text-emerald-400">{totals.protein}g / {lifeHub.nutrition.protein_target}g P</span>
                    <span className="text-stone-300">{totals.calories} kcal</span>
                  </div>
                  <div className="w-full bg-stone-800 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full ${
                        totals.proteinPercent >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, totals.proteinPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Meal Slots */}
              <div className="p-2.5 space-y-2 flex-1">
                {mealTypes.map((mType) => {
                  const item = dayItems.find((i) => i.mealType === mType);
                  const recipe = item ? recipes.find((r) => r.id === item.recipeId) : null;

                  return (
                    <div
                      key={mType}
                      className="p-2 rounded-lg bg-stone-850/40 border border-stone-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono capitalize">
                        <span>{mType}</span>
                        {!item && (
                          <button
                            onClick={() => setActiveSlotModal({ day, mealType: mType })}
                            className="p-1 hover:text-emerald-400 rounded transition-colors"
                            title={`Add ${mType}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {recipe && item ? (
                        <div className="space-y-1.5 pt-0.5">
                          <div
                            onClick={() => onSelectRecipe(recipe)}
                            className="font-medium text-stone-200 hover:text-emerald-300 cursor-pointer line-clamp-1 text-xs"
                          >
                            {recipe.title}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                            <span>
                              {Math.round(recipe.proteinGrams * (item.servings / (recipe.servings || 1)))}g P · {Math.round(recipe.caloriesPerServing * (item.servings / (recipe.servings || 1)))} kcal
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onStartCooking(recipe)}
                                className="p-1 hover:text-emerald-400"
                                title="Cook now"
                              >
                                <Flame className="w-3 h-3 text-emerald-400" />
                              </button>
                              <button
                                onClick={() => onRemoveMealItem(item.id)}
                                className="p-1 hover:text-rose-400 text-stone-500"
                                title="Remove meal"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setActiveSlotModal({ day, mealType: mType })}
                          className="py-1.5 text-center text-[11px] text-stone-600 hover:text-stone-400 cursor-pointer border border-dashed border-stone-800 rounded transition-colors"
                        >
                          + assign
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Day footer */}
              <div className="p-2 border-t border-stone-800/80 text-center">
                <button
                  onClick={() => setActiveSlotModal({ day, mealType: 'dinner' })}
                  className="text-[11px] text-stone-500 hover:text-emerald-400 font-medium"
                >
                  + Add meal to {day}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Recipe Modal */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h2 className="font-serif text-lg font-bold text-stone-100">
                Assign Recipe to {activeSlotModal.day} ({activeSlotModal.mealType})
              </h2>
              <button
                onClick={() => setActiveSlotModal(null)}
                className="text-stone-400 hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 divide-y divide-stone-800">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="pt-2 pb-2 flex items-center justify-between gap-3 hover:bg-stone-850 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-stone-200">{recipe.title}</h4>
                    <div className="text-xs text-stone-400 font-mono">
                      {recipe.cuisine} · {recipe.proteinGrams}g Protein · {recipe.caloriesPerServing} kcal
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onAddMealItem(activeSlotModal.day, activeSlotModal.mealType, recipe.id, recipe.servings || 2);
                      setActiveSlotModal(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
