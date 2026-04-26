import { useState, useEffect } from 'react';
import { Size, CartItem, CheckoutFormData, Product } from './types';
import { Landing } from './pages/Landing';
import { FullMenu } from './pages/FullMenu';
import { Checkout } from './pages/Checkout';
import { SizeSelector } from './components/menu/SizeSelector';
import { StickyCartBanner } from './components/shared/StickyCartBanner';
import { CustomCakeModal } from './components/shared/CustomCakeModal';
import { createWaLink } from './utils/whatsapp';
import { api } from './utils/api';
import { PRODUCTS as FALLBACK_PRODUCTS } from './data/constants';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { supabase } from './utils/supabase';
import { Session } from '@supabase/supabase-js';

export default function App() {
   const [scrolled, setScrolled] = useState(false);
   const [cart, setCart] = useState<CartItem[]>([]);
   const [sizeModal, setSizeModal] = useState<{isOpen: boolean, product: Product | null}>({isOpen: false, product: null});
   const [viewFullMenu, setViewFullMenu] = useState(false);
   const [viewCheckout, setViewCheckout] = useState(false);
   const [viewAdmin, setViewAdmin] = useState(false);
   const [session, setSession] = useState<Session | null>(null);
   const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
   const [isLoading, setIsLoading] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [checkoutForm, setCheckoutForm] = useState<CheckoutFormData>({
      name: "",
      phone: "",
      address: "",
      notes: "",
      paymentScreenshot: null,
      paymentScreenshotUrl: ""
   });

   const loadProducts = async () => {
      setIsLoading(true);
      const data = await api.fetchProducts();
      if (data && data.length > 0) {
         setProducts(data);
      }
      setIsLoading(false);
   };

   useEffect(() => {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
         setSession(session);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
         setSession(session);
      });

      loadProducts();

      return () => subscription.unsubscribe();
   }, []);

   useEffect(() => {
      if (!viewAdmin) {
         loadProducts();
      }
   }, [viewAdmin]);

   useEffect(() => {
      const handleScroll = () => {
         setScrolled(window.scrollY > 20);
      };
      
      // Handle URL path for dashboard
      if (window.location.pathname.startsWith('/dashboard')) {
         setViewAdmin(true);
      }

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

   const handleWhatsAppCheckout = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      
      try {
         let screenshotUrl = "";
         if (checkoutForm.paymentScreenshot) {
            try {
               // Use existing 'orders' bucket instead of non-existent 'payments'
               screenshotUrl = await api.uploadImage(checkoutForm.paymentScreenshot, 'orders');
            } catch (err) {
               console.error("Failed to upload payment screenshot:", err);
            }
         }

         const finalForm = { ...checkoutForm, paymentScreenshotUrl: screenshotUrl };

         // Submit to Backend
         await api.submitOrder(cart, finalForm);
         
         const link = createWaLink(cart, finalForm);
         window.open(link, '_blank');
         
         setCart([]);
         setViewCheckout(false);
         setCheckoutForm({
            name: "",
            phone: "",
            address: "",
            notes: "",
            paymentScreenshot: null,
            paymentScreenshotUrl: ""
         });
      } catch (error) {
         console.error("Checkout failed:", error);
         alert("Something went wrong while placing your order. Please try again.");
      } finally {
         setIsSubmitting(false);
      }
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
         {isLoading && (
            <div className="fixed inset-0 z-[200] bg-cream flex flex-col items-center justify-center gap-4">
               <div className="relative">
                  <div className="w-16 h-16 border-4 border-cocoa/10 border-t-cocoa rounded-full animate-spin"></div>
                  <Loader2 className="absolute inset-0 m-auto text-cocoa animate-pulse" size={24} />
               </div>
               <p className="font-serif text-xl text-espresso animate-pulse">Loading Mini Crumbs...</p>
            </div>
         )}

         {/* Main Routing Logic */}
         {!viewFullMenu && !viewCheckout && !viewAdmin && (
            <Landing 
               products={products}
               scrolled={scrolled}
               cart={cart}
               onOrder={handleOrder}
               onOpenSizeSelector={openSizeSelector}
               updateCartQuantity={updateCartQuantity}
               onViewFullMenu={handleOrder}
            />
         )}

         {viewFullMenu && !viewCheckout && !viewAdmin && (
            <FullMenu 
               products={products}
               cart={cart}
               onOpenSizeSelector={openSizeSelector}
               updateCartQuantity={updateCartQuantity}
               onBack={() => setViewFullMenu(false)}
               onCheckout={handleCheckout}
            />
         )}

         {viewCheckout && !viewAdmin && (
            <Checkout 
               products={products}
               cart={cart}
               checkoutForm={checkoutForm}
               setCheckoutForm={setCheckoutForm}
               updateCartQuantity={updateCartQuantity}
               onBack={() => setViewCheckout(false)}
               onSubmit={handleWhatsAppCheckout}
               isSubmitting={isSubmitting}
            />
         )}

         {viewAdmin && (
            !session ? (
               <Login 
                  onLogin={() => setViewAdmin(true)} 
                  onBack={() => {
                     setViewAdmin(false);
                     window.history.pushState({}, '', '/');
                  }} 
               />
            ) : (
               <AdminDashboard onBack={async () => {
                  await supabase.auth.signOut();
                  setViewAdmin(false);
                  window.history.pushState({}, '', '/');
               }} />
            )
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
