import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus } from 'lucide-react';
import { Size, Product, CartItem } from '../../types';

interface SizeSelectorProps {
   isOpen: boolean;
   product: Product | null;
   onClose: () => void;
   cart: CartItem[];
   updateQuantity: (id: string, delta: number) => void;
   onAdd: (product: Product, size: Size) => void;
}

export function SizeSelector({ isOpen, product, onClose, cart, updateQuantity, onAdd }: SizeSelectorProps) {
    if (!isOpen || !product) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
               <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="absolute inset-0 bg-espresso/40 backdrop-blur-[2px]" 
                  onClick={onClose}
               />
               <motion.div 
                  initial={{ y: "100%" }} 
                  animate={{ y: 0 }} 
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 w-full max-w-md relative z-10 shadow-2xl"
               >
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-semibold text-espresso">Select Size</h3>
                     <button onClick={onClose} className="p-2 bg-cream-dark rounded-full text-cocoa hover:text-espresso">
                        <X size={18} />
                     </button>
                  </div>
                  <p className="text-cocoa text-sm mb-6 pb-4 border-b border-cocoa/10">Choose variants for {product.name}</p>
                  
                  <div className="space-y-4">
                     {(["1/2kg", "1kg", "1.5kg"] as Size[]).map(size => {
                        const id = `${product.id}-${size}`;
                        const cartItem = cart.find(i => i.id === id);
                        const qty = cartItem ? cartItem.quantity : 0;
                        return (
                           <div key={size} className="flex justify-between items-center p-4 rounded-2xl bg-cream-dark border border-white">
                              <div>
                                 <p className="font-medium text-espresso">{size}</p>
                                 <p className="text-sm text-cocoa mt-0.5">₹{product.prices[size]}</p>
                              </div>
                              <div className="flex items-center gap-4 bg-white rounded-full p-1 shadow-sm border border-cocoa/5">
                                 <button 
                                    onClick={() => updateQuantity(id, -1)} 
                                    disabled={qty === 0}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${qty > 0 ? "bg-cream-dark text-espresso" : "text-cocoa/30"}`}
                                 >
                                    <Minus size={16} />
                                 </button>
                                 <span className="font-medium text-espresso w-4 text-center">{qty}</span>
                                 <button 
                                    onClick={() => onAdd(product, size)} 
                                    className="w-9 h-9 flex items-center justify-center bg-espresso text-cream rounded-full shadow-md"
                                 >
                                    <Plus size={16} />
                                 </button>
                              </div>
                           </div>
                        )
                     })}
                  </div>
               </motion.div>
            </div>
        </AnimatePresence>
    );
}
