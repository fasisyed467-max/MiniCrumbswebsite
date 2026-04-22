import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { CartItem } from '../../types';

interface StickyCartBannerProps {
   cart: CartItem[];
   onCheckout: () => void;
}

export function StickyCartBanner({ cart, onCheckout }: StickyCartBannerProps) {
    return (
        <AnimatePresence>
            {cart.length > 0 && (
               <motion.div 
                  initial={{ y: 150 }} 
                  animate={{ y: 0 }} 
                  exit={{ y: 150 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="fixed bottom-0 left-0 right-0 p-4 pb-6 sm:p-6 z-[90] pointer-events-none"
               >
                  <div className="max-w-md mx-auto pointer-events-auto">
                     <button 
                        onClick={onCheckout} 
                        className="w-full bg-gradient-to-r from-[#F2C3C9] to-[#E8D1B3] text-espresso font-semibold py-4 rounded-full shadow-2xl flex justify-between px-8 items-center border border-white/40 shadow-blush/30"
                     >
                        <div className="flex flex-col items-start gap-0.5">
                           <span className="text-[15px]">Selected {cart.reduce((a, b) => a + b.quantity, 0)} items</span>
                           <span className="text-xs opacity-70">Total: ₹{cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-bold tracking-wide uppercase">Checkout</span>
                           <ArrowRight size={18} />
                        </div>
                     </button>
                  </div>
               </motion.div>
            )}
        </AnimatePresence>
    );
}
