import { motion } from 'motion/react';
import { Star, Plus, Minus } from 'lucide-react';
import { Product } from '../../types';

interface MobileProductCardProps {
   product: Product;
   qty: number;
   onMinus: () => void;
   onOpenSizeSelector: (product: Product) => void;
}

export function MobileProductCard({ product, qty, onMinus, onOpenSizeSelector }: MobileProductCardProps) {
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
            <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
            {product.popular && (
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 px-2.5 py-0.5 rounded-full flex items-center shadow-md">
                  <Star size={10} className="text-gold fill-gold" />
               </div>
            )}
         </div>

         {/* Interactive Content Layer */}
         <div className="flex-grow pl-6 pr-4 h-full flex flex-col justify-center min-w-0 z-10">
            <h3 className="text-[17px] font-bold text-espresso leading-tight mb-2 line-clamp-2">{product.name}</h3>
            
            <div className="flex items-end justify-between mt-1">
               <div className="flex flex-col">
                  <p className="text-xs text-cocoa uppercase tracking-wider font-semibold opacity-60 mb-0.5">Price</p>
                  <p className="text-[16px] font-black text-espresso">₹{product.price}</p>
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
                     onClick={() => onOpenSizeSelector(product)} 
                     className="w-9 h-9 rounded-full bg-espresso text-cream flex items-center justify-center shadow-md active:scale-90 transition-transform"
                  >
                     <Plus size={18} />
                  </button>
               </div>
            </div>
         </div>
      </motion.div>
   );
}
