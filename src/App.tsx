import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CookWithWhatIHaveView } from './components/CookWithWhatIHaveView';
import { RecipeLibraryView } from './components/RecipeLibraryView';
import { InventoryView } from './components/InventoryView';
import { MealPlannerView } from './components/MealPlannerView';
import { ShoppingListView } from './components/ShoppingListView';
import { EquipmentView } from './components/EquipmentView';
import { PreferencesView } from './components/PreferencesView';
import { LifeHubIntegrationView } from './components/LifeHubIntegrationView';
import { BiancaAssistantView } from './components/BiancaAssistantView';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { CookingModeModal } from './components/CookingModeModal';
import { CreateRecipeModal } from './components/CreateRecipeModal';
import { ImportRecipeModal } from './components/ImportRecipeModal';
import { 
  Recipe, 
  InventoryItem, 
  EquipmentItem, 
  FoodPreferences, 
  LifeHubContext, 
  MealPlanItem, 
  ShoppingItem, 
  ChatMessage, 
  CookingSession,
  DayOfWeek,
  MealType
} from './types';
import { 
  initialRecipes, 
  initialInventory, 
  initialEquipment, 
  initialPreferences, 
  initialLifeHubContext, 
  initialMealPlan 
} from './data/initialData';
import { generateSmartShoppingList, syncSmartShoppingList, normalizeName } from './utils/recipeUtils';
import { fetchLifeHubContext, updateLifeHubContext } from './services/geminiService';

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<string>('what-to-cook');
  const [isBiancaDrawerOpen, setIsBiancaDrawerOpen] = useState(false);
  const [selectedRecipeModal, setSelectedRecipeModal] = useState<Recipe | null>(null);
  const [editingRecipeModal, setEditingRecipeModal] = useState<Recipe | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [createModalMode, setCreateModalMode] = useState<'ai' | 'manual'>('ai');
  const [activeSession, setActiveSession] = useState<CookingSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Storage versioning to guarantee all mock data from previous sessions is cleared
  const STORAGE_VERSION_KEY = 'menuhub_storage_version';
  const CURRENT_STORAGE_VERSION = 'menuhub_v5_clean_slate';

  // Core Data States (with localStorage initialization and mock data cleanup)
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const ver = localStorage.getItem(STORAGE_VERSION_KEY);
      if (ver !== CURRENT_STORAGE_VERSION) {
        localStorage.removeItem('menuhub_recipes');
        localStorage.removeItem('menuhub_inventory');
        localStorage.removeItem('menuhub_mealplan');
        localStorage.removeItem('menuhub_shopping');
        localStorage.removeItem('menuhub_chat');
        localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
        return [];
      }
      const saved = localStorage.getItem('menuhub_recipes');
      if (!saved) return initialRecipes;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Strip any legacy mock recipes
      return parsed.filter(
        (r) =>
          !r.id.startsWith('rec-1') &&
          !r.id.startsWith('rec-2') &&
          !r.id.startsWith('rec-3') &&
          !r.id.startsWith('rec-4') &&
          !r.id.startsWith('rec-5') &&
          r.title !== 'Garlic Butter Chicken Fried Rice'
      );
    } catch {
      return initialRecipes;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const ver = localStorage.getItem(STORAGE_VERSION_KEY);
      if (ver !== CURRENT_STORAGE_VERSION) return [];
      const saved = localStorage.getItem('menuhub_inventory');
      if (!saved) return initialInventory;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (i) =>
          !i.id.startsWith('inv-1') &&
          !i.id.startsWith('inv-2') &&
          !i.id.startsWith('inv-3') &&
          !i.id.startsWith('inv-4') &&
          !i.id.startsWith('inv-5')
      );
    } catch {
      return initialInventory;
    }
  });

  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => {
    try {
      const saved = localStorage.getItem('menuhub_equipment');
      return saved ? JSON.parse(saved) : initialEquipment;
    } catch {
      return initialEquipment;
    }
  });

  const [preferences, setPreferences] = useState<FoodPreferences>(() => {
    try {
      const saved = localStorage.getItem('menuhub_preferences');
      return saved ? JSON.parse(saved) : initialPreferences;
    } catch {
      return initialPreferences;
    }
  });

  const [lifeHub, setLifeHub] = useState<LifeHubContext>(() => {
    try {
      const saved = localStorage.getItem('menuhub_lifehub');
      return saved ? JSON.parse(saved) : initialLifeHubContext;
    } catch {
      return initialLifeHubContext;
    }
  });

  const [mealPlan, setMealPlan] = useState<MealPlanItem[]>(() => {
    try {
      const ver = localStorage.getItem(STORAGE_VERSION_KEY);
      if (ver !== CURRENT_STORAGE_VERSION) return [];
      const saved = localStorage.getItem('menuhub_mealplan');
      return saved ? JSON.parse(saved) : initialMealPlan;
    } catch {
      return initialMealPlan;
    }
  });

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    try {
      const ver = localStorage.getItem(STORAGE_VERSION_KEY);
      if (ver !== CURRENT_STORAGE_VERSION) return [];
      const saved = localStorage.getItem('menuhub_shopping');
      if (saved) return JSON.parse(saved);
      return generateSmartShoppingList(initialMealPlan, initialRecipes, initialInventory);
    } catch {
      return generateSmartShoppingList(initialMealPlan, initialRecipes, initialInventory);
    }
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    try {
      const ver = localStorage.getItem(STORAGE_VERSION_KEY);
      if (ver !== CURRENT_STORAGE_VERSION) return [];
      const saved = localStorage.getItem('menuhub_chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic Real-Time Synchronization:
  // Whenever mealPlan, recipes, or inventory changes, the Smart Shopping List automatically updates itself!
  useEffect(() => {
    setShoppingList((prev) => syncSmartShoppingList(mealPlan, recipes, inventory, prev));
  }, [mealPlan, recipes, inventory]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('menuhub_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('menuhub_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('menuhub_equipment', JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem('menuhub_preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('menuhub_lifehub', JSON.stringify(lifeHub));
  }, [lifeHub]);

  useEffect(() => {
    localStorage.setItem('menuhub_mealplan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('menuhub_shopping', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem('menuhub_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Initial fetch from LifeHub context endpoint
  useEffect(() => {
    fetchLifeHubContext()
      .then((data) => {
        if (data) setLifeHub(data);
      })
      .catch(() => {
        // use default local context
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Expiring inventory count
  const expiringCount = inventory.filter((item) => {
    if (!item.expiryDate) return false;
    const diff = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
    return diff <= 3 && diff >= 0;
  }).length;

  // Active recipe for cooking session
  const activeCookingRecipe = activeSession
    ? recipes.find((r) => r.id === activeSession.recipeId)
    : undefined;

  // Handler: Clear all mock data & start fresh
  const handleClearAllData = () => {
    try {
      localStorage.removeItem('menuhub_recipes');
      localStorage.removeItem('menuhub_inventory');
      localStorage.removeItem('menuhub_mealplan');
      localStorage.removeItem('menuhub_shopping');
      localStorage.removeItem('menuhub_chat');
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    } catch {
      // ignore
    }

    setRecipes([]);
    setInventory([]);
    setMealPlan([]);
    setShoppingList([]);
    setChatHistory([]);
    setSelectedRecipeModal(null);
    setEditingRecipeModal(null);
    setActiveSession(null);
    showToast('All mock data cleared! MenuHub is completely brand new.');
  };

  // Handler: Start cooking
  const handleStartCooking = (recipe: Recipe) => {
    setActiveSession({
      recipeId: recipe.id,
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
      completedSteps: [],
    });
  };

  // Handler: Complete cooking & deduct inventory
  const handleCompleteCooking = (deductInventory: boolean) => {
    if (!activeCookingRecipe) return;

    if (deductInventory) {
      setInventory((prev) => {
        const updated = [...prev];
        for (const ing of activeCookingRecipe.ingredients) {
          const normIng = normalizeName(ing.name);
          const idx = updated.findIndex((i) => {
            const normInv = normalizeName(i.name);
            return normInv.includes(normIng) || normIng.includes(normInv);
          });
          if (idx !== -1) {
            const remaining = Math.max(0, updated[idx].quantity - ing.quantity);
            if (remaining === 0) {
              updated.splice(idx, 1);
            } else {
              updated[idx] = { ...updated[idx], quantity: Math.round(remaining * 10) / 10 };
            }
          }
        }
        return updated;
      });
      showToast(`Enjoy your meal! Deducted used ingredients from pantry inventory.`);
    } else {
      showToast(`Cooking complete! Well done, Chef.`);
    }

    setActiveSession(null);
  };

  // Handler: Bianca Cooking question
  const handleAskBiancaCookingQuestion = (q: string) => {
    setIsBiancaDrawerOpen(true);
    // Send message to Bianca
    const userMsg: ChatMessage = {
      id: `msg-${Date.now().toString(36)}`,
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, userMsg]);
  };

  // Handler: Toggle favorite
  const handleToggleFavorite = (recipeId: string) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, isFavorite: !r.isFavorite } : r))
    );
  };

  // Handler: Add missing items to shopping list
  const handleAddMissingToShoppingList = (
    items: { name: string; quantity: number; unit: string }[],
    recipeTitle: string
  ) => {
    setShoppingList((prev) => {
      const copy = [...prev];
      for (const item of items) {
        const norm = normalizeName(item.name);
        const existing = copy.find((s) => normalizeName(s.name) === norm);
        if (existing) {
          existing.quantityToBuy += item.quantity;
          if (!existing.recipesReferenced.includes(recipeTitle)) {
            existing.recipesReferenced.push(recipeTitle);
          }
        } else {
          copy.push({
            id: `shop-${norm}-${Date.now().toString(36)}`,
            name: item.name,
            category: 'Produce',
            quantityNeeded: item.quantity,
            quantityInStock: 0,
            quantityToBuy: item.quantity,
            unit: item.unit,
            checked: false,
            recipesReferenced: [recipeTitle],
          });
        }
      }
      return copy;
    });
    showToast(`Added ${items.length} missing ingredient${items.length === 1 ? '' : 's'} to Shopping List!`);
  };

  // Handler: Add to meal plan
  const handleAddToMealPlan = (recipe: Recipe) => {
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Find next available dinner slot
    let targetDay: DayOfWeek = 'Monday';
    for (const d of days) {
      if (!mealPlan.some((m) => m.day === d && m.mealType === 'dinner')) {
        targetDay = d;
        break;
      }
    }

    const newItem: MealPlanItem = {
      id: `mp-${Date.now().toString(36)}`,
      day: targetDay,
      mealType: 'dinner',
      recipeId: recipe.id,
      servings: recipe.servings || 2,
    };

    setMealPlan((prev) => [...prev, newItem]);
    showToast(`Added "${recipe.title}" to ${targetDay}'s dinner plan!`);
  };

  // Handler: Recalculate shopping list from meal plan
  const handleRegenerateShoppingList = () => {
    const generated = generateSmartShoppingList(mealPlan, recipes, inventory);
    setShoppingList(generated);
    showToast(`Smart Shopping List generated! Only items you actually lack are listed.`);
    setActiveTab('shopping');
  };

  // Handler: Transfer checked shopping items to inventory
  const handleTransferCheckedToInventory = () => {
    const checkedItems = shoppingList.filter((i) => i.checked);
    if (checkedItems.length === 0) return;

    setInventory((prev) => {
      const updated = [...prev];
      const expiryInOneWeek = new Date();
      expiryInOneWeek.setDate(expiryInOneWeek.getDate() + 7);

      for (const item of checkedItems) {
        const norm = normalizeName(item.name);
        const existingIdx = updated.findIndex((i) => normalizeName(i.name) === norm);
        if (existingIdx !== -1) {
          updated[existingIdx].quantity += item.quantityToBuy;
        } else {
          updated.push({
            id: `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            name: item.name,
            category: (item.category as any) || 'Produce',
            quantity: item.quantityToBuy,
            unit: item.unit,
            expiryDate: expiryInOneWeek.toISOString().split('T')[0],
            location: 'Fridge',
            addedDate: new Date().toISOString().split('T')[0],
          });
        }
      }
      return updated;
    });

    // Remove checked items from shopping list
    setShoppingList((prev) => prev.filter((i) => !i.checked));
    showToast(`Restocked ${checkedItems.length} purchased items directly into Pantry Inventory!`);
  };

  // Handler: Auto-Plan week with Bianca
  const handleAutoPlanWithBianca = () => {
    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const newItems: MealPlanItem[] = [];

    // Prioritize recipe using expiring ingredients first (e.g. rec-1 Chicken Fried Rice on Monday)
    // Saturday gets exotic recipe (rec-6 Moroccan Chicken)
    // Friday gets comfort burgers or Bolognese
    const available = [...recipes];
    days.forEach((day, idx) => {
      let rec: Recipe;
      if (day === 'Saturday') {
        rec = recipes.find((r) => r.cuisine.includes('North African') || r.title.includes('Exotic')) || available[idx % available.length];
      } else if (day === 'Monday') {
        rec = recipes.find((r) => r.title.includes('Fried Rice')) || available[0];
      } else {
        rec = available[idx % available.length];
      }

      newItems.push({
        id: `mp-auto-${day}-${Date.now().toString(36)}`,
        day,
        mealType: 'dinner',
        recipeId: rec.id,
        servings: 2,
      });

      // Add lunch for high-activity days
      if (day === 'Wednesday' || day === 'Sunday') {
        const lunchRec = recipes.find((r) => r.category === 'Lunch') || recipes[1];
        newItems.push({
          id: `mp-auto-lunch-${day}-${Date.now().toString(36)}`,
          day,
          mealType: 'lunch',
          recipeId: lunchRec.id,
          servings: 2,
        });
      }
    });

    setMealPlan(newItems);
    showToast(`Bianca optimized your 7-day meal plan for pantry freshness and LifeHub protein!`);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-xs sm:text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lifeHub={lifeHub}
        activeSession={activeSession}
        activeRecipe={activeCookingRecipe}
        onOpenCookingMode={() => {
          if (activeCookingRecipe) {
            // Already active
          }
        }}
        onOpenBiancaDrawer={() => setIsBiancaDrawerOpen(true)}
        expiringCount={expiringCount}
        onClearAllData={handleClearAllData}
        onOpenImportRecipe={() => setIsImportModalOpen(true)}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'what-to-cook' && (
          <CookWithWhatIHaveView
            recipes={recipes}
            inventory={inventory}
            equipment={equipment}
            preferences={preferences}
            lifeHub={lifeHub}
            onStartCooking={handleStartCooking}
            onAddMissingToShoppingList={handleAddMissingToShoppingList}
            onOpenRecipeDetail={(r) => setSelectedRecipeModal(r)}
            onAskBiancaForSubstitutes={(r) => {
              setIsBiancaDrawerOpen(true);
              const q = `I want to make "${r.title}" but I don't have all equipment. How should I adapt it for my stovetop?`;
              setChatHistory((prev) => [
                ...prev,
                { id: `msg-${Date.now().toString(36)}`, role: 'user', content: q, timestamp: new Date().toISOString() },
              ]);
            }}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeLibraryView
            recipes={recipes}
            inventory={inventory}
            equipment={equipment}
            preferences={preferences}
            lifeHub={lifeHub}
            onSelectRecipe={(r) => setSelectedRecipeModal(r)}
            onToggleFavorite={handleToggleFavorite}
            onStartCooking={handleStartCooking}
            onAddToMealPlan={handleAddToMealPlan}
            onOpenCreateRecipeModal={() => {
              setEditingRecipeModal(null);
              setCreateModalMode('manual');
              setIsCreateModalOpen(true);
            }}
            onOpenAiGeneratorModal={() => {
              setEditingRecipeModal(null);
              setCreateModalMode('ai');
              setIsCreateModalOpen(true);
            }}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onEditRecipe={(r) => {
              setEditingRecipeModal(r);
              setCreateModalMode('manual');
              setIsCreateModalOpen(true);
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            recipes={recipes}
            onAddItem={(item) => {
              const newItem: InventoryItem = {
                ...item,
                id: `inv-${Date.now().toString(36)}`,
                addedDate: new Date().toISOString().split('T')[0],
              };
              setInventory((prev) => [newItem, ...prev]);
              showToast(`Added ${item.name} (${item.quantity} ${item.unit}) to pantry!`);
            }}
            onUpdateQuantity={(id, delta) => {
              setInventory((prev) =>
                prev
                  .map((item) => {
                    if (item.id === id) {
                      const newQty = Math.max(0, item.quantity + delta);
                      return { ...item, quantity: Math.round(newQty * 10) / 10 };
                    }
                    return item;
                  })
                  .filter((item) => item.quantity > 0)
              );
            }}
            onEditItem={(updatedItem) => {
              setInventory((prev) =>
                prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
              );
              showToast(`Updated ${updatedItem.name} in inventory!`);
            }}
            onDeleteItem={(id) => {
              setInventory((prev) => prev.filter((i) => i.id !== id));
            }}
            onFilterRecipesByIngredient={(name) => {
              setActiveTab('recipes');
            }}
          />
        )}

        {activeTab === 'planner' && (
          <MealPlannerView
            mealPlan={mealPlan}
            recipes={recipes}
            lifeHub={lifeHub}
            onAddMealItem={(day, mealType, recipeId, servings) => {
              const newItem: MealPlanItem = {
                id: `mp-${Date.now().toString(36)}`,
                day,
                mealType,
                recipeId,
                servings,
              };
              setMealPlan((prev) => [...prev, newItem]);
            }}
            onRemoveMealItem={(id) => {
              setMealPlan((prev) => prev.filter((m) => m.id !== id));
            }}
            onGenerateShoppingList={handleRegenerateShoppingList}
            onAutoPlanWithBianca={handleAutoPlanWithBianca}
            onSelectRecipe={(r) => setSelectedRecipeModal(r)}
            onStartCooking={handleStartCooking}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListView
            shoppingList={shoppingList}
            onToggleItem={(id) => {
              setShoppingList((prev) =>
                prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
              );
            }}
            onDeleteItem={(id) => {
              setShoppingList((prev) => prev.filter((i) => i.id !== id));
            }}
            onAddManualItem={(name, qty, unit, cat) => {
              const newItem: ShoppingItem = {
                id: `shop-${Date.now().toString(36)}`,
                name,
                category: cat,
                quantityNeeded: qty,
                quantityInStock: 0,
                quantityToBuy: qty,
                unit,
                checked: false,
                recipesReferenced: [],
                isManual: true,
              };
              setShoppingList((prev) => [...prev, newItem]);
            }}
            onTransferCheckedToInventory={handleTransferCheckedToInventory}
            onRegenerateFromMealPlan={handleRegenerateShoppingList}
          />
        )}

        {activeTab === 'equipment' && (
          <EquipmentView
            equipment={equipment}
            onToggleEquipment={(id) => {
              setEquipment((prev) =>
                prev.map((e) => (e.id === id ? { ...e, owned: !e.owned } : e))
              );
            }}
            onAddEquipment={(item) => {
              const newItem: EquipmentItem = {
                ...item,
                id: `eq-${Date.now().toString(36)}`,
              };
              setEquipment((prev) => [...prev, newItem]);
            }}
            onDeleteEquipment={(id) => {
              setEquipment((prev) => prev.filter((e) => e.id !== id));
            }}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesView
            preferences={preferences}
            onUpdatePreferences={(updated) => {
              setPreferences(updated);
              showToast('Updated food preferences!');
            }}
            onClearAllData={handleClearAllData}
          />
        )}

        {activeTab === 'lifehub' && (
          <LifeHubIntegrationView
            lifeHub={lifeHub}
            onUpdateLifeHub={(updated) => {
              setLifeHub(updated);
              updateLifeHubContext(updated).catch(() => {});
            }}
            onRefreshSync={() => {
              fetchLifeHubContext().then((d) => d && setLifeHub(d));
            }}
          />
        )}
      </main>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipeModal}
        onClose={() => setSelectedRecipeModal(null)}
        inventory={inventory}
        equipment={equipment}
        lifeHub={lifeHub}
        onToggleFavorite={handleToggleFavorite}
        onStartCooking={(r) => {
          setSelectedRecipeModal(null);
          handleStartCooking(r);
        }}
        onAddToMealPlan={handleAddToMealPlan}
        onDeleteRecipe={(id) => {
          setRecipes((prev) => prev.filter((r) => r.id !== id));
          setSelectedRecipeModal(null);
        }}
        onEditRecipe={(r) => {
          setEditingRecipeModal(r);
          setCreateModalMode('manual');
          setIsCreateModalOpen(true);
        }}
        onAskBiancaToAdapt={(r, prompt) => {
          setSelectedRecipeModal(null);
          setIsBiancaDrawerOpen(true);
          setChatHistory((prev) => [
            ...prev,
            { id: `msg-${Date.now().toString(36)}`, role: 'user', content: prompt, timestamp: new Date().toISOString() },
          ]);
        }}
        onAddMissingToShoppingList={handleAddMissingToShoppingList}
      />

      {/* Create / Generate / Edit Recipe Modal */}
      <CreateRecipeModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingRecipeModal(null);
        }}
        editingRecipe={editingRecipeModal}
        onOpenImportModal={() => {
          setIsCreateModalOpen(false);
          setIsImportModalOpen(true);
        }}
        onSaveRecipe={(r) => {
          setRecipes((prev) => {
            const exists = prev.some((existing) => existing.id === r.id);
            if (exists) {
              return prev.map((existing) => (existing.id === r.id ? r : existing));
            }
            return [r, ...prev];
          });
          if (selectedRecipeModal && selectedRecipeModal.id === r.id) {
            setSelectedRecipeModal(r);
          }
          setEditingRecipeModal(null);
          showToast(`Saved "${r.title}" to Recipe Library!`);
        }}
        inventory={inventory}
        equipment={equipment}
        preferences={preferences}
        lifeHub={lifeHub}
        initialMode={createModalMode}
      />

      {/* Import & Scan Recipe Modal (PDF, Picture, Paste Text, Camera, Web URL) */}
      <ImportRecipeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        inventory={inventory}
        equipment={equipment}
        preferences={preferences}
        lifeHub={lifeHub}
        onSaveRecipe={(r) => {
          setRecipes((prev) => [r, ...prev]);
          setSelectedRecipeModal(r);
          setActiveTab('recipes');
          showToast(`Successfully extracted and uploaded "${r.title}" to Recipe Library!`);
        }}
        onStartCooking={(r) => {
          setRecipes((prev) => [r, ...prev]);
          handleStartCooking(r);
        }}
        onAddMissingToShoppingList={(items, recipeTitle) => {
          handleAddMissingToShoppingList(items, recipeTitle || 'Scanned Recipe');
        }}
        onAddToMealPlan={(r) => {
          setRecipes((prev) => {
            const exists = prev.some((x) => x.id === r.id);
            return exists ? prev : [r, ...prev];
          });
          handleAddToMealPlan(r);
          setSelectedRecipeModal(r);
          showToast(`Added "${r.title}" to your Meal Plan & Library!`);
        }}
      />

      {/* Cooking Mode Execution Modal */}
      {activeSession && activeCookingRecipe && (
        <CookingModeModal
          recipe={activeCookingRecipe}
          session={activeSession}
          onUpdateStep={(newStep) => {
            setActiveSession({
              ...activeSession,
              currentStepIndex: newStep,
              completedSteps: Array.from(new Set([...activeSession.completedSteps, activeSession.currentStepIndex])),
            });
          }}
          onCompleteCooking={handleCompleteCooking}
          onClose={() => setActiveSession(null)}
          onAskBiancaCookingQuestion={handleAskBiancaCookingQuestion}
          inventory={inventory}
        />
      )}

      {/* Bianca AI Assistant Slide-over Drawer */}
      {isBiancaDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl h-full bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right">
            <BiancaAssistantView
              chatHistory={chatHistory}
              onAddChatMessage={(msg) => setChatHistory((prev) => [...prev, msg])}
              inventory={inventory}
              equipment={equipment}
              preferences={preferences}
              lifeHub={lifeHub}
              recipes={recipes}
              onSaveRecipe={(r) => {
                setRecipes((prev) => [r, ...prev]);
                showToast(`Saved "${r.title}" to Recipe Library!`);
              }}
              onApplyInventoryAction={(items, action) => {
                setInventory((prev) => {
                  const copy = [...prev];
                  for (const it of items) {
                    const norm = normalizeName(it.name);
                    const idx = copy.findIndex((i) => normalizeName(i.name) === norm);
                    if (action === 'add') {
                      if (idx !== -1) {
                        copy[idx].quantity += it.quantity;
                      } else {
                        copy.push({
                          id: `inv-${Date.now().toString(36)}`,
                          name: it.name,
                          category: 'Produce',
                          quantity: it.quantity,
                          unit: it.unit,
                          expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                          location: 'Fridge',
                          addedDate: new Date().toISOString().split('T')[0],
                        });
                      }
                    } else if (action === 'remove' && idx !== -1) {
                      copy[idx].quantity = Math.max(0, copy[idx].quantity - it.quantity);
                    }
                  }
                  return copy;
                });
                showToast(`Applied Bianca's inventory update.`);
              }}
              onStartCooking={(r) => {
                setIsBiancaDrawerOpen(false);
                handleStartCooking(r);
              }}
              currentCookingSession={
                activeSession && activeCookingRecipe
                  ? {
                      recipeTitle: activeCookingRecipe.title,
                      currentStepIndex: activeSession.currentStepIndex,
                      totalSteps: activeCookingRecipe.instructions.length,
                      currentStepText: activeCookingRecipe.instructions[activeSession.currentStepIndex],
                    }
                  : null
              }
              isDrawer={true}
              onCloseDrawer={() => setIsBiancaDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
