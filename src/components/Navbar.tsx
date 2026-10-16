import React from 'react';
import { 
  ChefHat, 
  BookOpen, 
  Package, 
  Sparkles, 
  Calendar, 
  ShoppingCart, 
  Wrench, 
  SlidersHorizontal, 
  HeartPulse, 
  Bot,
  Flame,
  Trash2,
  FileText
} from 'lucide-react';
import { LifeHubContext, CookingSession, Recipe } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lifeHub: LifeHubContext;
  activeSession: CookingSession | null;
  activeRecipe?: Recipe;
  onOpenCookingMode: () => void;
  onOpenBiancaDrawer: () => void;
  expiringCount: number;
  onClearAllData?: () => void;
  onOpenImportRecipe?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lifeHub,
  activeSession,
  activeRecipe,
  onOpenCookingMode,
  onOpenBiancaDrawer,
  expiringCount,
  onClearAllData,
  onOpenImportRecipe,
}) => {
  const navItems = [
    { id: 'recipes', label: 'Recipes', icon: BookOpen },
    { id: 'inventory', label: 'Inventory', icon: Package, badge: expiringCount > 0 ? expiringCount : undefined },
    { id: 'what-to-cook', label: 'What Can I Make?', icon: Sparkles, highlight: true },
    { id: 'planner', label: 'Meal Planner', icon: Calendar },
    { id: 'shopping', label: 'Shopping List', icon: ShoppingCart },
    { id: 'equipment', label: 'Equipment', icon: Wrench },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
    { id: 'lifehub', label: 'LifeHub Sync', icon: HeartPulse },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-900/95 backdrop-blur-md">
      {/* Active cooking session banner if cooking right now */}
      {activeSession && activeRecipe && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/60 px-4 py-2 flex items-center justify-between text-xs sm:text-sm text-emerald-200">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-100">Cooking Session Active:</span>
            <span className="truncate max-w-xs">{activeRecipe.title} (Step {activeSession.currentStepIndex + 1})</span>
          </div>
          <button
            onClick={onOpenCookingMode}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-colors"
          >
            Resume Cooking Mode
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Editorial Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-stone-100">MenuHub</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                  AI Culinary
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">
                Personal AI cooking system & LifeHub fitness coordinator
              </p>
            </div>
          </div>

          {/* Quick LifeHub status & Bianca button */}
          <div className="flex items-center gap-3">
            {/* Real-time reactive sync status */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-800/80 border border-stone-700/60 text-[11px] font-mono text-emerald-400" title="Every change in inventory, recipes, meal plan, or equipment updates the entire app in real time">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Auto-Sync</span>
            </div>

            {/* Clear All Mock Data / Start Fresh Button */}
            {onClearAllData && (
              <button
                onClick={() => {
                  if (confirm('Clear all data and start completely fresh? This will remove all mock recipes, pantry inventory, meal plan, and chat.')) {
                    onClearAllData();
                  }
                }}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-800/80 hover:bg-rose-950/40 border border-stone-700/60 hover:border-rose-800/60 text-[11px] font-mono text-stone-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Clear all data and start fresh with a clean kitchen"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Start Fresh</span>
              </button>
            )}

            {/* LifeHub Context chip */}
            <button
              onClick={() => setActiveTab('lifehub')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 text-left transition-colors"
              title="Click to view LifeHub fitness context"
            >
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <div className="text-xs leading-tight">
                <div className="text-stone-300 font-medium">{lifeHub.fitness.goal_label}</div>
                <div className="text-stone-400 font-mono text-[11px]">
                  {lifeHub.nutrition.protein_target}g Protein · {lifeHub.nutrition.calorie_target} kcal
                </div>
              </div>
            </button>

            {/* Import / Scan Recipe Button */}
            {onOpenImportRecipe && (
              <button
                onClick={onOpenImportRecipe}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                title="Scan recipes from PDF, photo, or paste text"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Scan Recipe</span>
              </button>
            )}

            {/* Bianca Assistant Drawer Button */}
            <button
              onClick={onOpenBiancaDrawer}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors"
            >
              <Bot className="w-4 h-4" />
              <span>Ask Bianca</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar border-t border-stone-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-stone-800 text-emerald-400 border border-stone-700/80 shadow-sm'
                    : item.highlight
                    ? 'text-emerald-300/90 hover:text-emerald-200 hover:bg-stone-800/50'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] flex items-center justify-center font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
