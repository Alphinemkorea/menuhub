import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Heart, 
  Clock, 
  Dumbbell, 
  Flame, 
  CalendarPlus, 
  Bot,
  Filter,
  Check,
  Wrench,
  Utensils,
  Edit3,
  FileText
} from 'lucide-react';
import { Recipe, InventoryItem, EquipmentItem, LifeHubContext, FoodPreferences } from '../types';
import { calculateIngredientMatch, checkEquipmentCompatibility, checkDietaryConflicts } from '../utils/recipeUtils';

interface RecipeLibraryViewProps {
  recipes: Recipe[];
  inventory: InventoryItem[];
  equipment: EquipmentItem[];
  preferences: FoodPreferences;
  lifeHub: LifeHubContext;
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (recipeId: string) => void;
  onStartCooking: (recipe: Recipe) => void;
  onAddToMealPlan: (recipe: Recipe) => void;
  onOpenCreateRecipeModal: () => void;
  onOpenAiGeneratorModal: () => void;
  onOpenImportModal: () => void;
  onEditRecipe?: (recipe: Recipe) => void;
}

export const RecipeLibraryView: React.FC<RecipeLibraryViewProps> = ({
  recipes,
  inventory,
  equipment,
  preferences,
  lifeHub,
  onSelectRecipe,
  onToggleFavorite,
  onStartCooking,
  onAddToMealPlan,
  onOpenCreateRecipeModal,
  onOpenAiGeneratorModal,
  onOpenImportModal,
  onEditRecipe,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyAiGenerated, setOnlyAiGenerated] = useState(false);
  const [hideDisliked, setHideDisliked] = useState(false);

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Quick (<30m)', 'High Protein (>40g)'];

  // Filter recipes
  const filteredRecipes = recipes.filter((recipe) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = recipe.title.toLowerCase().includes(q);
      const matchCuisine = recipe.cuisine.toLowerCase().includes(q);
      const matchDesc = recipe.description.toLowerCase().includes(q);
      const matchIngredients = recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
      if (!matchTitle && !matchCuisine && !matchDesc && !matchIngredients) return false;
    }

    // Category
    if (selectedCategory === 'Breakfast' && recipe.category !== 'Breakfast') return false;
    if (selectedCategory === 'Lunch' && recipe.category !== 'Lunch') return false;
    if (selectedCategory === 'Dinner' && recipe.category !== 'Dinner') return false;
    if (selectedCategory === 'Snack' && recipe.category !== 'Snack') return false;
    if (selectedCategory === 'Quick (<30m)' && recipe.prepTimeMinutes + recipe.cookTimeMinutes > 30) return false;
    if (selectedCategory === 'High Protein (>40g)' && recipe.proteinGrams < 40) return false;

    // Difficulty
    if (selectedDifficulty !== 'All' && recipe.difficulty !== selectedDifficulty) return false;

    // Toggles
    if (onlyFavorites && !recipe.isFavorite) return false;
    if (onlyAiGenerated && !recipe.isAiGenerated) return false;

    // Dietary preferences filter
    if (hideDisliked) {
      const conflict = checkDietaryConflicts(recipe, preferences);
      if (conflict.hasDislike || conflict.hasAllergy) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
            Recipe Library
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Browse, customize, and cook from your culinary collection, cross-checked with your kitchen inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Import / Scan (PDF, Photo, Paste)</span>
          </button>
          <button
            onClick={onOpenAiGeneratorModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-xs sm:text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Generate with Bianca</span>
          </button>
          <button
            onClick={onOpenCreateRecipeModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-xs sm:text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Recipe</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes by name, ingredient, cuisine..."
              className="w-full pl-9 pr-4 py-2 bg-stone-800/80 border border-stone-700/80 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Difficulty filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 whitespace-nowrap">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                onlyFavorites
                  ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                  : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>Favorites</span>
            </button>
            <button
              onClick={() => setOnlyAiGenerated(!onlyAiGenerated)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                onlyAiGenerated
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Recipes</span>
            </button>
            <button
              onClick={() => setHideDisliked(!hideDisliked)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                hideDisliked
                  ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                  : 'bg-stone-800/60 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
              title="Hide recipes containing ingredients on your dislikes or allergy list"
            >
              <span>Exclude Disliked</span>
            </button>
          </div>
        </div>

        {/* Category Pills / Segmented Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-stone-800 text-emerald-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Count Info */}
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>Showing {filteredRecipes.length} of {recipes.length} recipes</span>
        {onlyFavorites && <span>Filtered by favorites</span>}
      </div>

      {/* Recipe Cards Grid or Fresh Empty States */}
      {recipes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
          <Utensils className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">Your Recipe Library is Brand New</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            No recipes added yet. Scan a PDF or picture of a recipe, paste recipe text, or let Bianca AI craft customized meals.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              onClick={onOpenImportModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Import Recipe (PDF, Photo, Paste)</span>
            </button>
            <button
              onClick={onOpenAiGeneratorModal}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Generate with Bianca</span>
            </button>
            <button
              onClick={onOpenCreateRecipeModal}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium transition-colors"
            >
              New Recipe
            </button>
          </div>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
          <Utensils className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">No recipes matched your search</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Try adjusting your search filters or ask Bianca to invent a brand new recipe.
          </p>
          <button
            onClick={onOpenAiGeneratorModal}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
          >
            Ask Bianca to Create a Recipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecipes.map((recipe) => {
            const match = calculateIngredientMatch(recipe, inventory);
            const equip = checkEquipmentCompatibility(recipe, equipment);
            const conflict = checkDietaryConflicts(recipe, preferences);

            return (
              <div
                key={recipe.id}
                className="flex flex-col justify-between rounded-xl border border-stone-800 bg-stone-900/80 hover:border-stone-700 transition-all group"
              >
                <div className="p-5 space-y-3">
                  {/* Category & Favorite row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-stone-400 font-medium">
                      <span>{recipe.cuisine}</span>
                      <span className="mx-1.5 text-stone-600">·</span>
                      <span>{recipe.category}</span>
                      {recipe.isAiGenerated && (
                        <>
                          <span className="mx-1.5 text-stone-600">·</span>
                          <span className="text-emerald-400 font-mono">Bianca AI</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {onEditRecipe && (
                        <button
                          onClick={() => onEditRecipe(recipe)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-400 hover:bg-stone-800 transition-colors"
                          title="Edit recipe"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onToggleFavorite(recipe.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                        title={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            recipe.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => onSelectRecipe(recipe)}
                      className="font-serif text-lg font-bold text-stone-100 hover:text-emerald-300 cursor-pointer transition-colors line-clamp-1"
                    >
                      {recipe.title}
                    </h3>
                    <p className="text-xs text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>

                  {/* Cooking meta details */}
                  <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes}m</span>
                    </span>
                    <span className="text-stone-600">·</span>
                    <span>{recipe.difficulty}</span>
                    <span className="text-stone-600">·</span>
                    <span>{recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</span>
                  </div>

                  {/* Nutritional & Fitness alignment */}
                  <div className="p-2.5 rounded-lg bg-stone-850 border border-stone-800/90 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Dumbbell className="w-3.5 h-3.5" />
                        <span>{recipe.proteinGrams}g Protein</span>
                      </span>
                      <span className="text-stone-300">{recipe.caloriesPerServing} kcal</span>
                    </div>
                    <div className="text-[11px] text-stone-400 leading-tight line-clamp-1">
                      {recipe.fitnessGoalAlignment}
                    </div>
                  </div>

                  {/* Kitchen Inventory & Equipment Compatibility Status */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Pantry Availability:</span>
                      <span
                        className={`font-mono font-medium ${
                          match.percentage === 100
                            ? 'text-emerald-400'
                            : match.percentage >= 70
                            ? 'text-amber-400'
                            : 'text-stone-400'
                        }`}
                      >
                        {match.percentage}% in stock
                      </span>
                    </div>

                    {!equip.isCompatible && (
                      <div className="text-[11px] text-amber-400/90 flex items-center gap-1">
                        <Wrench className="w-3 h-3 shrink-0" />
                        <span className="truncate">Needs {equip.missingEquipment.join(', ')} (adaptable)</span>
                      </div>
                    )}

                    {(conflict.hasDislike || conflict.hasAllergy) && (
                      <div className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                        <span>⚠️ {conflict.hasAllergy ? `Allergy: ${conflict.allergicItems.join(', ')}` : `Disliked: ${conflict.dislikedItems.join(', ')}`}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="p-4 border-t border-stone-800 bg-stone-900/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectRecipe(recipe)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                  >
                    Details & Steps
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAddToMealPlan(recipe)}
                      className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                      title="Add to weekly meal planner"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onStartCooking(recipe)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Cook</span>
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
