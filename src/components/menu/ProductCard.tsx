import { motion } from 'motion/react';
import { Star, Plus } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
   product: Product;
   onOpenSizeSelector: (product: Product) => void;
}

export function ProductCard({ product, onOpenSizeSelector }: ProductCardProps) {
   console.log("IMAGE URL:", product.image);
   return (
      <motion.div
         layout
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.95 }}
         transition={{ duration: 0.4 }}
         className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow ring-1 ring-black/5"
      >
         <div className="aspect-[4/3] relative overflow-hidden bg-cream-dark">
            <img
               src={encodeURI(product.image)}
               alt={product.name}
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
               loading="lazy"
               onError={(e) => {
                  console.log("Failed image:", product.image);
                  e.currentTarget.src = "https://via.placeholder.com/300x200?text=Image+Error";
               }}
               />
            {product.popular && (
               <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-cocoa shadow-sm flex items-center gap-1">
                  <Star size={12} className="text-gold fill-gold" /> Popular
               </div>
            )}
            {(!product.is_available || Object.values(product.stock || {}).reduce((a, b) => a + (b || 0), 0) <= 0) && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter -rotate-12 border-2 border-white/50 px-2 py-1 rounded">SOLD OUT</span>
               </div>
            )}
            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
               <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium text-espresso shadow-sm">
                  ₹{product.price}
               </div>
               {product.is_available && (
                  <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-cocoa shadow-sm uppercase tracking-wider">
                     {Object.values(product.stock || {}).reduce((a, b) => a + (b || 0), 0)} in stock
                  </div>
               )}
            </div>
         </div>
         <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-medium mb-2 text-espresso">{product.name}</h3>
            <p className="text-sm font-light text-cocoa/80 mb-6 flex-grow">{product.desc}</p>
            <button
               onClick={() => product.is_available && onOpenSizeSelector(product)}
               disabled={!product.is_available}
               className={`w-full font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  product.is_available 
                     ? "bg-cream-dark text-espresso hover:bg-cocoa hover:text-white" 
                     : "bg-espresso/5 text-espresso/20 cursor-not-allowed"
               }`}
            >
               <Plus size={16} /> {product.is_available ? "Add to Cart" : "Out of Stock"}
            </button>
         </div>
      </motion.div>
   );
}
