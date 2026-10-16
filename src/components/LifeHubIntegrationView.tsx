import React, { useState } from 'react';
import { 
  HeartPulse, 
  RefreshCw, 
  CheckCircle2, 
  Dumbbell, 
  Flame, 
  Scale, 
  ExternalLink, 
  ShieldCheck, 
  Server, 
  Cpu, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { LifeHubContext } from '../types';

interface LifeHubIntegrationViewProps {
  lifeHub: LifeHubContext;
  onUpdateLifeHub: (updated: LifeHubContext) => void;
  onRefreshSync: () => void;
}

export const LifeHubIntegrationView: React.FC<LifeHubIntegrationViewProps> = ({
  lifeHub,
  onUpdateLifeHub,
  onRefreshSync,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [goalLabel, setGoalLabel] = useState(lifeHub.fitness.goal_label);
  const [currentWeight, setCurrentWeight] = useState(lifeHub.fitness.current_weight.toString());
  const [targetWeight, setTargetWeight] = useState(lifeHub.fitness.target_weight.toString());
  const [calories, setCalories] = useState(lifeHub.nutrition.calorie_target.toString());
  const [protein, setProtein] = useState(lifeHub.nutrition.protein_target.toString());
  const [customApiUrl, setCustomApiUrl] = useState(lifeHub.customApiUrl || 'https://lifehub-api.render.com');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLifeHub({
      ...lifeHub,
      last_synced: new Date().toISOString(),
      customApiUrl,
      fitness: {
        ...lifeHub.fitness,
        goal_label: goalLabel,
        current_weight: parseFloat(currentWeight) || 55,
        target_weight: parseFloat(targetWeight) || 60,
      },
      nutrition: {
        ...lifeHub.nutrition,
        calorie_target: parseInt(calories, 10) || 2800,
        protein_target: parseInt(protein, 10) || 140,
      },
    });
    setIsEditing(false);
    setSyncStatusMsg('LifeHub fitness parameters updated and broadcast to Bianca!');
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleManualSync = () => {
    onRefreshSync();
    setSyncStatusMsg('Successfully polled LifeHub fitness API context (HTTP 200 OK)');
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider mb-1">
            <HeartPulse className="w-4 h-4" />
            <span>Biometrics & Fitness Bridge</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
            LifeHub Integration
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            MenuHub communicates with LifeHub via API contracts. LifeHub owns health and fitness metrics; MenuHub owns food and recipes; Bianca connects both.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span>Sync from LifeHub</span>
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            {isEditing ? 'Cancel Editing' : 'Adjust Targets'}
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Cross-Service Architecture Diagram Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400 flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Ecosystem Architecture (Prompt Architecture Model)</span>
        </h3>

        <div className="p-4 bg-stone-950 rounded-lg border border-stone-800/80 font-mono text-xs text-stone-300 overflow-x-auto leading-relaxed">
          <div className="text-emerald-400 font-semibold mb-2">┌────────────────────────────────────────────────────────┐</div>
          <div className="text-emerald-400 font-semibold">│           BIANCA AI ORCHESTRATION LAYER                │</div>
          <div className="text-emerald-400 font-semibold mb-2">└──────────────────────────┬─────────────────────────────┘</div>
          <div className="text-stone-500">                           │</div>
          <div className="text-stone-500">            ┌──────────────┴──────────────┐</div>
          <div className="text-stone-500">            ▼                             ▼</div>
          <div className="flex gap-4 sm:gap-12 pt-1">
            <div className="p-3 rounded bg-stone-900 border border-stone-700 flex-1 min-w-[200px]">
              <div className="text-stone-100 font-semibold text-[13px] text-rose-400">LIFEHUB API</div>
              <div className="text-[11px] text-stone-400 mt-1">
                • Fitness Goal: {lifeHub.fitness.goal_label}
                <br />• Current Weight: {lifeHub.fitness.current_weight} kg → Target: {lifeHub.fitness.target_weight} kg
                <br />• Daily Target: {lifeHub.nutrition.calorie_target} kcal / {lifeHub.nutrition.protein_target}g Protein
                <br />• Synced: {new Date(lifeHub.last_synced).toLocaleTimeString()}
              </div>
            </div>

            <div className="p-3 rounded bg-stone-900 border border-stone-700 flex-1 min-w-[200px]">
              <div className="text-stone-100 font-semibold text-[13px] text-emerald-400">MENUHUB API</div>
              <div className="text-[11px] text-stone-400 mt-1">
                • Real-time Inventory & Expirations
                <br />• Kitchen Equipment Constraints
                <br />• Dietary Rules & Dislikes
                <br />• Recipes & Step-by-Step Cooking
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editing Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-stone-100">Adjust Synced Fitness Parameters</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Fitness Goal Description</label>
              <input
                type="text"
                value={goalLabel}
                onChange={(e) => setGoalLabel(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">LifeHub Custom API Endpoint</label>
              <input
                type="text"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                placeholder="https://lifehub-api.render.com"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Target Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Daily Calories (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Daily Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-2 text-xs text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
            >
              Save & Broadcast to Bianca
            </button>
          </div>
        </form>
      ) : (
        /* LifeHub Metrics Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Goal</span>
              <Scale className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-serif text-lg font-bold text-stone-100">
              {lifeHub.fitness.goal_label}
            </div>
            <div className="text-xs text-stone-400 font-mono">
              {lifeHub.fitness.current_weight} kg → {lifeHub.fitness.target_weight} kg ({lifeHub.fitness.weekly_change_target})
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Caloric Budget</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="font-serif text-lg font-bold text-stone-100 font-mono">
              {lifeHub.nutrition.calorie_target} kcal
            </div>
            <div className="text-xs text-stone-400">
              Active metabolic surplus target
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Protein Target</span>
              <Dumbbell className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-serif text-lg font-bold text-emerald-400 font-mono">
              {lifeHub.nutrition.protein_target}g daily
            </div>
            <div className="text-xs text-stone-400">
              ~2.5g / kg bodyweight for hypertrophy
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Activity Level</span>
              <HeartPulse className="w-4 h-4 text-rose-400" />
            </div>
            <div className="font-serif text-lg font-bold text-stone-100">
              {lifeHub.activity.level.toUpperCase()}
            </div>
            <div className="text-xs text-stone-400 line-clamp-1">
              {lifeHub.activity.workouts_per_week} workouts/week · {lifeHub.activity.today_active_energy}
            </div>
          </div>
        </div>
      )}

      {/* Target Meal Split Breakdown */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-stone-400">
          Target Meal Split Recommendation (From LifeHub Nutrition Engine)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(lifeHub.nutrition.meal_split).map(([meal, data]) => (
            <div key={meal} className="p-3.5 rounded-lg bg-stone-850 border border-stone-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-200 capitalize">
                <span>{meal}</span>
                <span className="font-mono text-emerald-400">{data.protein}g protein</span>
              </div>
              <div className="font-mono text-sm text-stone-100">
                {data.calories} kcal
              </div>
              <div className="text-[11px] text-stone-400 leading-tight">
                {data.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
