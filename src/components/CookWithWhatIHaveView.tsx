import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Flame, 
  Wrench, 
  Clock, 
  Dumbbell, 
  ArrowRight,
  ShieldAlert,
  Utensils
} from 'lucide-react';
import { Recipe, InventoryItem, EquipmentItem, LifeHubContext, FoodPreferences } from '../types';
import { calculateIngredientMatch, checkEquipmentCompatibility, checkDietaryConflicts } from '../utils/recipeUtils';

interface CookWithWhatIHaveViewProps {
  recipes: Recipe[];
  inventory: InventoryItem[];
  equipment: EquipmentItem[];
  preferences: FoodPreferences;
  lifeHub: LifeHubContext;
  onStartCooking: (recipe: Recipe) => void;
  onAddMissingToShoppingList: (items: { name: string; quantity: number; unit: string }[], recipeTitle: string) => void;
  onOpenRecipeDetail: (recipe: Recipe) => void;
  onAskBiancaForSubstitutes: (recipe: Recipe) => void;
}

export const CookWithWhatIHaveView: React.FC<CookWithWhatIHaveViewProps> = ({
  recipes,
  inventory,
  equipment,
  preferences,
  lifeHub,
  onStartCooking,
  onAddMissingToShoppingList,
  onOpenRecipeDetail,
  onAskBiancaForSubstitutes,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'ready' | 'high'>('all');

  // Compute matches for all recipes
  const matches = recipes.map((recipe) => {
    const match = calculateIngredientMatch(recipe, inventory);
    const equip = checkEquipmentCompatibility(recipe, equipment);
    const conflict = checkDietaryConflicts(recipe, preferences);
    return {
      recipe,
      match,
      equip,
      conflict,
    };
  });

  // Sort by highest percentage match first
  const sortedMatches = [...matches].sort((a, b) => b.match.percentage - a.match.percentage);

  // Filter based on selected mode
  const filteredMatches = sortedMatches.filter((item) => {
    if (filterMode === 'ready') return item.match.percentage === 100;
    if (filterMode === 'high') return item.match.percentage >= 75;
    return true;
  });

  // Find expiring items
  const expiringSoon = inventory.filter((item) => {
    if (!item.expiryDate) return false;
    const diffDays = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
    return diffDays <= 3 && diffDays >= 0;
  });

  // Recipes that use expiring items
  const recipesUsingExpiring = matches.filter(({ recipe }) => {
    return recipe.ingredients.some((ing) =>
      expiringSoon.some((exp) => exp.name.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(exp.name.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Instant Pantry Match Engine</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight mb-2">
            Cook With What You Have
          </h1>
          <p className="text-sm text-stone-400 leading-relaxed mb-4">
            MenuHub scans your real-time inventory against your recipe library and cross-references your owned kitchen equipment with your LifeHub target of <span className="text-emerald-400 font-medium">{lifeHub.nutrition.protein_target}g protein</span> and <span className="text-stone-300 font-medium">{lifeHub.nutrition.calorie_target} kcal</span>.
          </p>

          {/* Quick summary stats */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-300 font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{matches.filter((m) => m.match.percentage === 100).length} Ready to Cook (100%)</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>{matches.filter((m) => m.match.percentage >= 70 && m.match.percentage < 100).length} Almost Ready (70-99%)</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700/60 flex items-center gap-2">
              <span className="text-stone-400">Inventory Items:</span>
              <span className="text-stone-200 font-semibold">{inventory.length} tracked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Soon Action Banner */}
      {expiringSoon.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-200">
                Pantry Expiry Alert: {expiringSoon.map((e) => `${e.name} (${e.quantity} ${e.unit})`).join(', ')}
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                These ingredients are expiring within 72 hours. We found {recipesUsingExpiring.length} recipe{recipesUsingExpiring.length === 1 ? '' : 's'} to use them before they go to waste.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterMode('all')}
            className="self-start md:self-auto px-3.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/50 text-amber-200 text-xs font-medium transition-colors whitespace-nowrap"
          >
            Review Expiring Recipes
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-lg">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterMode === 'all'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All Recipes ({matches.length})
          </button>
          <button
            onClick={() => setFilterMode('ready')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterMode === 'ready'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Ready to Cook (100% in stock)
          </button>
          <button
            onClick={() => setFilterMode('high')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterMode === 'high'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            High Match (&gt;= 75%)
          </button>
        </div>

        <div className="text-xs text-stone-400">
          Showing {filteredMatches.length} matching recipe{filteredMatches.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Recipe Cards Grid or Fresh Empty States */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
          <Utensils className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">Your Recipe Library is Brand New</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            You don't have any recipes saved yet. Add your favorite meals or ask Bianca AI to generate a personalized recipe!
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
          <Utensils className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">No Matching Recipes</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            {inventory.length === 0 
              ? "Your pantry inventory is currently empty. Add ingredients to see match percentages and what you can cook!"
              : "No recipes matched the selected filter. Try selecting 'All Recipes'."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMatches.map(({ recipe, match, equip, conflict }) => {
            const is100 = match.percentage === 100;
          return (
            <div
              key={recipe.id}
              className={`flex flex-col justify-between rounded-xl border bg-stone-900/80 transition-all ${
                is100
                  ? 'border-emerald-700/60 shadow-lg shadow-emerald-950/20'
                  : 'border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Header row */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-stone-400 font-medium">
                      {recipe.cuisine} · {recipe.category}
                    </span>
                    {/* Match percentage indicator */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-mono font-semibold ${
                          is100
                            ? 'text-emerald-400'
                            : match.percentage >= 70
                            ? 'text-amber-400'
                            : 'text-stone-400'
                        }`}
                      >
                        {match.percentage}% match
                      </span>
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-stone-100 leading-snug line-clamp-1">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                    {recipe.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        is100 ? 'bg-emerald-500' : match.percentage >= 70 ? 'bg-amber-500' : 'bg-stone-600'
                      }`}
                      style={{ width: `${match.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-400 font-mono">
                    <span>{match.matchedCount} of {match.totalCount} in kitchen</span>
                    <span>{match.missingIngredients.length} missing</span>
                  </div>
                </div>

                {/* Macro summary & LifeHub contribution */}
                <div className="p-2.5 rounded-lg bg-stone-850 border border-stone-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-stone-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">{recipe.proteinGrams}g Protein</span>
                      <span className="text-stone-500">·</span>
                      <span className="text-stone-300">{recipe.caloriesPerServing} kcal</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 leading-tight">
                    {recipe.fitnessGoalAlignment}
                  </div>
                </div>

                {/* Dietary Conflict Warning */}
                {(conflict.hasDislike || conflict.hasAllergy) && (
                  <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span>{conflict.hasAllergy ? `Contains allergen: ${conflict.allergicItems.join(', ')}` : `Contains disliked food: ${conflict.dislikedItems.join(', ')}`}</span>
                    </div>
                  </div>
                )}

                {/* Equipment Check Warning */}
                {!equip.isCompatible && (
                  <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span>Requires {equip.missingEquipment.join(', ')} (not in your kitchen).</span>
                      <button
                        onClick={() => onAskBiancaForSubstitutes(recipe)}
                        className="block mt-1 underline hover:text-amber-200 text-[11px]"
                      >
                        Ask Bianca to adapt for stovetop/pan
                      </button>
                    </div>
                  </div>
                )}

                {/* In stock vs Missing breakdown preview */}
                <div className="space-y-1 text-xs">
                  {match.missingIngredients.length > 0 && (
                    <div className="text-stone-400">
                      <span className="text-amber-400/90 font-medium">Missing: </span>
                      {match.missingIngredients.map((m) => `${m.name} (${m.requiredQty} ${m.unit})`).join(', ')}
                    </div>
                  )}
                  {match.availableIngredients.length > 0 && (
                    <div className="text-stone-400 line-clamp-1">
                      <span className="text-emerald-400/90 font-medium">Have: </span>
                      {match.availableIngredients.map((a) => a.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-stone-800 bg-stone-900/40 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenRecipeDetail(recipe)}
                  className="px-3 py-1.5 rounded-lg text-xs text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  View Details
                </button>

                <div className="flex items-center gap-2">
                  {match.missingIngredients.length > 0 && (
                    <button
                      onClick={() =>
                        onAddMissingToShoppingList(
                          match.missingIngredients.map((m) => ({
                            name: m.name,
                            quantity: m.requiredQty,
                            unit: m.unit,
                          })),
                          recipe.title
                        )
                      }
                      title="Add missing ingredients to shopping list"
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs transition-colors flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Add to List</span>
                    </button>
                  )}

                  <button
                    onClick={() => onStartCooking(recipe)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      is100
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{is100 ? 'Cook Now' : 'Cook Anyway'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
