import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { MobileProductCard } from './MobileProductCard';
import { CATEGORIES, PRODUCTS } from '../../data/constants';
import { Product, CartItem } from '../../types';

interface MenuSectionProps {
   cart: CartItem[];
   onOpenSizeSelector: (product: Product) => void;
   updateCartQuantity: (id: string, delta: number) => void;
   showTitle?: boolean;
   showViewAllBtn?: boolean;
   onViewAll?: () => void;
}

export function MenuSection({ cart, onOpenSizeSelector, updateCartQuantity, showTitle = true, showViewAllBtn = true, onViewAll }: MenuSectionProps) {
   const [activeCategory, setActiveCategory] = useState("All");
   const [searchQuery, setSearchQuery] = useState("");

   const filteredProducts = PRODUCTS.filter(p => {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
   });

   // On Landing view, show limited items (6 as requested) if not viewing full menu
   const isLimitedView = showViewAllBtn;
   const displayedProducts = isLimitedView ? filteredProducts.slice(0, 6) : filteredProducts;

   const getProductTotalQuantity = (productId: number) => {
      return cart.filter(item => item.productId === productId).reduce((acc, item) => acc + item.quantity, 0);
   };

   return (
      <section id="menu" className={`${!showTitle ? 'pt-8' : 'pt-24'} pb-24 px-6 lg:px-12 max-w-7xl mx-auto`}>
         {showTitle && (
            <div className="text-center mb-10">
               <h2 className="text-4xl lg:text-5xl mb-4 text-espresso">Our Menu</h2>
               <p className="text-cocoa/70 max-w-2xl mx-auto font-light mb-8">Explore our collection of handcrafted desserts. Everything is baked fresh upon order to guarantee maximum deliciousness.</p>
            </div>
         )}

         <div className="text-center mb-10">
            <div className="max-w-md mx-auto relative mb-6">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-cocoa/50" />
               </div>
               <input
                  type="text"
                  placeholder="Search cakes, brownies..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-cocoa/10 rounded-full py-3.5 pl-12 pr-12 text-sm text-espresso placeholder:text-cocoa/40 focus:outline-none focus:border-cocoa/40 shadow-sm transition-colors"
               />
               {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-4 flex items-center text-cocoa/40 hover:text-cocoa">
                     <X size={16} />
                  </button>
               )}
            </div>
         </div>

         {/* Categories */}
         <div className="flex overflow-x-auto scrollbar-hide gap-3 mb-12 pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 lg:flex-wrap lg:justify-center">
            {CATEGORIES.map((cat) => (
               <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat
                        ? 'bg-cocoa text-white shadow-md'
                        : 'bg-cream-dark text-espresso hover:bg-blush/40'
                     }`}
               >
                  {cat}
               </button>
            ))}
         </div>

         {/* Product Grid - Desktop Pattern */}
         <motion.div layout className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
               {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onOpenSizeSelector={onOpenSizeSelector} />
               ))}
            </AnimatePresence>
         </motion.div>

         {/* Product List - Mobile Pattern */}
         <motion.div layout className="flex flex-col sm:hidden gap-6 mt-4">
            <AnimatePresence>
               {displayedProducts.map(product => {
                  const qty = getProductTotalQuantity(product.id);
                  const handleMinus = () => {
                      const items = cart.filter(i => i.productId === product.id);
                      if (items.length === 1) {
                         updateCartQuantity(items[0].id, -1);
                      } else if (items.length > 1) {
                         onOpenSizeSelector(product);
                      }
                  };

                  return (
                     <MobileProductCard 
                        key={product.id} 
                        product={product} 
                        qty={qty} 
                        onMinus={handleMinus} 
                        onOpenSizeSelector={onOpenSizeSelector} 
                     />
                  );
               })}
            </AnimatePresence>
         </motion.div>

         {/* View Full Menu Button */}
         {showViewAllBtn && (
            <div className="mt-8 flex justify-center pb-12">
               <button 
                  onClick={onViewAll} 
                  className="px-8 py-3.5 rounded-full bg-white border border-cocoa/10 text-espresso font-medium shadow-sm hover:bg-cream transition-colors text-sm"
               >
                  View Full Menu
               </button>
            </div>
         )}
      </section>
   );
}
