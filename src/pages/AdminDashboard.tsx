import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ExternalLink, 
  ArrowLeft, 
  Save, 
  Image as ImageIcon,
  CheckCircle2,
  Package,
  ListOrdered,
  Settings,
  Sparkles,
  Home,
  History,
  MessageSquare,
  BarChart3,
  LogOut,
  Bell,
  Search as SearchIcon,
  X,
  Calendar
} from 'lucide-react';
import { api, fileToBase64 } from '../utils/api';
import { Upload } from 'lucide-react';
import Orders from './dashboard/Orders';
import CustomOrders from './dashboard/CustomOrders';
import Products from './dashboard/Products';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/19XRPcGbwEVAVbBh0O9SV0YED8tc0M-mAuBbNSBQjXz4/edit";

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [view, setView] = useState<'overview' | 'add-product' | 'orders' | 'custom-orders' | 'products' | 'maintenance'>('overview');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersToday: 0,
    pendingStandard: 0,
    pendingCustom: 0,
    activeProducts: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/dashboard/orders') setView('orders');
    else if (path === '/dashboard/custom-orders') setView('custom-orders');
    else if (path === '/dashboard/add-product') setView('add-product');
    else if (path === '/dashboard/products') setView('products');
    else if (path === '/dashboard/maintenance') setView('maintenance');

    fetchMetrics();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [dateRange, customRange]);

  const fetchMetrics = async () => {
    setIsStatsLoading(true);
    try {
      const [products, standardOrders, customOrders] = await Promise.all([
        api.fetchProducts(),
        api.fetchOrders(),
        api.fetchCustomOrders()
      ]);

      const allOrders = [...standardOrders, ...customOrders];
      
      // Filter orders by date range
      const now = new Date();
      let startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      if (dateRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (dateRange === 'custom' && customRange.start) {
        startDate = new Date(customRange.start);
      }

      let endDate = new Date();
      if (dateRange === 'custom' && customRange.end) {
        endDate = new Date(customRange.end);
        endDate.setHours(23, 59, 59, 999);
      }

      const filteredOrders = allOrders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      // Calculate Revenue (Sum of filtered orders except cancelled)
      const revenue = filteredOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Orders in Range
      const ordersInRangeCount = filteredOrders.length;

      // Split Pending Counts
      const pendingStandard = standardOrders.filter(o => 
        ['pending', 'received', 'baking', 'delivery'].includes(o.status)
      ).length;

      const pendingCustom = customOrders.filter(o => 
        ['pending', 'received', 'baking', 'delivery'].includes(o.status)
      ).length;

      // Active Products
      const activeCount = products.filter(p => p.is_available).length;

      setStats({
        totalRevenue: revenue,
        ordersToday: ordersInRangeCount,
        pendingStandard: pendingStandard,
        pendingCustom: pendingCustom,
        activeProducts: activeCount
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    const path = newView === 'overview' ? '/dashboard' : `/dashboard/${newView}`;
    window.history.pushState({}, '', path);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Skillet Cakes',
    description: '',
    imageName: '',
    image: '', // Existing image URL
    availability: 'Yes',
    variants: [{ size: '1/2kg', price: '', stock: '' }]
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingProduct) {
        // Build prices and stock objects
        const prices: Record<string, number> = {};
        const stock: Record<string, number> = {};
        
        productForm.variants.forEach((v: any) => {
          if (v.size) {
            if (v.price) prices[v.size] = parseFloat(v.price);
            if (v.stock) stock[v.size] = parseInt(v.stock);
            else stock[v.size] = 0;
          }
        });

        let imageUrl = productForm.image;
        if (selectedFile) {
          imageUrl = await api.uploadImage(selectedFile, 'products');
        }

        await api.updateProduct(editingProduct.id, {
          name: productForm.name,
          category: productForm.category,
          description: productForm.description,
          image_url: imageUrl,
          is_available: productForm.availability === 'Yes',
          prices: prices,
          stock: stock,
          price: parseFloat(productForm.variants[0]?.price || '0')
        });
      } else {
        await api.submitProduct(productForm, selectedFile || undefined);
      }
      
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setView('products');
        setEditingProduct(null);
        setProductForm({
          name: '',
          category: 'Skillet Cakes',
          description: '',
          imageName: '',
          image: '',
          availability: 'Yes',
          variants: [{ size: '1/2kg', price: '', stock: '' }]
        });
        setSelectedFile(null);
      }, 2000);
    } catch (error) {
      console.error('Error adding product:', error);
      setIsSubmitting(false);
      alert('Failed to add product. Please check console for details.');
    }
  };

  const startEditing = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      description: product.desc,
      imageName: '',
      image: product.image,
      availability: product.is_available ? 'Yes' : 'No',
      variants: Object.entries(product.prices || {}).map(([size, price]) => ({
        size,
        price: String(price),
        stock: String(product.stock?.[size] || '0')
      }))
    });
    setView('add-product');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-espresso flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-espresso/5 flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-cocoa rounded-xl flex items-center justify-center text-cream">
              <Package size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-serif font-bold tracking-tight leading-none">mini<span className="text-cocoa">.</span>crumbs</span>
              <span className="text-[10px] font-bold text-cocoa/40 tracking-[0.2em] uppercase mt-1">Order Management</span>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', icon: Home, label: 'HOME' },
              { id: 'products', icon: Package, label: 'MY PRODUCTS' },
              { id: 'orders', icon: ListOrdered, label: 'ORDER LIST' },
              { id: 'custom-orders', icon: Sparkles, label: 'CUSTOM ORDERS' },
              { id: 'add-product', icon: PlusCircle, label: 'ADD PRODUCT' },
              { id: 'maintenance', icon: Settings, label: 'MAINTENANCE' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                  view === item.id 
                    ? 'bg-blush/20 text-cocoa shadow-sm border border-blush/30' 
                    : 'text-cocoa/40 hover:bg-cream hover:text-cocoa'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-espresso/5">
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm text-red-400 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            LOGOUT
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden bg-white/80 backdrop-blur-md border-b border-espresso/5 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cocoa rounded-lg flex items-center justify-center text-cream">
            <Package size={18} />
          </div>
          <span className="text-xl font-serif font-bold">mini<span className="text-cocoa">.</span>crumbs</span>
        </div>
        <div className="flex items-center gap-4">
           <button className="p-2 text-cocoa/40 hover:text-cocoa transition-colors"><SearchIcon size={20} /></button>
           <button 
            onClick={onBack}
            className="p-2 text-red-400/60 hover:text-red-500 transition-colors"
            title="Logout"
           >
              <LogOut size={20} />
           </button>
           <div className="w-8 h-8 rounded-full bg-cream overflow-hidden border border-espresso/10">
              <img src="/logo.jpg" alt="Admin" className="w-full h-full object-cover" />
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between px-10 py-6">
          <div className="relative w-96">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-cocoa/30" size={20} />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full bg-white border-none rounded-2xl pl-16 pr-6 py-4 shadow-sm outline-none focus:ring-2 focus:ring-cocoa/5 transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-3 bg-white rounded-2xl shadow-sm text-cocoa/40 hover:text-cocoa transition-all">
              <Bell size={22} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-400 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl shadow-sm border border-espresso/5">
              <div className="w-10 h-10 rounded-xl bg-cream overflow-hidden border border-espresso/5">
                <img src="/logo.jpg" alt="Admin" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-espresso">Mini Crumbs Admin</p>
                <p className="text-[10px] font-bold text-cocoa/40 tracking-widest uppercase">Bakery Manager</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 md:pt-0 overflow-y-auto pb-32 md:pb-10">
          <AnimatePresence mode="wait">
            {view === 'overview' ? (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Date Filter */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-2">
                  <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-espresso/5">
                    {(['today', 'week', 'month', 'custom'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setDateRange(r)}
                        className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                          dateRange === r 
                            ? 'bg-espresso text-cream shadow-md' 
                            : 'text-cocoa/40 hover:text-cocoa'
                        }`}
                      >
                        {r === 'today' ? 'Today' : r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : 'Custom'}
                      </button>
                    ))}
                  </div>

                  {dateRange === 'custom' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-espresso/5"
                    >
                      <input 
                        type="date" 
                        value={customRange.start}
                        onChange={e => setCustomRange({...customRange, start: e.target.value})}
                        className="bg-cream-dark/50 px-3 py-1.5 rounded-lg text-xs font-bold outline-none border-none"
                      />
                      <span className="text-cocoa/30 text-xs font-bold">to</span>
                      <input 
                        type="date" 
                        value={customRange.end}
                        onChange={e => setCustomRange({...customRange, end: e.target.value})}
                        className="bg-cream-dark/50 px-3 py-1.5 rounded-lg text-xs font-bold outline-none border-none"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Stats Summary */}
                <div className="bg-espresso text-cream p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-3xl font-serif mb-8">Welcome Back, Mini Crumbs!</h2>
                    <div className="flex gap-10">
                      <div>
                        <span className="block text-4xl font-bold mb-1">Live</span>
                        <span className="text-sm text-cream/50 uppercase tracking-widest font-medium">Sync Status</span>
                      </div>
                      <div className="w-px bg-cream/10 h-12 self-center"></div>
                      <div>
                        <span className="block text-4xl font-bold mb-1">{isStatsLoading ? '...' : stats.ordersToday}</span>
                        <span className="text-sm text-cream/50 uppercase tracking-widest font-medium">
                          {dateRange === 'today' ? 'Orders Today' : dateRange === 'week' ? 'Orders (7d)' : dateRange === 'month' ? 'Orders (30d)' : 'Orders (Custom)'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Package size={200} />
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: BarChart3, color: 'text-green-500' },
                    { label: 'Standard Orders', value: String(stats.pendingStandard).padStart(2, '0'), icon: ListOrdered, color: 'text-amber-500' },
                    { label: 'Custom Orders', value: String(stats.pendingCustom).padStart(2, '0'), icon: Sparkles, color: 'text-blush' },
                    { label: 'Active Menu', value: `${stats.activeProducts} Items`, icon: Package, color: 'text-cocoa' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-espresso/5 shadow-sm">
                      <div className="w-12 h-12 bg-cream rounded-2xl flex items-center justify-center mb-6">
                        <stat.icon className={stat.color} size={24} />
                      </div>
                      <p className="text-xs font-bold text-cocoa/40 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-2xl font-serif font-bold text-espresso">{isStatsLoading ? '...' : stat.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
          ) : view === 'add-product' ? (
            <motion.div 
              key="add-product"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => handleViewChange('overview')} className="p-2 hover:bg-cream rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-3xl font-serif font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              </div>

              <form onSubmit={handleAddProduct} className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-espresso/5 shadow-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-cocoa/80 ml-1">Product Name</label>
                    <input 
                      required
                      type="text" 
                      value={productForm.name}
                      onChange={e => setProductForm({...productForm, name: e.target.value})}
                      placeholder="e.g. Vanilla Rose Skillet"
                      className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-cocoa/80 ml-1">Category</label>
                    <select 
                      value={productForm.category}
                      onChange={e => setProductForm({...productForm, category: e.target.value})}
                      className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all appearance-none"
                    >
                      <option>Skillet Cakes</option>
                      <option>Brownies</option>
                      <option>Cookie Tin Cakes</option>
                      <option>Custom Cakes</option>
                      <option>Cheesecakes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-cocoa/80 ml-1">Availability</label>
                    <select 
                      value={productForm.availability}
                      onChange={e => setProductForm({...productForm, availability: e.target.value})}
                      className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all appearance-none"
                    >
                      <option value="Yes">In Stock</option>
                      <option value="No">Out of Stock</option>
                    </select>
                  </div>
                </div>

                {/* Variants Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-semibold text-cocoa/80">Product Variants</label>
                    <button 
                      type="button"
                      onClick={() => setProductForm({
                        ...productForm, 
                        variants: [...productForm.variants, { size: '', price: '', stock: '' }]
                      })}
                      className="text-xs font-bold text-cocoa bg-blush/30 px-3 py-1.5 rounded-full hover:bg-blush/50 transition-colors flex items-center gap-1"
                    >
                      <PlusCircle size={14} /> Add Variant
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {productForm.variants.map((variant, index) => (
                      <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex-1">
                          <input 
                            required
                            type="text" 
                            placeholder="Size (e.g. 1kg)"
                            value={variant.size}
                            onChange={e => {
                              const newVariants = [...productForm.variants];
                              newVariants[index].size = e.target.value;
                              setProductForm({...productForm, variants: newVariants});
                            }}
                            className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-5 py-3.5 outline-none transition-all text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <input 
                            required
                            type="number" 
                            placeholder="Price (₹)"
                            value={variant.price}
                            onChange={e => {
                              const newVariants = [...productForm.variants];
                              newVariants[index].price = e.target.value;
                              setProductForm({...productForm, variants: newVariants});
                            }}
                            className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-5 py-3.5 outline-none transition-all text-sm"
                          />
                        </div>
                        <div className="w-24">
                          <input 
                            required
                            type="number" 
                            placeholder="Stock"
                            value={variant.stock}
                            onChange={e => {
                              const newVariants = [...productForm.variants];
                              newVariants[index].stock = e.target.value;
                              setProductForm({...productForm, variants: newVariants});
                            }}
                            className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-4 py-3.5 outline-none transition-all text-sm"
                          />
                        </div>
                        {productForm.variants.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => {
                              const newVariants = productForm.variants.filter((_, i) => i !== index);
                              setProductForm({...productForm, variants: newVariants});
                            }}
                            className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-colors"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-cocoa/80 ml-1">Product Image</label>
                  <div className="w-full bg-cream-dark/50 border-2 border-dashed border-cocoa/10 rounded-[2rem] px-6 py-8 text-center hover:bg-blush/10 transition-colors relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setProductForm({ ...productForm, imageName: file.name });
                        }
                      }} 
                    />
                    <div className="flex flex-col items-center gap-3">
                      {selectedFile ? (
                        <>
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <ImageIcon className="text-cocoa" size={32} />
                          </div>
                          <span className="text-sm font-bold text-espresso">{selectedFile.name}</span>
                          <span className="text-xs text-cocoa/50">Click to change photo</span>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center text-cocoa/30 group-hover:scale-110 transition-transform">
                            <Upload size={32} />
                          </div>
                          <span className="text-sm font-bold text-espresso">Upload Product Image</span>
                          <span className="text-xs text-cocoa/50">High quality PNG or JPG recommended</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-cocoa/80 ml-1">Description</label>
                  <textarea 
                    required
                    rows={4}
                    value={productForm.description}
                    onChange={e => setProductForm({...productForm, description: e.target.value})}
                    placeholder="Describe the product..."
                    className="w-full bg-cream-dark/50 border-2 border-transparent focus:border-blush/30 focus:bg-white rounded-2xl px-5 py-4 outline-none transition-all resize-none"
                  />
                </div>

                <button 
                  disabled={isSubmitting || success}
                  className={`w-full py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                    success 
                      ? 'bg-green-500 text-white shadow-green-200' 
                      : 'bg-cocoa text-cream hover:bg-espresso shadow-cocoa/20 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin"></div>
                      Publishing...
                    </div>
                  ) : success ? (
                    <>Product Added Successfully <CheckCircle2 size={24} /></>
                  ) : (
                    <>{editingProduct ? 'Update Product' : 'Publish to Menu'} <Save size={20} /></>
                  )}
                </button>
              </form>
            </motion.div>
            ) : view === 'products' ? (
              <motion.div 
                key="products"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Products onEdit={startEditing} />
              </motion.div>
            ) : view === 'orders' ? (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Orders />
              </motion.div>
            ) : view === 'custom-orders' ? (
              <motion.div 
                key="custom-orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CustomOrders />
              </motion.div>
            ) : (
              <motion.div 
                key="maintenance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto"
              >
                <div className="mb-10">
                  <h2 className="text-4xl font-serif font-bold text-espresso">System Maintenance</h2>
                  <p className="text-cocoa/60 mt-2">Monitor your Database infrastructure and free tier limits.</p>
                </div>
                <DatabaseMaintenance />
              </motion.div>
            )}
        </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-3 shadow-2xl flex items-center justify-between">
          {[
            { id: 'overview', icon: Home, label: 'Home' },
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'orders', icon: ListOrdered, label: 'Orders' },
            { id: 'custom-orders', icon: Sparkles, label: 'Custom' },
            { id: 'add-product', icon: PlusCircle, label: 'Add' },
            { id: 'maintenance', icon: Settings, label: 'Maint' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id as any)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all ${
                view === item.id 
                  ? 'text-cocoa bg-cream/50' 
                  : 'text-cocoa/30'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              {view === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="w-1 h-1 bg-cocoa rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function DatabaseMaintenance() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.getSystemMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (isLoading) return <div className="mt-12 h-32 bg-white rounded-[2.5rem] animate-pulse border border-espresso/5 shadow-sm" />;
  if (!metrics) return null;

  const dbLimit = 500 * 1024 * 1024; // 500MB
  const storageLimit = 1024 * 1024 * 1024; // 1GB
  
  const dbUsage = (metrics.db_size_bytes / dbLimit) * 100;
  const storageUsage = (metrics.storage_size_bytes / storageLimit) * 100;

  return (
    <div className="mt-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 ml-2">
        <div className="w-8 h-8 bg-cocoa/10 rounded-lg flex items-center justify-center text-cocoa">
          <Settings size={18} />
        </div>
        <h3 className="text-2xl font-serif font-bold text-espresso">Database Maintenance</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* DB Usage */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-espresso/5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] font-bold text-cocoa/40 uppercase tracking-widest block mb-1">Database Storage</span>
              <span className="text-sm font-bold text-espresso">{(metrics.db_size_bytes / (1024 * 1024)).toFixed(2)} MB <span className="text-cocoa/30">/ 500 MB</span></span>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${dbUsage > 80 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {dbUsage.toFixed(1)}%
            </div>
          </div>
          <div className="h-3 bg-cream rounded-full overflow-hidden p-0.5 border border-espresso/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, dbUsage)}%` }}
              className={`h-full rounded-full transition-all duration-1000 ${dbUsage > 80 ? 'bg-red-400' : 'bg-gradient-to-r from-cocoa to-espresso'}`}
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-cocoa/40 font-medium italic">Database Free Tier Health: Optimal</p>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-espresso/5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] font-bold text-cocoa/40 uppercase tracking-widest block mb-1">Media Assets</span>
              <span className="text-sm font-bold text-espresso">{(metrics.storage_size_bytes / (1024 * 1024)).toFixed(2)} MB <span className="text-cocoa/30">/ 1 GB</span></span>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${storageUsage > 80 ? 'bg-red-100 text-red-600' : 'bg-blush/20 text-blush'}`}>
              {storageUsage.toFixed(1)}%
            </div>
          </div>
          <div className="h-3 bg-cream rounded-full overflow-hidden p-0.5 border border-espresso/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, storageUsage)}%` }}
              className={`h-full rounded-full transition-all duration-1000 ${storageUsage > 80 ? 'bg-red-400' : 'bg-gradient-to-r from-blush to-pink-400'}`}
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-cocoa/40 font-medium italic">Storage Status: Active & Synced</p>
          </div>
        </div>
      </div>
    </div>
  );
}
