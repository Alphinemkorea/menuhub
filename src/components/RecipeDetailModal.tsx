import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Flame, 
  CalendarPlus, 
  Heart, 
  Dumbbell, 
  Wrench, 
  Check, 
  Sparkles, 
  Minus, 
  Plus, 
  UtensilsCrossed, 
  Trash2,
  Wheat,
  Droplets,
  PieChart,
  ChevronDown,
  ChevronUp,
  Info,
  Edit3,
  Printer
} from 'lucide-react';
import { Recipe, InventoryItem, EquipmentItem, LifeHubContext } from '../types';
import { calculateIngredientMatch, checkEquipmentCompatibility } from '../utils/recipeUtils';
import { calculateTotalRecipeNutrition } from '../utils/nutritionUtils';
import { convertIngredientUnit, UnitSystem } from '../utils/unitConverter';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  inventory: InventoryItem[];
  equipment: EquipmentItem[];
  lifeHub: LifeHubContext;
  onToggleFavorite: (recipeId: string) => void;
  onStartCooking: (recipe: Recipe) => void;
  onAddToMealPlan: (recipe: Recipe) => void;
  onDeleteRecipe?: (recipeId: string) => void;
  onEditRecipe?: (recipe: Recipe) => void;
  onAskBiancaToAdapt: (recipe: Recipe, prompt: string) => void;
  onAddMissingToShoppingList: (items: { name: string; quantity: number; unit: string }[], recipeTitle: string) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  inventory,
  equipment,
  lifeHub,
  onToggleFavorite,
  onStartCooking,
  onAddToMealPlan,
  onDeleteRecipe,
  onEditRecipe,
  onAskBiancaToAdapt,
  onAddMissingToShoppingList,
}) => {
  if (!recipe) return null;

  const [servings, setServings] = useState(recipe.servings || 2);
  const [nutritionViewMode, setNutritionViewMode] = useState<'perServing' | 'total'>('perServing');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [showIngredientTable, setShowIngredientTable] = useState(false);

  const scale = servings / (recipe.servings || 1);

  const match = calculateIngredientMatch(recipe, inventory);
  const equip = checkEquipmentCompatibility(recipe, equipment);

  // Calculate total and per-serving nutritional breakdown drawn directly from ingredient data
  const nutrition = calculateTotalRecipeNutrition(recipe.ingredients, servings, scale);

  // Values based on active toggle
  const activeCalories = nutritionViewMode === 'perServing' ? nutrition.perServingCalories : nutrition.totalCalories;
  const activeProtein = nutritionViewMode === 'perServing' ? nutrition.perServingProtein : nutrition.totalProtein;
  const activeCarbs = nutritionViewMode === 'perServing' ? nutrition.perServingCarbs : nutrition.totalCarbs;
  const activeFat = nutritionViewMode === 'perServing' ? nutrition.perServingFat : nutrition.totalFat;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex items-start justify-between gap-4 bg-stone-900 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-400 font-medium mb-1">
              <span>{recipe.cuisine}</span>
              <span>·</span>
              <span>{recipe.category}</span>
              {recipe.isAiGenerated && (
                <>
                  <span>·</span>
                  <span className="text-emerald-400 font-mono">Bianca Generated</span>
                </>
              )}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
              {recipe.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-stone-100 border border-stone-700/70 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Print or save PDF recipe card"
            >
              <Printer className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Print Card</span>
            </button>
            {onEditRecipe && (
              <button
                onClick={() => onEditRecipe(recipe)}
                className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-emerald-400 border border-stone-700/70 transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Edit recipe details, ingredients, or instructions"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Edit Recipe</span>
              </button>
            )}
            <button
              onClick={() => onToggleFavorite(recipe.id)}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-rose-400 transition-colors"
              title={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-5 h-5 ${recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Description & Adaptation note */}
          <p className="text-sm text-stone-300 leading-relaxed">
            {recipe.description}
          </p>

          {recipe.adaptationNote && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>{recipe.adaptationNote}</div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-stone-850/80 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-400 block mb-0.5">Total Time</span>
              <span className="font-mono text-sm font-semibold text-stone-100">
                {recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins
              </span>
            </div>
            <div className="p-3 rounded-xl bg-stone-850/80 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-400 block mb-0.5">Difficulty</span>
              <span className="text-sm font-semibold text-stone-100">{recipe.difficulty}</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-850/80 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-400 block mb-0.5">Servings</span>
              <span className="font-mono text-sm font-semibold text-stone-100">
                {servings} serving{servings > 1 ? 's' : ''}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-stone-850/80 border border-stone-800 text-center">
              <span className="text-[11px] text-stone-400 block mb-0.5">Pantry Match</span>
              <span className={`font-mono text-sm font-semibold ${match.percentage === 100 ? 'text-emerald-400' : match.percentage >= 70 ? 'text-amber-400' : 'text-stone-300'}`}>
                {match.percentage}% in stock
              </span>
            </div>
          </div>

          {/* TOTAL NUTRITIONAL BREAKDOWN (Calculated from Ingredient Data) */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-serif text-base font-bold text-stone-100">
                    Nutritional Breakdown
                  </h3>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    Ingredient-Derived
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Calculated from exact quantities of {recipe.ingredients.length} recipe ingredients.
                </p>
              </div>

              {/* View Mode Toggle: Per Serving vs Total Recipe */}
              <div className="flex items-center gap-1 p-1 bg-stone-800 border border-stone-700/80 rounded-lg self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setNutritionViewMode('perServing')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    nutritionViewMode === 'perServing'
                      ? 'bg-stone-900 text-emerald-400 font-semibold shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Per Serving
                </button>
                <button
                  type="button"
                  onClick={() => setNutritionViewMode('total')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    nutritionViewMode === 'total'
                      ? 'bg-stone-900 text-emerald-400 font-semibold shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Recipe Total ({servings}x)
                </button>
              </div>
            </div>

            {/* 4 Main Macro Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Calories */}
              <div className="p-3.5 rounded-xl bg-stone-850 border border-stone-800/90 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Calories</span>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="font-mono text-xl font-bold text-stone-100">
                  {activeCalories} <span className="text-xs font-normal text-stone-400">kcal</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  {nutritionViewMode === 'perServing' ? `Total: ${nutrition.totalCalories} kcal` : `${nutrition.perServingCalories} kcal / serving`}
                </div>
              </div>

              {/* Protein */}
              <div className="p-3.5 rounded-xl bg-stone-850 border border-emerald-900/40 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Protein</span>
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-mono text-xl font-bold text-emerald-400">
                  {activeProtein} <span className="text-xs font-normal text-emerald-400/80">g</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  {Math.round((nutrition.perServingProtein / lifeHub.nutrition.protein_target) * 100)}% of LifeHub goal
                </div>
              </div>

              {/* Carbohydrates */}
              <div className="p-3.5 rounded-xl bg-stone-850 border border-stone-800/90 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Carbohydrates</span>
                  <Wheat className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="font-mono text-xl font-bold text-amber-300">
                  {activeCarbs} <span className="text-xs font-normal text-amber-300/80">g</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  {nutrition.macroRatios.carbsPercent}% of energy
                </div>
              </div>

              {/* Fats */}
              <div className="p-3.5 rounded-xl bg-stone-850 border border-stone-800/90 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Fats</span>
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="font-mono text-xl font-bold text-sky-300">
                  {activeFat} <span className="text-xs font-normal text-sky-300/80">g</span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">
                  {nutrition.macroRatios.fatPercent}% of energy
                </div>
              </div>
            </div>

            {/* Macro Ratio Stacked Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-stone-400">
                <span>Macronutrient Ratio</span>
                <span>
                  <span className="text-emerald-400">{nutrition.macroRatios.proteinPercent}% Protein</span>
                  <span className="mx-1.5 text-stone-600">·</span>
                  <span className="text-amber-400">{nutrition.macroRatios.carbsPercent}% Carbs</span>
                  <span className="mx-1.5 text-stone-600">·</span>
                  <span className="text-sky-400">{nutrition.macroRatios.fatPercent}% Fat</span>
                </span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${nutrition.macroRatios.proteinPercent}%` }}
                  title={`Protein: ${nutrition.macroRatios.proteinPercent}%`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${nutrition.macroRatios.carbsPercent}%` }}
                  title={`Carbs: ${nutrition.macroRatios.carbsPercent}%`}
                />
                <div
                  className="bg-sky-500 h-full transition-all duration-300"
                  style={{ width: `${nutrition.macroRatios.fatPercent}%` }}
                  title={`Fat: ${nutrition.macroRatios.fatPercent}%`}
                />
              </div>
            </div>

            {/* Expandable Ingredient-by-Ingredient Breakdown Table */}
            <div className="pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowIngredientTable(!showIngredientTable)}
                className="w-full flex items-center justify-between text-xs text-stone-300 hover:text-emerald-400 py-1 transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Info className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Ingredient-by-Ingredient Nutritional Breakdown</span>
                </span>
                {showIngredientTable ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>

              {showIngredientTable && (
                <div className="mt-3 overflow-x-auto border border-stone-800 rounded-xl bg-stone-950/60">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-stone-850/80 text-stone-400 border-b border-stone-800">
                      <tr>
                        <th className="py-2 px-3 font-medium">Ingredient</th>
                        <th className="py-2 px-3 font-medium text-right">Scaled Amount</th>
                        <th className="py-2 px-3 font-medium text-right text-stone-200">Calories</th>
                        <th className="py-2 px-3 font-medium text-right text-emerald-400">Protein</th>
                        <th className="py-2 px-3 font-medium text-right text-amber-300">Carbs</th>
                        <th className="py-2 px-3 font-medium text-right text-sky-300">Fat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80">
                      {nutrition.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-900/60 transition-colors">
                          <td className="py-2 px-3 text-stone-200 font-sans font-medium">{item.name}</td>
                          <td className="py-2 px-3 text-right text-stone-400">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2 px-3 text-right text-stone-200">{item.calories} kcal</td>
                          <td className="py-2 px-3 text-right text-emerald-400">{item.protein}g</td>
                          <td className="py-2 px-3 text-right text-amber-300">{item.carbs}g</td>
                          <td className="py-2 px-3 text-right text-sky-300">{item.fat}g</td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr className="bg-stone-850/90 font-bold border-t border-stone-700">
                        <td className="py-2 px-3 text-stone-100 font-sans">
                          Recipe Total ({servings} servings)
                        </td>
                        <td className="py-2 px-3 text-right text-stone-400">—</td>
                        <td className="py-2 px-3 text-right text-stone-100">{nutrition.totalCalories} kcal</td>
                        <td className="py-2 px-3 text-right text-emerald-400">{nutrition.totalProtein}g</td>
                        <td className="py-2 px-3 text-right text-amber-300">{nutrition.totalCarbs}g</td>
                        <td className="py-2 px-3 text-right text-sky-300">{nutrition.totalFat}g</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* LifeHub Fitness Contribution Banner */}
          <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 flex items-start gap-3">
            <Dumbbell className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-stone-200">
                LifeHub Fitness Target Contribution ({lifeHub.fitness.goal_label})
              </div>
              <p className="text-stone-400 leading-relaxed">
                {recipe.fitnessGoalAlignment || 'Balanced macronutrient fuel supporting daily requirements.'}
              </p>
              <div className="font-mono text-[11px] text-stone-400 pt-1">
                One serving provides <span className="text-emerald-400 font-semibold">{nutrition.perServingProtein}g protein</span> ({Math.round((nutrition.perServingProtein / lifeHub.nutrition.protein_target) * 100)}% of your daily {lifeHub.nutrition.protein_target}g target) and <span className="text-stone-300 font-semibold">{nutrition.perServingCalories} kcal</span>.
              </div>
            </div>
          </div>

          {/* Equipment Check */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-mono tracking-wider text-stone-400">
              Kitchen Equipment
            </h3>
            <div className="flex flex-wrap gap-2">
              {recipe.equipmentNeeded.map((eq) => {
                const isOwned = equipment.some(
                  (item) => item.name.toLowerCase().includes(eq.toLowerCase()) && item.owned
                );
                return (
                  <span
                    key={eq}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${
                      isOwned
                        ? 'bg-stone-800 border-stone-700 text-stone-300'
                        : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{eq}</span>
                    {!isOwned && <span className="text-[10px] opacity-80">(missing)</span>}
                  </span>
                );
              })}
            </div>
            {!equip.isCompatible && (
              <div className="text-xs text-amber-400 flex items-center justify-between pt-1">
                <span>You lack equipment for this recipe: {equip.missingEquipment.join(', ')}</span>
                <button
                  onClick={() =>
                    onAskBiancaToAdapt(
                      recipe,
                      `Adapt ${recipe.title} to cook on stovetop or skillet without ${equip.missingEquipment.join(', ')}`
                    )
                  }
                  className="underline hover:text-amber-200 font-medium"
                >
                  Adapt with Bianca
                </button>
              </div>
            )}
          </div>

          {/* Servings Scaler & Ingredients Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase font-mono tracking-wider text-stone-400">
                  Ingredients Required
                </h3>
                <span className="text-[11px] text-stone-500">
                  Nutritional values scale dynamically with servings
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Unit System Switcher */}
                <div className="flex items-center rounded-lg bg-stone-850 p-0.5 border border-stone-700 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setUnitSystem('metric')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      unitSystem === 'metric'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Metric (g, ml)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitSystem('imperial')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors ${
                      unitSystem === 'imperial'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Imperial (oz, cups)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">Servings:</span>
                  <div className="flex items-center gap-2 bg-stone-800 border border-stone-700 rounded-lg p-1">
                    <button
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      className="p-1 hover:bg-stone-700 rounded text-stone-300"
                      title="Decrease servings"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-semibold px-1 text-stone-100">
                      {servings}
                    </span>
                    <button
                      onClick={() => setServings(servings + 1)}
                      className="p-1 hover:bg-stone-700 rounded text-stone-300"
                      title="Increase servings"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-stone-800 border border-stone-800 rounded-xl overflow-hidden bg-stone-900/60">
              {recipe.ingredients.map((ing, idx) => {
                const scaledQty = Math.round(ing.quantity * scale * 10) / 10;
                const converted = convertIngredientUnit({ ...ing, quantity: scaledQty }, unitSystem);
                const inPantry = inventory.some((inv) =>
                  inv.name.toLowerCase().includes(ing.name.toLowerCase()) ||
                  ing.name.toLowerCase().includes(inv.name.toLowerCase())
                );
                const ingNutr = nutrition.items[idx];

                return (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between text-xs hover:bg-stone-850 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          inPantry ? 'bg-emerald-400' : 'bg-stone-600'
                        }`}
                      />
                      <div>
                        <span className="font-medium text-stone-200">{converted.name}</span>
                        {ing.optional && (
                          <span className="text-[10px] text-stone-500 italic ml-1">(optional)</span>
                        )}
                        {ingNutr && (
                          <div className="text-[11px] font-mono text-stone-500">
                            {ingNutr.calories} kcal · {ingNutr.protein}g P · {ingNutr.carbs}g C · {ingNutr.fat}g F
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-stone-300 font-medium">
                        {converted.quantity} {converted.unit}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          inPantry
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {inPantry ? 'In pantry' : 'Missing'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {match.missingIngredients.length > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-stone-400 font-mono">
                  {match.missingIngredients.length} item{match.missingIngredients.length === 1 ? '' : 's'} missing from your pantry
                </span>
                <button
                  onClick={() =>
                    onAddMissingToShoppingList(
                      match.missingIngredients.map((m) => ({
                        name: m.name,
                        quantity: m.requiredQty * scale,
                        unit: m.unit,
                      })),
                      recipe.title
                    )
                  }
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium underline"
                >
                  + Add missing to shopping list
                </button>
              </div>
            )}
          </div>

          {/* Cooking Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-stone-400">
              Preparation Steps
            </h3>
            <ol className="space-y-3">
              {recipe.instructions.map((step, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-stone-850/60 border border-stone-800/80 flex items-start gap-3 text-xs leading-relaxed text-stone-300"
                >
                  <span className="w-5 h-5 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center font-mono text-[11px] font-semibold text-stone-300 shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Bianca AI Adaptation Actions */}
          <div className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Modify with Bianca AI</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() =>
                  onAskBiancaToAdapt(
                    recipe,
                    `Adapt "${recipe.title}" to increase protein density toward 60g while keeping the flavor profile.`
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 transition-colors"
              >
                Boost Protein Content
              </button>
              <button
                onClick={() =>
                  onAskBiancaToAdapt(
                    recipe,
                    `Adapt "${recipe.title}" to be cooked completely on stovetop or skillet using only basic cookware.`
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 transition-colors"
              >
                Stovetop / Skillet Adaptation
              </button>
              <button
                onClick={() =>
                  onAskBiancaToAdapt(
                    recipe,
                    `What are the best healthy substitutions for key ingredients in "${recipe.title}"?`
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 transition-colors"
              >
                Find Healthy Substitutes
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-900 flex items-center justify-between gap-3 sticky bottom-0">
          <div className="flex items-center gap-2">
            {onDeleteRecipe && (
              <button
                onClick={() => {
                  if (confirm('Delete this recipe from your library?')) {
                    onDeleteRecipe(recipe.id);
                    onClose();
                  }
                }}
                className="p-2 text-stone-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-stone-800"
                title="Delete recipe"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onEditRecipe && (
              <button
                onClick={() => onEditRecipe(recipe)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-white text-xs font-medium transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit Recipe</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => {
                onAddToMealPlan(recipe);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-medium transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Add to Meal Plan</span>
            </button>
            <button
              onClick={() => {
                onStartCooking(recipe);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Flame className="w-4 h-4" />
              <span>Start Cooking Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
