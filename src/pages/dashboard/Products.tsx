import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Trash2, 
  Eye, 
  EyeOff, 
  MoreVertical, 
  Search,
  Filter,
  Plus,
  Edit2
} from 'lucide-react';
import { api } from '../../utils/api';
import { Product } from '../../types';

interface ProductsProps {
  onEdit: (product: Product) => void;
}

export default function Products({ onEdit }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await api.fetchProducts();
    setProducts(data);
    setLoading(false);
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await api.updateProduct(product.id, { is_available: !product.is_available });
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, is_available: !p.is_available } : p
      ));
    } catch (error) {
      alert('Failed to update availability');
    }
  };

  const deleteProduct = async (id: string) => {
    // Click test to confirm event firing
    console.log('Delete button clicked for ID:', id);
    
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
      await api.deleteProduct(id);
      
      // Update local state and show success
      setProducts(prev => prev.filter(p => p.id !== id));
      alert('Product successfully removed from your menu.');
    } catch (error: any) {
      console.error('Delete operation failed:', error);
      alert(`Delete failed: ${error.message || 'Check your internet connection'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || p.category === filter;
    return matchesSearch && matchesFilter;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-espresso mb-1">My Products</h2>
          <p className="text-cocoa/40 font-medium">Manage your bakery menu and inventory</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/30" size={18} />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-espresso/5 rounded-2xl pl-12 pr-6 py-3.5 text-sm outline-none focus:ring-2 focus:ring-cocoa/5 shadow-sm w-64 transition-all"
            />
          </div>
          <div className="relative">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-espresso/5 rounded-2xl pl-6 pr-10 py-3.5 text-sm outline-none focus:ring-2 focus:ring-cocoa/5 shadow-sm appearance-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-cocoa/30 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-cocoa/10 border-t-cocoa rounded-full animate-spin"></div>
          <p className="text-cocoa/40 font-bold tracking-widest text-xs uppercase">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-espresso/10">
          <div className="w-20 h-20 bg-cream rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-cocoa/20">
            <Package size={40} />
          </div>
          <h3 className="text-xl font-serif font-bold mb-2">No Products Found</h3>
          <p className="text-cocoa/40 max-w-xs mx-auto">Start by adding your first product to the menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] overflow-hidden border border-espresso/5 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md ${
                      product.is_available 
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}>
                      {product.is_available ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/80 text-espresso border border-white/20">
                      {product.category}
                    </span>
                  </div>
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <button 
                      onClick={() => toggleAvailability(product)}
                      className="p-4 bg-white rounded-2xl text-espresso hover:bg-cream transition-all hover:scale-110 shadow-lg"
                      title={product.is_available ? "Mark as Out of Stock" : "Mark as In Stock"}
                     >
                        {product.is_available ? <EyeOff size={20} /> : <Eye size={20} />}
                     </button>
                     <button 
                      onClick={() => onEdit(product)}
                      className="p-4 bg-white rounded-2xl text-espresso hover:bg-cream transition-all hover:scale-110 shadow-lg"
                      title="Edit Product"
                     >
                        <Edit2 size={20} />
                     </button>
                     <button 
                      onClick={() => deleteProduct(product.id)}
                      className="p-4 bg-red-500 rounded-2xl text-white hover:bg-red-600 transition-all hover:scale-110 shadow-lg"
                      title="Delete Product"
                     >
                        <Trash2 size={20} />
                     </button>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="text-xl font-serif font-bold text-espresso line-clamp-1">{product.name}</h3>
                    <p className="text-lg font-bold text-cocoa">₹{product.price}</p>
                  </div>
                  
                  <p className="text-sm text-cocoa/40 line-clamp-2 mb-6 h-10">
                    {product.desc}
                  </p>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {product.prices && Object.entries(product.prices).map(([size, price]) => (
                      <div key={size} className="flex-shrink-0 px-3 py-1.5 bg-cream rounded-xl border border-espresso/5">
                        <span className="text-[10px] font-bold text-cocoa/40 block leading-none mb-1">{size}</span>
                        <span className="text-xs font-bold text-espresso">₹{price as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
