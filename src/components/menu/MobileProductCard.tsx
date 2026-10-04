import { motion } from 'motion/react';
import { Star, Plus, Minus, Clock } from 'lucide-react';
import { Product } from '../../types';
import { getPrepTime } from '../../utils/prepTime';

interface MobileProductCardProps {
   product: Product;
   qty: number;
   onMinus: () => void;
   onOpenSizeSelector: (product: Product) => void;
}

export function MobileProductCard({ product, qty, onMinus, onOpenSizeSelector }: MobileProductCardProps) {
   const prepTime = getPrepTime(product.prep_duration);
   const totalStock = Object.values(product.stock || {}).reduce((a, b) => a + (b || 0), 0);
   const isSoldOut = !product.is_available || totalStock <= 0;
   return (
      <motion.div
         layout
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: -20 }}
         transition={{ duration: 0.3 }}
         className="relative flex items-center mb-12 h-44 w-full pr-2"
      >
         {/* Decorative Pill Background - Purely visual */}
         <div className="absolute inset-y-2 right-0 left-12 bg-[#f8f7f5] rounded-[44px] -z-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-espresso/5" />
         
         {/* Image - Positioned absolutely to overlap perfectly */}
         <div className="w-40 h-40 rounded-full overflow-hidden shadow-xl flex-shrink-0 relative border-4 border-white bg-cream-dark z-20 ml-0">
            <img src={product.image} className="w-full h-full object-cover" alt={product.name} loading="lazy" />
            {product.popular && (
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 px-2.5 py-0.5 rounded-full flex items-center shadow-md">
                  <Star size={10} className="text-gold fill-gold" />
               </div>
            )}
            {(!product.is_available || Object.values(product.stock || {}).reduce((a, b) => a + (b || 0), 0) <= 0) && (
               <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter -rotate-12 border-2 border-white/50 px-2 py-1 rounded">SOLD OUT</span>
               </div>
            )}
         </div>

         {/* Interactive Content Layer */}
         <div className="flex-grow pl-6 pr-4 h-full flex flex-col justify-center min-w-0 z-10">
            <h3 className="text-[17px] font-bold text-espresso leading-tight mb-2 line-clamp-2">{product.name}</h3>
            {prepTime && (
               <p className="inline-flex items-center gap-1.5 self-start max-w-full min-w-0 text-xs leading-none font-bold text-espresso bg-gold/20 border border-gold/40 rounded-full px-2.5 py-1.5 mb-1.5">
                  <Clock size={12} className="flex-shrink-0 text-gold" />
                  <span className="truncate">Prep time: {prepTime}</span>
               </p>
            )}

            <div className="flex items-end justify-between mt-1">
               <div className="flex flex-col">
                  <p className="text-[16px] font-black text-espresso">₹{product.price}</p>
                  {isSoldOut ? (
                     <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest mt-1">Sold</p>
                  ) : (
                     <p className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest mt-1">{totalStock} left</p>
                  )}
               </div>
               
               <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm border border-espresso/5">
                  <button 
                     onClick={onMinus} 
                     disabled={qty === 0} 
                     className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${qty > 0 ? "bg-espresso text-cream shadow-md active:scale-90" : "bg-cocoa/10 text-cocoa/30"}`}
                  >
                     <Minus size={18} />
                  </button>
                  <span className="text-[16px] font-bold w-4 text-center text-espresso">{qty}</span>
                  <button 
                     onClick={() => product.is_available && onOpenSizeSelector(product)} 
                     disabled={!product.is_available}
                     className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all ${
                        product.is_available ? "bg-espresso text-cream" : "bg-cocoa/5 text-cocoa/20 cursor-not-allowed"
                     }`}
                  >
                     <Plus size={18} />
                  </button>
               </div>
            </div>
         </div>
      </motion.div>
   );
}
