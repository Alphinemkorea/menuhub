import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  Minus, 
  Trash2, 
  Check, 
  Sparkles,
  ShieldAlert,
  ArrowUpDown,
  Edit3,
  X,
  Receipt
} from 'lucide-react';
import { InventoryItem, Recipe } from '../types';

interface InventoryViewProps {
  inventory: InventoryItem[];
  recipes: Recipe[];
  onAddItem: (item: Omit<InventoryItem, 'id' | 'addedDate'>) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onEditItem?: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onFilterRecipesByIngredient: (ingredientName: string) => void;
  onOpenScanReceipt?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  recipes,
  onAddItem,
  onUpdateQuantity,
  onEditItem,
  onDeleteItem,
  onFilterRecipesByIngredient,
  onOpenScanReceipt,
}) => {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<'All' | 'Fridge' | 'Pantry' | 'Freezer'>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Produce');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [location, setLocation] = useState<InventoryItem['location']>('Fridge');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [estimatedPrice, setEstimatedPrice] = useState('');

  // Calculate days remaining helper
  const getDaysRemaining = (expStr: string) => {
    if (!expStr) return 999;
    const diffMs = new Date(expStr).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Expiring soon items
  const expiringItems = inventory.filter((item) => {
    const days = getDaysRemaining(item.expiryDate);
    return days <= 3 && days >= 0;
  });

  // Filtered inventory
  const filtered = inventory.filter((item) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (locationFilter !== 'All' && item.location !== locationFilter) {
      return false;
    }
    return true;
  });

  // Sort: expiring soonest first
  const sorted = [...filtered].sort((a, b) => {
    return getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate);
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim() || 'pcs',
      location,
      expiryDate,
      estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
    });

    setName('');
    setQuantity('1');
    setIsAddModalOpen(false);
  };

  // Quick restock shortcuts
  const quickRestockPresets = [
    { name: 'Eggs', unit: 'pcs', qty: 6, cat: 'Protein & Dairy', loc: 'Fridge', days: 14 },
    { name: 'Chicken', unit: 'kg', qty: 1, cat: 'Protein & Dairy', loc: 'Fridge', days: 3 },
    { name: 'Rice', unit: 'kg', qty: 2, cat: 'Pantry & Grains', loc: 'Pantry', days: 90 },
    { name: 'Tomatoes', unit: 'pcs', qty: 4, cat: 'Produce', loc: 'Fridge', days: 5 },
    { name: 'Onions', unit: 'pcs', qty: 3, cat: 'Produce', loc: 'Pantry', days: 14 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
            Kitchen Inventory
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Real-time tracking of ingredients, freshness shelf-life, and storage locations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenScanReceipt && (
            <button
              onClick={onOpenScanReceipt}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-medium text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Scan Grocery Receipt</span>
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Urgent Expiry Warning Bar */}
      {expiringItems.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-amber-200">
              Ingredients Expiring Soon ({expiringItems.length})
            </div>
            <p className="text-amber-300/80 leading-relaxed">
              {expiringItems.map((item) => {
                const days = getDaysRemaining(item.expiryDate);
                return `${item.name} (${days === 0 ? 'today' : `in ${days}d`})`;
              }).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Quick Restock Bar */}
      <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
        <span className="text-xs font-mono text-stone-400 uppercase tracking-wider block">
          Quick Restock Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {quickRestockPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + preset.days);
                onAddItem({
                  name: preset.name,
                  category: preset.cat as any,
                  quantity: preset.qty,
                  unit: preset.unit,
                  location: preset.loc as any,
                  expiryDate: d.toISOString().split('T')[0],
                });
              }}
              className="px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-750 border border-stone-700 text-xs text-stone-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>{preset.name} (+{preset.qty} {preset.unit})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Location Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900 border border-stone-800 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory ingredients..."
            className="w-full pl-9 pr-4 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1">
          {(['All', 'Fridge', 'Pantry', 'Freezer'] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => setLocationFilter(loc)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                locationFilter === loc
                  ? 'bg-stone-800 text-emerald-400 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items List */}
      <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-900/60 divide-y divide-stone-800">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-sm">
            No ingredients found in this storage area.
          </div>
        ) : (
          sorted.map((item) => {
            const days = getDaysRemaining(item.expiryDate);
            const isExpiringSoon = days <= 3 && days >= 0;
            const isExpired = days < 0;

            // Recipes that use this ingredient
            const matchingRecipes = recipes.filter((r) =>
              r.ingredients.some(
                (ing) =>
                  ing.name.toLowerCase().includes(item.name.toLowerCase()) ||
                  item.name.toLowerCase().includes(ing.name.toLowerCase())
              )
            );

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-850/50 transition-colors"
              >
                {/* Left info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-100 text-sm">{item.name}</span>
                    <span className="text-[11px] font-mono text-stone-400 px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700">
                      {item.location}
                    </span>
                    <span className="text-[11px] text-stone-400">{item.category}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-500" />
                      <span>Expires: {item.expiryDate || 'No date'}</span>
                    </span>

                    <span
                      className={`font-mono text-[11px] font-medium ${
                        isExpired
                          ? 'text-rose-400'
                          : isExpiringSoon
                          ? 'text-amber-400'
                          : 'text-stone-400'
                      }`}
                    >
                      {isExpired
                        ? 'Expired'
                        : days === 0
                        ? 'Expires today'
                        : days === 1
                        ? 'Expires tomorrow'
                        : `${days} days left`}
                    </span>
                  </div>
                </div>

                {/* Right controls: quantity stepper & actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  {/* Quantity adjustment */}
                  <div className="flex items-center gap-1.5 bg-stone-800 border border-stone-700 rounded-lg p-1">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="p-1 hover:bg-stone-700 rounded text-stone-300"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-semibold px-2 text-stone-100 min-w-[3.5rem] text-center">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1 hover:bg-stone-700 rounded text-stone-300"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Recipes button */}
                  {matchingRecipes.length > 0 && (
                    <button
                      onClick={() => onFilterRecipesByIngredient(item.name)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-mono underline"
                      title={`Used in ${matchingRecipes.length} recipes`}
                    >
                      {matchingRecipes.length} recipe{matchingRecipes.length === 1 ? '' : 's'}
                    </button>
                  )}

                  {/* Edit */}
                  {onEditItem && (
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 rounded text-stone-500 hover:text-emerald-400 hover:bg-stone-800 transition-colors"
                      title="Edit ingredient details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 rounded text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                    title="Remove from inventory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="font-serif text-xl font-bold text-stone-100">Add Inventory Item</h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Ingredient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chicken breast, Eggs, Jasmine Rice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, g, pcs, ml, cans"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Protein & Dairy">Protein & Dairy</option>
                    <option value="Pantry & Grains">Pantry & Grains</option>
                    <option value="Spices & Sauces">Spices & Sauces</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Fridge">Fridge</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Freezer">Freezer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Est. Price (optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4.50"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs text-stone-300 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-stone-100">Edit Inventory Item</h2>
              <button onClick={() => setEditingItem(null)} className="text-stone-400 hover:text-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onEditItem && editingItem) {
                  onEditItem(editingItem);
                }
                setEditingItem(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Ingredient Name
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Protein & Dairy">Protein & Dairy</option>
                    <option value="Pantry & Grains">Pantry & Grains</option>
                    <option value="Spices & Sauces">Spices & Sauces</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Location</label>
                  <select
                    value={editingItem.location}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Fridge">Fridge</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Freezer">Freezer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={editingItem.expiryDate}
                  onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-2 rounded-lg text-xs text-stone-300 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Update Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
