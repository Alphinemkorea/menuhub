import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Check, 
  Plus, 
  Trash2, 
  PackagePlus, 
  Sparkles, 
  ArrowRight,
  Filter,
  CheckCheck
} from 'lucide-react';
import { ShoppingItem } from '../types';

interface ShoppingListViewProps {
  shoppingList: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onAddManualItem: (name: string, quantity: number, unit: string, category: string) => void;
  onTransferCheckedToInventory: () => void;
  onRegenerateFromMealPlan: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  shoppingList,
  onToggleItem,
  onDeleteItem,
  onAddManualItem,
  onTransferCheckedToInventory,
  onRegenerateFromMealPlan,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemCat, setNewItemCat] = useState('Produce');
  const [filter, setFilter] = useState<'all' | 'unbought' | 'bought'>('all');

  const checkedCount = shoppingList.filter((item) => item.checked).length;

  const filteredList = shoppingList.filter((item) => {
    if (filter === 'unbought') return !item.checked;
    if (filter === 'bought') return item.checked;
    return true;
  });

  // Group by category
  const categories = Array.from(new Set(filteredList.map((i) => i.category || 'Other')));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddManualItem(
      newItemName.trim(),
      parseFloat(newItemQty) || 1,
      newItemUnit.trim() || 'pcs',
      newItemCat
    );
    setNewItemName('');
    setNewItemQty('1');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
            Smart Shopping List
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <p className="text-xs sm:text-sm text-stone-400">
              Auto-sync active: Automatically updates whenever you change your meal plan or pantry inventory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRegenerateFromMealPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recalculate from Plan</span>
          </button>

          {checkedCount > 0 && (
            <button
              onClick={onTransferCheckedToInventory}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Bought! Move ({checkedCount}) to Inventory</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual Quick Add Form */}
      <form
        onSubmit={handleAddSubmit}
        className="p-3 bg-stone-900 border border-stone-800 rounded-xl flex flex-wrap items-center gap-2"
      >
        <input
          type="text"
          placeholder="Add extra grocery item..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
        />
        <input
          type="number"
          step="0.1"
          min="0.1"
          placeholder="Qty"
          value={newItemQty}
          onChange={(e) => setNewItemQty(e.target.value)}
          className="w-20 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
        />
        <input
          type="text"
          placeholder="Unit"
          value={newItemUnit}
          onChange={(e) => setNewItemUnit(e.target.value)}
          className="w-20 px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
        />
        <select
          value={newItemCat}
          onChange={(e) => setNewItemCat(e.target.value)}
          className="px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="Produce">Produce</option>
          <option value="Protein & Dairy">Protein & Dairy</option>
          <option value="Pantry & Grains">Pantry & Grains</option>
          <option value="Spices & Condiments">Spices & Condiments</option>
          <option value="Bakery">Bakery</option>
          <option value="Other">Other</option>
        </select>
        <button
          type="submit"
          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-lg text-xs font-medium border border-stone-700 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add</span>
        </button>
      </form>

      {/* Filter tab bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-lg text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'all' ? 'bg-stone-800 text-stone-100 shadow-sm' : 'text-stone-400'
            }`}
          >
            All Items ({shoppingList.length})
          </button>
          <button
            onClick={() => setFilter('unbought')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'unbought' ? 'bg-stone-800 text-stone-100 shadow-sm' : 'text-stone-400'
            }`}
          >
            To Buy ({shoppingList.filter((i) => !i.checked).length})
          </button>
          <button
            onClick={() => setFilter('bought')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'bought' ? 'bg-stone-800 text-stone-100 shadow-sm' : 'text-stone-400'
            }`}
          >
            Checked ({checkedCount})
          </button>
        </div>

        <div className="text-xs text-stone-400">
          {checkedCount > 0 && (
            <span>{checkedCount} ready to transfer to pantry</span>
          )}
        </div>
      </div>

      {/* Shopping Items List Grouped by Category */}
      {filteredList.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-900 border border-stone-800 rounded-xl space-y-3">
          <ShoppingCart className="w-8 h-8 text-stone-500 mx-auto" />
          <h3 className="text-base font-semibold text-stone-200">Your shopping list is clear</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            You either have everything needed for this week's meals in your inventory, or haven't scheduled meals yet.
          </p>
          <button
            onClick={onRegenerateFromMealPlan}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
          >
            Calculate from Weekly Meal Plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const items = filteredList.filter((i) => (i.category || 'Other') === cat);
            if (items.length === 0) return null;

            return (
              <div
                key={cat}
                className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden"
              >
                <div className="px-4 py-2 bg-stone-850 border-b border-stone-800 text-xs font-semibold text-stone-300 font-mono uppercase tracking-wider flex items-center justify-between">
                  <span>{cat}</span>
                  <span className="text-stone-500">{items.length} items</span>
                </div>

                <div className="divide-y divide-stone-800">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                        item.checked ? 'bg-stone-900/40 opacity-60' : 'hover:bg-stone-850/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onToggleItem(item.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            item.checked
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-stone-700 bg-stone-800 hover:border-emerald-500'
                          }`}
                        >
                          {item.checked && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div>
                          <span
                            className={`text-sm font-semibold ${
                              item.checked ? 'line-through text-stone-500' : 'text-stone-200'
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.isManual && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700 ml-2">
                              Custom Add
                            </span>
                          )}

                          <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                            Buy <span className="text-emerald-400 font-semibold">{item.quantityToBuy} {item.unit}</span>
                            {item.quantityInStock > 0 && (
                              <span className="text-stone-500">
                                {' '}(have {item.quantityInStock} {item.unit} in stock)
                              </span>
                            )}
                            {item.recipesReferenced && item.recipesReferenced.length > 0 && (
                              <span className="text-stone-500 block sm:inline sm:ml-2">
                                For: {item.recipesReferenced.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
