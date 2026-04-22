import { motion } from 'motion/react';
import { Star, Plus } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
   product: Product;
   onOpenSizeSelector: (product: Product) => void;
}

export function ProductCard({ product, onOpenSizeSelector }: ProductCardProps) {
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
               src={product.image}
               alt={product.name}
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {product.popular && (
               <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-cocoa shadow-sm flex items-center gap-1">
                  <Star size={12} className="text-gold fill-gold" /> Popular
               </div>
            )}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium text-espresso shadow-sm">
               ₹{product.price}
            </div>
         </div>
         <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-medium mb-2 text-espresso">{product.name}</h3>
            <p className="text-sm font-light text-cocoa/80 mb-6 flex-grow">{product.desc}</p>
            <button
               onClick={() => onOpenSizeSelector(product)}
               className="w-full bg-cream-dark text-espresso font-medium py-3.5 rounded-xl hover:bg-cocoa hover:text-white transition-colors flex items-center justify-center gap-2"
            >
               <Plus size={16} /> Add to Cart
            </button>
         </div>
      </motion.div>
   );
}
