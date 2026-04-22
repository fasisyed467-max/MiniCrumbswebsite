import { ArrowRight, ShoppingBag } from 'lucide-react';
import { MenuSection } from '../components/menu/MenuSection';
import { Product, CartItem } from '../types';

interface FullMenuProps {
   cart: CartItem[];
   onOpenSizeSelector: (product: Product) => void;
   updateCartQuantity: (id: string, delta: number) => void;
   onBack: () => void;
   onCheckout?: () => void;
}

export function FullMenu({ cart, onOpenSizeSelector, updateCartQuantity, onBack, onCheckout }: FullMenuProps) {
   const totalItems = cart.reduce((a, b) => a + b.quantity, 0);

   return (
      <div className="min-h-screen bg-[#F9F8F6]">
         <div className="sticky top-0 w-full z-50 bg-[#F9F8F6] border-b border-espresso/10 py-5 px-6 lg:px-12 flex items-center justify-between shadow-sm">
            <button onClick={onBack} className="text-espresso flex items-center gap-2 font-medium bg-white px-4 py-2 rounded-full shadow-sm hover:bg-cream transition-colors">
               <ArrowRight size={18} className="rotate-180" /> Back
            </button>
            <span className="font-serif text-2xl font-semibold text-espresso absolute left-1/2 -translate-x-1/2">Menu</span>
            <div className="flex justify-end min-w-[80px]">
               <button onClick={onCheckout} className="relative p-2.5 bg-white rounded-full shadow-sm text-espresso hover:bg-cream transition-colors border border-cocoa/5">
                  <ShoppingBag size={20} />
                  {totalItems > 0 && (
                     <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-[#F2C3C9] to-[#E8D1B3] text-espresso text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-[#F9F8F6]">
                        {totalItems}
                     </span>
                  )}
               </button>
            </div>
         </div>
         
         <MenuSection 
            cart={cart}
            onOpenSizeSelector={onOpenSizeSelector}
            updateCartQuantity={updateCartQuantity}
            showTitle={false}
            showViewAllBtn={false}
         />
      </div>
   );
}
