import { useState, useEffect, lazy, Suspense } from 'react';
import posthog from 'posthog-js';
import { Size, CartItem, CheckoutFormData, Product } from './types';
import { SizeSelector } from './components/menu/SizeSelector';
import { StickyCartBanner } from './components/shared/StickyCartBanner';
import { CustomCakeModal } from './components/shared/CustomCakeModal';
import { createWaLink } from './utils/whatsapp';
import { api } from './utils/api';
import { PRODUCTS as FALLBACK_PRODUCTS } from './data/constants';
import { Loader2 } from 'lucide-react';
import { supabase } from './utils/supabase';
import { Session } from '@supabase/supabase-js';

// Lazy load components
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const FullMenu = lazy(() => import('./pages/FullMenu').then(m => ({ default: m.FullMenu })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));

const LoadingSpinner = () => (
   <div className="fixed inset-0 z-[200] bg-cream flex flex-col items-center justify-center gap-4">
      <div className="relative">
         <div className="w-16 h-16 border-4 border-cocoa/10 border-t-cocoa rounded-full animate-spin"></div>
         <Loader2 className="absolute inset-0 m-auto text-cocoa animate-pulse" size={24} />
      </div>
      <p className="font-serif text-xl text-espresso animate-pulse">Loading Mini Crumbs...</p>
   </div>
);

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

      // Only load products if we haven't already or if we're coming back from admin
      if (products === FALLBACK_PRODUCTS) {
         loadProducts();
      }

      return () => subscription.unsubscribe();
   }, []);

   useEffect(() => {
      // Refresh products when returning from admin to ensure we have latest stock/prices
      if (!viewAdmin && products !== FALLBACK_PRODUCTS) {
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
      posthog.capture('checkout_started');
      setViewCheckout(true);
   };

   const handleWhatsAppCheckout = async (): Promise<string | undefined> => {
      setIsSubmitting(true);
      
      try {
         let screenshotUrl = "";
         if (checkoutForm.paymentScreenshot) {
            try {
               screenshotUrl = await api.uploadImage(checkoutForm.paymentScreenshot, 'orders');
               posthog.capture('screenshot_upload_success', { url: screenshotUrl });
            } catch (err) {
               posthog.capture('screenshot_upload_failed', { error: (err as any).message });
               console.error("Failed to upload payment screenshot:", err);
            }
         }

         const finalForm = { ...checkoutForm, paymentScreenshotUrl: screenshotUrl };

         // Submit to Backend
         try {
            await api.submitOrder(cart, finalForm);
            posthog.capture('order_db_submit_success');
         } catch (dbErr) {
            posthog.capture('order_db_submit_failed', { error: (dbErr as any).message });
            throw dbErr;
         }
         
         const link = createWaLink(cart, finalForm);
         posthog.capture('order_completed', { hasScreenshot: !!screenshotUrl });
         
         setCart([]);
         // Keep viewCheckout true so the user sees the success screen
         setCheckoutForm({
            name: "",
            phone: "",
            address: "",
            notes: "",
            paymentScreenshot: null,
            paymentScreenshotUrl: ""
         });
         
         return link;
      } catch (error) {
         posthog.capture('order_submit_failed', { error: (error as any).message });
         console.error("Checkout failed:", error);
         alert("Something went wrong while placing your order. Please try again.");
         throw error;
      } finally {
         setIsSubmitting(false);
      }
   };

   const addItemToCart = (product: Product, size: Size) => {
      const id = `${product.id}-${size}`;
      const variantStock = product.stock?.[size] || 0;

      setCart(prev => {
         const existing = prev.find(item => item.id === id);
         if (existing) {
            if (existing.quantity >= variantStock) {
               alert(`Only ${variantStock} units of ${product.name} (${size}) available.`);
               return prev;
            }
            return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
         }
         if (variantStock <= 0) {
            alert(`Sorry, ${product.name} (${size}) is out of stock.`);
            return prev;
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
            const product = products.find(p => p.id === item.productId);
            const variantStock = product?.stock?.[item.size] || 0;
            
            if (delta > 0 && item.quantity >= variantStock) {
               alert(`Only ${variantStock} units available.`);
               return item;
            }
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

         <Suspense fallback={<LoadingSpinner />}>
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
         </Suspense>

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
