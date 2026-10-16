import React, { useState } from 'react';
import { 
  Wrench, 
  Check, 
  X, 
  Plus, 
  Sparkles, 
  AlertCircle, 
  Flame, 
  CookingPot,
  Trash2
} from 'lucide-react';
import { EquipmentItem } from '../types';

interface EquipmentViewProps {
  equipment: EquipmentItem[];
  onToggleEquipment: (id: string) => void;
  onAddEquipment: (item: Omit<EquipmentItem, 'id'>) => void;
  onDeleteEquipment: (id: string) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  equipment,
  onToggleEquipment,
  onAddEquipment,
  onDeleteEquipment,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentItem['category']>('Small Appliances');
  const [owned, setOwned] = useState(true);
  const [notes, setNotes] = useState('');

  const categories = Array.from(new Set(equipment.map((e) => e.category)));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddEquipment({
      name: name.trim(),
      category,
      owned,
      notes: notes.trim() || undefined,
    });
    setName('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const ownedCount = equipment.filter((e) => e.owned).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-tight">
            Kitchen Equipment Profile
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            MenuHub checks what you have before recommending meals. If you don't own an oven, Bianca will never suggest a baked dish without adapting it to stovetop or pan.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Kitchen Tool</span>
        </button>
      </div>

      {/* Bianca Equipment Intelligence Banner */}
      <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-stone-200">
            Bianca Equipment Adaptation Active
          </div>
          <p className="text-stone-400 leading-relaxed">
            Currently tracking <span className="text-stone-200 font-medium">{ownedCount} owned items</span> out of {equipment.length}. Any recipe requiring unowned equipment (such as an Oven or Pressure Cooker) automatically prompts Bianca to calculate alternative cook-times and stovetop techniques.
          </p>
        </div>
      </div>

      {/* Equipment Categories */}
      <div className="space-y-5">
        {categories.map((cat) => {
          const items = equipment.filter((e) => e.category === cat);
          return (
            <div key={cat} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-stone-850 border-b border-stone-800 flex items-center justify-between text-xs font-semibold text-stone-300 font-mono uppercase tracking-wider">
                <span>{cat}</span>
                <span className="text-stone-500">
                  {items.filter((i) => i.owned).length}/{items.length} owned
                </span>
              </div>

              <div className="divide-y divide-stone-800">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-stone-850/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stone-200">{item.name}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            item.owned
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {item.owned ? 'In Kitchen' : 'Not Owned'}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-stone-400 mt-0.5">{item.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleEquipment(item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          item.owned
                            ? 'bg-stone-800 hover:bg-stone-750 border-stone-700 text-stone-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                        }`}
                      >
                        {item.owned ? (
                          <>
                            <X className="w-3.5 h-3.5 text-stone-400" />
                            <span>Mark Not Owned</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark as Owned</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onDeleteEquipment(item.id)}
                        className="p-1.5 text-stone-500 hover:text-rose-400 transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Equipment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="font-serif text-xl font-bold text-stone-100">Add Kitchen Tool</h2>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Equipment Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Immersion Blender, Cast Iron Skillet, Wok"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Stovetop & Cooktop">Stovetop & Cooktop</option>
                  <option value="Cookware & Pans">Cookware & Pans</option>
                  <option value="Oven & Baking">Oven & Baking</option>
                  <option value="Small Appliances">Small Appliances</option>
                  <option value="Prep Tools">Prep Tools</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10-inch non-stick, 1200W, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ownedCheckbox"
                  checked={owned}
                  onChange={(e) => setOwned(e.target.checked)}
                  className="rounded border-stone-700 bg-stone-800 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="ownedCheckbox" className="text-xs text-stone-300">
                  I currently have this in my kitchen
                </label>
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
                  Save Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
