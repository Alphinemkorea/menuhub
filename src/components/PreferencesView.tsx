import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Plus, 
  X, 
  Sparkles, 
  Flame, 
  Heart, 
  ShieldAlert, 
  Utensils,
  Trash2
} from 'lucide-react';
import { FoodPreferences } from '../types';

interface PreferencesViewProps {
  preferences: FoodPreferences;
  onUpdatePreferences: (updated: FoodPreferences) => void;
  onClearAllData?: () => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({
  preferences,
  onUpdatePreferences,
  onClearAllData,
}) => {
  const [newDislike, setNewDislike] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newDietary, setNewDietary] = useState('');
  const [newCuisine, setNewCuisine] = useState('');
  const [newIngredient, setNewIngredient] = useState('');

  const addTag = (
    field: 'dislikes' | 'allergies' | 'dietaryRestrictions' | 'favoriteCuisines' | 'favoriteIngredients',
    value: string,
    setter: (s: string) => void
  ) => {
    if (!value.trim()) return;
    const clean = value.trim();
    if (!preferences[field].includes(clean)) {
      onUpdatePreferences({
        ...preferences,
        [field]: [...preferences[field], clean],
      });
    }
    setter('');
  };

  const removeTag = (
    field: 'dislikes' | 'allergies' | 'dietaryRestrictions' | 'favoriteCuisines' | 'favoriteIngredients',
    index: number
  ) => {
    const list = [...preferences[field]];
    list.splice(index, 1);
    onUpdatePreferences({
      ...preferences,
      [field]: list,
    });
  };

  const spiceLevels: FoodPreferences['spiceLevel'][] = ['Mild', 'Medium', 'Hot', 'Extra Hot'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
          Food Preferences & Dietary Profile
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          MenuHub uses your structured culinary profile so Bianca never recommends recipes with excluded ingredients or unsuitable spice levels.
        </p>
      </div>

      {/* Bianca Intelligence Callout */}
      <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-stone-200">
            Profile Enforced by Bianca
          </div>
          <p className="text-stone-400 leading-relaxed">
            Every AI meal suggestion, recipe generation, and substitute check strictly verifies this profile against ingredients and spice requirements before proposing to you.
          </p>
        </div>
      </div>

      {/* Grid of Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Dislikes / Exclusions */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
            <X className="w-4 h-4 text-rose-400" />
            <span>Things I Don't Eat (Dislikes & Exclusions)</span>
          </div>
          <p className="text-xs text-stone-400">
            Ingredients Bianca will strictly avoid recommending or using in recipes.
          </p>

          <div className="flex flex-wrap gap-2">
            {preferences.dislikes.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-300"
              >
                <span>{item}</span>
                <button
                  onClick={() => removeTag('dislikes', idx)}
                  className="text-stone-500 hover:text-stone-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTag('dislikes', newDislike, setNewDislike);
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              placeholder="e.g. Mushrooms, Cilantro, Avocado..."
              value={newDislike}
              onChange={(e) => setNewDislike(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs text-stone-200"
            >
              Add
            </button>
          </form>
        </div>

        {/* Allergies & Intolerances */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Allergies & Intolerances</span>
          </div>
          <p className="text-xs text-stone-400">
            Critical health exclusions synced with your LifeHub biometrics.
          </p>

          <div className="flex flex-wrap gap-2">
            {preferences.allergies.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300"
              >
                <span>{item}</span>
                <button
                  onClick={() => removeTag('allergies', idx)}
                  className="text-amber-500 hover:text-amber-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTag('allergies', newAllergy, setNewAllergy);
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              placeholder="e.g. Peanuts, Shellfish, Lactose..."
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs text-stone-200"
            >
              Add
            </button>
          </form>
        </div>

        {/* Favorite Cuisines */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
            <Utensils className="w-4 h-4 text-emerald-400" />
            <span>Favorite Cuisines</span>
          </div>
          <p className="text-xs text-stone-400">
            Flavor profiles and cultural culinary styles you love exploring.
          </p>

          <div className="flex flex-wrap gap-2">
            {preferences.favoriteCuisines.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300"
              >
                <span>{item}</span>
                <button
                  onClick={() => removeTag('favoriteCuisines', idx)}
                  className="text-emerald-500 hover:text-emerald-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTag('favoriteCuisines', newCuisine, setNewCuisine);
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              placeholder="e.g. Kenyan, Pan-Asian, Italian..."
              value={newCuisine}
              onChange={(e) => setNewCuisine(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs text-stone-200"
            >
              Add
            </button>
          </form>
        </div>

        {/* Favorite Ingredients */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Favorite Ingredients</span>
          </div>
          <p className="text-xs text-stone-400">
            Comfort staples you enjoy cooking with frequently.
          </p>

          <div className="flex flex-wrap gap-2">
            {preferences.favoriteIngredients.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-300"
              >
                <span>{item}</span>
                <button
                  onClick={() => removeTag('favoriteIngredients', idx)}
                  className="text-stone-500 hover:text-stone-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTag('favoriteIngredients', newIngredient, setNewIngredient);
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              placeholder="e.g. Chicken breast, Eggs, Garlic..."
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs text-stone-200"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Spice Level Preference */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Preferred Spice Level</span>
        </div>
        <p className="text-xs text-stone-400">
          Dictates the chili and warmth intensity Bianca uses when formulating marinades and sauces.
        </p>

        <div className="flex items-center gap-2 pt-1">
          {spiceLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => onUpdatePreferences({ ...preferences, spiceLevel: lvl })}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                preferences.spiceLevel === lvl
                  ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Data Management: Clear All Mock Data & Fresh Start */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Kitchen Data Management</span>
            </div>
            <p className="text-xs text-stone-400 max-w-xl">
              Clear all mock data, recipes, inventory items, meal plan slots, and chat logs to start completely fresh and new.
            </p>
          </div>
          {onClearAllData && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all data and start completely fresh? This cannot be undone.')) {
                  onClearAllData();
                }
              }}
              className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Data & Start Fresh</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
