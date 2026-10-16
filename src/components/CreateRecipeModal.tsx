import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Loader2, 
  Dumbbell, 
  Clock, 
  Flame, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Recipe, InventoryItem, EquipmentItem, FoodPreferences, LifeHubContext } from '../types';
import { generateRecipeWithBianca } from '../services/geminiService';
import { calculateTotalRecipeNutrition } from '../utils/nutritionUtils';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
  inventory: InventoryItem[];
  equipment: EquipmentItem[];
  preferences: FoodPreferences;
  lifeHub: LifeHubContext;
  initialMode?: 'ai' | 'manual';
  editingRecipe?: Recipe | null;
  onOpenImportModal?: () => void;
}

export const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({
  isOpen,
  onClose,
  onSaveRecipe,
  inventory,
  equipment,
  preferences,
  lifeHub,
  initialMode = 'ai',
  editingRecipe = null,
  onOpenImportModal,
}) => {
  const [mode, setMode] = useState<'ai' | 'manual'>(editingRecipe ? 'manual' : initialMode);

  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState('Dinner');
  const [aiMaxTime, setAiMaxTime] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Recipe['category']>('Dinner');
  const [cuisine, setCuisine] = useState('International');
  const [prepTime, setPrepTime] = useState('10');
  const [cookTime, setCookTime] = useState('20');
  const [servings, setServings] = useState('2');
  const [difficulty, setDifficulty] = useState<Recipe['difficulty']>('Medium');
  const [calories, setCalories] = useState('650');
  const [protein, setProtein] = useState('45');
  const [fitnessNote, setFitnessNote] = useState('Supports daily muscle synthesis protein targets');
  const [equipmentList, setEquipmentList] = useState('Gas cooker, Frying pan');
  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity: number; unit: string }>>([
    { name: '', quantity: 1, unit: 'pcs' },
  ]);
  const [instructions, setInstructions] = useState<string[]>(['']);

  // Sync state if editingRecipe changes
  React.useEffect(() => {
    if (editingRecipe) {
      setMode('manual');
      setTitle(editingRecipe.title || '');
      setDescription(editingRecipe.description || '');
      setCategory(editingRecipe.category || 'Dinner');
      setCuisine(editingRecipe.cuisine || 'International');
      setPrepTime(String(editingRecipe.prepTimeMinutes || 10));
      setCookTime(String(editingRecipe.cookTimeMinutes || 20));
      setServings(String(editingRecipe.servings || 2));
      setDifficulty(editingRecipe.difficulty || 'Medium');
      setCalories(String(editingRecipe.caloriesPerServing || 600));
      setProtein(String(editingRecipe.proteinGrams || 40));
      setFitnessNote(editingRecipe.fitnessGoalAlignment || '');
      setEquipmentList(editingRecipe.equipmentNeeded?.join(', ') || '');
      setIngredients(
        editingRecipe.ingredients && editingRecipe.ingredients.length > 0
          ? editingRecipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit }))
          : [{ name: '', quantity: 1, unit: 'pcs' }]
      );
      setInstructions(
        editingRecipe.instructions && editingRecipe.instructions.length > 0
          ? [...editingRecipe.instructions]
          : ['']
      );
    } else {
      setMode(initialMode);
      setTitle('');
      setDescription('');
      setCategory('Dinner');
      setCuisine('International');
      setPrepTime('10');
      setCookTime('20');
      setServings('2');
      setDifficulty('Medium');
      setCalories('650');
      setProtein('45');
      setFitnessNote('Supports daily muscle synthesis protein targets');
      setEquipmentList('Gas cooker, Frying pan');
      setIngredients([{ name: '', quantity: 1, unit: 'pcs' }]);
      setInstructions(['']);
    }
  }, [editingRecipe, initialMode, isOpen]);

  if (!isOpen) return null;

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const generated = await generateRecipeWithBianca({
        prompt: aiPrompt,
        targetCategory: aiCategory,
        maxCookTimeMinutes: parseInt(aiMaxTime, 10) || 30,
        inventory,
        equipment,
        preferences,
        lifeHub,
      });

      onSaveRecipe(generated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate recipe with Bianca');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validIngredients = ingredients.filter((i) => i.name.trim());
    const validInstructions = instructions.filter((i) => i.trim());
    const parsedServings = parseInt(servings, 10) || 2;

    // Automatically calculate nutritional breakdown directly from ingredient data
    const computedNutrition = calculateTotalRecipeNutrition(validIngredients, parsedServings, 1);

    const targetRecipe: Recipe = {
      id: editingRecipe?.id || `rec-manual-${Date.now().toString(36)}`,
      title: title.trim(),
      description: description.trim(),
      category,
      cuisine: cuisine.trim() || 'Custom',
      prepTimeMinutes: parseInt(prepTime, 10) || 10,
      cookTimeMinutes: parseInt(cookTime, 10) || 20,
      servings: parsedServings,
      difficulty,
      equipmentNeeded: equipmentList.split(',').map((e) => e.trim()).filter(Boolean),
      caloriesPerServing: computedNutrition.perServingCalories || parseInt(calories, 10) || 600,
      proteinGrams: computedNutrition.perServingProtein || parseInt(protein, 10) || 40,
      carbsGrams: computedNutrition.perServingCarbs || 60,
      fatGrams: computedNutrition.perServingFat || 18,
      fitnessGoalAlignment: fitnessNote.trim() || `${computedNutrition.perServingProtein}g Protein supporting daily fitness goals`,
      ingredients: validIngredients,
      instructions: validInstructions,
      isFavorite: editingRecipe?.isFavorite ?? false,
      isAiGenerated: editingRecipe?.isAiGenerated ?? false,
      createdAt: editingRecipe?.createdAt || new Date().toISOString(),
    };

    onSaveRecipe(targetRecipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-stone-100">
              {editingRecipe
                ? `Edit Recipe: ${editingRecipe.title}`
                : mode === 'ai'
                ? 'Create Recipe with Bianca AI'
                : 'Create Custom Recipe'}
            </h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (only shown when creating fresh recipe) */}
        {!editingRecipe && (
          <div className="flex items-center gap-1 p-1 bg-stone-950 border border-stone-800 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('ai')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                mode === 'ai'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate with Bianca</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                mode === 'manual'
                  ? 'bg-stone-800 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>Manual Form</span>
            </button>
            {onOpenImportModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImportModal();
                }}
                className="flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors text-emerald-400 hover:text-emerald-300 hover:bg-stone-900 border border-emerald-500/20"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Scan PDF/Photo/Text</span>
              </button>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-xs text-rose-300 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* AI Generator Mode */}
        {mode === 'ai' ? (
          <form onSubmit={handleAiGenerate} className="space-y-4 overflow-y-auto flex-1">
            <div className="p-4 rounded-xl bg-stone-850/60 border border-stone-800 text-xs text-stone-300 space-y-1">
              <span className="font-semibold text-emerald-400 block">Bianca Smart Context:</span>
              <p className="text-stone-400">
                Bianca reads your pantry ingredients, respects your dislikes ({preferences.dislikes.join(', ')}), checks your owned kitchen equipment, and tailors the recipe to support your LifeHub target of {lifeHub.nutrition.protein_target}g protein.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                What would you like to cook?
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Create a high-protein chicken skillet dinner using the rice and eggs I have, ready in 25 minutes..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Meal Category</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Max Cook Time</label>
                <select
                  value={aiMaxTime}
                  onChange={(e) => setAiMaxTime(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="20">Under 20 minutes</option>
                  <option value="30">Under 30 minutes</option>
                  <option value="45">Under 45 minutes</option>
                  <option value="60">Flexible / Weekend Special</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || !aiPrompt.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Bianca is inventing recipe...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Recipe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Manual Mode */
          <form onSubmit={handleManualSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Recipe Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swahili Coconut Fish Curry"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Cuisine</label>
                <input
                  type="text"
                  placeholder="e.g. Kenyan, Pan-Asian, Italian"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Short Description</label>
              <textarea
                rows={2}
                placeholder="Brief summary of flavors and dish texture..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Prep Time (min)</label>
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full px-2 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Cook Time (min)</label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  className="w-full px-2 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Servings</label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full px-2 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full px-2 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full px-2 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Equipment Needed</label>
                <input
                  type="text"
                  placeholder="e.g. Gas cooker, Frying pan"
                  value={equipmentList}
                  onChange={(e) => setEquipmentList(e.target.value)}
                  className="w-full px-2 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100"
                />
              </div>
            </div>

            {/* Ingredients builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-300">Ingredients</label>
                <button
                  type="button"
                  onClick={() => setIngredients([...ingredients, { name: '', quantity: 1, unit: 'pcs' }])}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ingredient name (e.g. Chicken)"
                      value={ing.name}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[idx].name = e.target.value;
                        setIngredients(copy);
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-stone-800 border border-stone-700 rounded text-xs text-stone-100"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[idx].quantity = parseFloat(e.target.value) || 0;
                        setIngredients(copy);
                      }}
                      className="w-16 px-2 py-1.5 bg-stone-800 border border-stone-700 rounded text-xs text-stone-100"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={ing.unit}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[idx].unit = e.target.value;
                        setIngredients(copy);
                      }}
                      className="w-16 px-2 py-1.5 bg-stone-800 border border-stone-700 rounded text-xs text-stone-100"
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...ingredients];
                          copy.splice(idx, 1);
                          setIngredients(copy);
                        }}
                        className="text-stone-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-300">Instructions Steps</label>
                <button
                  type="button"
                  onClick={() => setInstructions([...instructions, ''])}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Step</span>
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="font-mono text-xs text-stone-500 pt-2">{idx + 1}.</span>
                    <textarea
                      rows={2}
                      placeholder={`Step ${idx + 1} instructions...`}
                      value={step}
                      onChange={(e) => {
                        const copy = [...instructions];
                        copy[idx] = e.target.value;
                        setInstructions(copy);
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-stone-800 border border-stone-700 rounded text-xs text-stone-100"
                    />
                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...instructions];
                          copy.splice(idx, 1);
                          setInstructions(copy);
                        }}
                        className="text-stone-500 hover:text-rose-400 p-1 pt-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {editingRecipe ? 'Update Recipe' : 'Save Recipe'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
