import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Candy, Trash2, Plus, Eye, EyeOff, Check } from 'lucide-react';
import { api } from '../../utils/api';
import { Topping } from '../../types';

export default function Toppings() {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');

  // Per-row local stock edits, keyed by topping id.
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    loadToppings();
  }, []);

  const loadToppings = async () => {
    setLoading(true);
    const data = await api.fetchToppings();
    setToppings(data);
    setLoading(false);
  };

  const addTopping = async () => {
    const name = newName.trim();
    const price = parseFloat(newPrice);
    const stock = parseInt(newStock);
    if (!name) return alert('Please enter a topping name.');
    if (isNaN(price) || price < 0) return alert('Please enter a valid price.');

    try {
      setSaving(true);
      await api.createTopping({ name, price, stock: isNaN(stock) ? 0 : stock });
      setNewName('');
      setNewPrice('');
      setNewStock('');
      await loadToppings();
    } catch {
      alert('Failed to add topping.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (topping: Topping) => {
    try {
      await api.updateTopping(topping.id, { is_available: !topping.is_available });
      setToppings(prev => prev.map(t => t.id === topping.id ? { ...t, is_available: !t.is_available } : t));
    } catch {
      alert('Failed to update topping.');
    }
  };

  const commitStock = async (topping: Topping) => {
    const draft = stockDrafts[topping.id];
    if (draft === undefined) return;
    const value = parseInt(draft);
    setStockDrafts(prev => {
      const next = { ...prev };
      delete next[topping.id];
      return next;
    });
    if (isNaN(value) || value < 0 || value === topping.stock) return;
    try {
      await api.updateTopping(topping.id, { stock: value });
      setToppings(prev => prev.map(t => t.id === topping.id ? { ...t, stock: value } : t));
    } catch {
      alert('Failed to update stock.');
    }
  };

  const deleteTopping = async (id: string) => {
    if (!confirm('Delete this topping? This cannot be undone.')) return;
    try {
      await api.deleteTopping(id);
      setToppings(prev => prev.filter(t => t.id !== id));
    } catch {
      alert('Failed to delete topping.');
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-serif font-bold text-espresso mb-1">Toppings</h2>
        <p className="text-cocoa/40 font-medium">Manage the toppings customers can add to their orders</p>
      </div>

      {/* Add topping */}
      <div className="bg-white rounded-[2rem] border border-espresso/5 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-cocoa/50 uppercase tracking-widest ml-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Chocolate Chips"
              className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-5 py-3.5 outline-none transition-all text-sm"
            />
          </div>
          <div className="w-full md:w-32 space-y-1.5">
            <label className="text-xs font-bold text-cocoa/50 uppercase tracking-widest ml-1">Price (₹)</label>
            <input
              type="number"
              min="0"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="0"
              className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-5 py-3.5 outline-none transition-all text-sm"
            />
          </div>
          <div className="w-full md:w-32 space-y-1.5">
            <label className="text-xs font-bold text-cocoa/50 uppercase tracking-widest ml-1">Stock</label>
            <input
              type="number"
              min="0"
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
              placeholder="0"
              className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-5 py-3.5 outline-none transition-all text-sm"
            />
          </div>
          <button
            onClick={addTopping}
            disabled={saving}
            className="bg-cocoa text-cream font-bold text-sm px-6 py-3.5 rounded-2xl hover:bg-espresso transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-cocoa/10 border-t-cocoa rounded-full animate-spin"></div>
          <p className="text-cocoa/40 font-bold tracking-widest text-xs uppercase">Loading toppings...</p>
        </div>
      ) : toppings.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-espresso/10">
          <div className="w-20 h-20 bg-cream rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-cocoa/20">
            <Candy size={40} />
          </div>
          <h3 className="text-xl font-serif font-bold mb-2">No Toppings Yet</h3>
          <p className="text-cocoa/40 max-w-xs mx-auto">Add your first topping above to offer it at checkout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {toppings.map(topping => {
              const outOfStock = topping.stock <= 0 || !topping.is_available;
              const draft = stockDrafts[topping.id];
              return (
                <motion.div
                  key={topping.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white rounded-[2rem] border border-espresso/5 shadow-sm p-6 transition-all ${
                    outOfStock ? 'opacity-50 grayscale' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-serif font-bold text-espresso truncate">{topping.name}</h3>
                      <p className="text-sm font-bold text-cocoa">₹{topping.price}</p>
                    </div>
                    <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      outOfStock ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                 : 'bg-green-500/10 text-green-600 border border-green-500/20'
                    }`}>
                      {topping.is_available ? (topping.stock > 0 ? `${topping.stock} left` : 'Out of stock') : 'Hidden'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-[10px] font-bold text-cocoa/40 uppercase tracking-widest">Stock</span>
                      <input
                        type="number"
                        min="0"
                        value={draft !== undefined ? draft : String(topping.stock)}
                        onChange={e => setStockDrafts(prev => ({ ...prev, [topping.id]: e.target.value }))}
                        onBlur={() => commitStock(topping)}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        className="w-20 bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-xl px-3 py-2 outline-none transition-all text-sm font-bold"
                      />
                      {draft !== undefined && (
                        <button onClick={() => commitStock(topping)} className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-colors">
                          <Check size={16} />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => toggleAvailability(topping)}
                      title={topping.is_available ? 'Hide from checkout' : 'Show at checkout'}
                      className="p-2.5 bg-cream text-espresso rounded-xl hover:bg-cream-dark transition-colors"
                    >
                      {topping.is_available ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => deleteTopping(topping.id)}
                      title="Delete topping"
                      className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
