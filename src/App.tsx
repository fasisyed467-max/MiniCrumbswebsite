import { useState, useEffect } from 'react';
import { Size, CartItem, CheckoutFormData, Product } from './types';
import { Landing } from './pages/Landing';
import { FullMenu } from './pages/FullMenu';
import { Checkout } from './pages/Checkout';
import { SizeSelector } from './components/menu/SizeSelector';
import { StickyCartBanner } from './components/shared/StickyCartBanner';
import { CustomCakeModal } from './components/shared/CustomCakeModal';
import { createWaLink } from './utils/whatsapp';

export default function App() {
   const [scrolled, setScrolled] = useState(false);
   const [cart, setCart] = useState<CartItem[]>([]);
   const [sizeModal, setSizeModal] = useState<{isOpen: boolean, product: Product | null}>({isOpen: false, product: null});
   const [viewFullMenu, setViewFullMenu] = useState(false);
   const [viewCheckout, setViewCheckout] = useState(false);
   const [checkoutForm, setCheckoutForm] = useState<CheckoutFormData>({
      name: "",
      phone: "",
      address: "",
      time: "",
      notes: ""
   });

   useEffect(() => {
      const handleScroll = () => {
         setScrolled(window.scrollY > 20);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   const handleOrder = () => {
      window.scrollTo(0, 0);
      setViewFullMenu(true);
   };

   const handleCheckout = () => {
      window.scrollTo(0, 0);
      setViewCheckout(true);
   };

   const handleWhatsAppCheckout = (e: React.FormEvent) => {
      e.preventDefault();
      const link = createWaLink(cart, checkoutForm);
      window.open(link, '_blank');
      setCart([]);
      setViewCheckout(false);
      setCheckoutForm({
         name: "",
         phone: "",
         address: "",
         time: "",
         notes: ""
      });
   };

   const addItemToCart = (product: Product, size: Size) => {
      const id = `${product.id}-${size}`;
      setCart(prev => {
         const existing = prev.find(item => item.id === id);
         if (existing) {
            return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
         }
         return [...prev, {
            id,
            productId: product.id,
            name: product.name,
            size,
            price: product.prices[size],
            quantity: 1
         }];
      });
      setSizeModal({ isOpen: false, product: null });
   };

   const updateCartQuantity = (id: string, delta: number) => {
      setCart(prev => prev.map(item => {
         if (item.id === id) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
         }
         return item;
      }).filter(item => item.quantity > 0));
   };

   const openSizeSelector = (product: Product) => {
      setSizeModal({ isOpen: true, product });
   };

   return (
      <div className="font-sans">
         {/* Main Routing Logic */}
         {!viewFullMenu && !viewCheckout && (
            <Landing 
               scrolled={scrolled}
               cart={cart}
               onOrder={handleOrder}
               onOpenSizeSelector={openSizeSelector}
               updateCartQuantity={updateCartQuantity}
               onViewFullMenu={handleOrder}
            />
         )}

         {viewFullMenu && !viewCheckout && (
            <FullMenu 
               cart={cart}
               onOpenSizeSelector={openSizeSelector}
               updateCartQuantity={updateCartQuantity}
               onBack={() => setViewFullMenu(false)}
               onCheckout={handleCheckout}
            />
         )}

         {viewCheckout && (
            <Checkout 
               cart={cart}
               checkoutForm={checkoutForm}
               setCheckoutForm={setCheckoutForm}
               updateCartQuantity={updateCartQuantity}
               onBack={() => setViewCheckout(false)}
               onSubmit={handleWhatsAppCheckout}
            />
         )}

         {/* Shared Modals & Overlays */}
         <SizeSelector 
            isOpen={sizeModal.isOpen}
            product={sizeModal.product}
            onClose={() => setSizeModal({isOpen: false, product: null})}
            cart={cart}
            updateQuantity={updateCartQuantity}
            onAdd={addItemToCart}
         />

         {/* Do not show cart banner if Checkout is already open */}
         {!viewCheckout && (
            <StickyCartBanner 
               cart={cart}
               onCheckout={handleCheckout}
            />
         )}

         <CustomCakeModal />
      </div>
   );
}
