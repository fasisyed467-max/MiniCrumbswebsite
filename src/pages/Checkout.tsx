import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Minus, Plus, Clock, MapPin, MessageCircle } from 'lucide-react';
import { CartItem, CheckoutFormData } from '../types';
import { PRODUCTS } from '../data/constants';

interface CheckoutProps {
   cart: CartItem[];
   checkoutForm: CheckoutFormData;
   setCheckoutForm: (form: CheckoutFormData) => void;
   updateCartQuantity: (id: string, delta: number) => void;
   onBack: () => void;
   onSubmit: (e: React.FormEvent) => void;
}

export function Checkout({
   cart,
   checkoutForm,
   setCheckoutForm,
   updateCartQuantity,
   onBack,
   onSubmit
}: CheckoutProps) {
    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            <div className="sticky top-0 w-full z-50 bg-[#F9F8F6] border-b border-espresso/10 py-5 px-6 lg:px-12 flex items-center justify-between shadow-sm">
               <button onClick={onBack} className="text-espresso flex items-center gap-2 font-medium bg-white px-4 py-2 rounded-full shadow-sm hover:bg-cream transition-colors">
                  <ArrowRight size={18} className="rotate-180" /> Back
               </button>
               <span className="font-serif text-2xl font-semibold text-espresso absolute left-1/2 -translate-x-1/2">Checkout</span>
               <div className="w-16"></div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 pb-32">
               <h2 className="text-2xl font-serif text-espresso mb-6">Order Summary</h2>
               
               {/* Cart Items List */}
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-cocoa/5 mb-8">
                  {cart.length === 0 ? (
                     <p className="text-cocoa/60 text-center py-8">Your cart is empty.</p>
                  ) : (
                     <div className="space-y-6">
                        {cart.map(item => {
                           const product = PRODUCTS.find(p => p.id === item.productId);
                           return (
                              <div key={item.id} className="flex gap-4 items-center">
                                 <img src={product?.image} className="w-16 h-16 rounded-2xl object-cover bg-cream border-2 border-white shadow-sm" alt={item.name} />
                                 <div className="flex-grow">
                                    <h4 className="font-semibold text-espresso">{item.name}</h4>
                                    <div className="flex justify-between items-center mt-1">
                                       <p className="text-sm text-cocoa">{item.size} • ₹{item.price}</p>
                                       <div className="flex items-center gap-3 bg-cream-dark rounded-full p-1 border border-cocoa/5">
                                          <button onClick={() => updateCartQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-full text-cocoa hover:text-espresso transition-colors">
                                             <Minus size={14} />
                                          </button>
                                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                          <button onClick={() => updateCartQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-espresso text-cream shadow-sm">
                                             <Plus size={14} />
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           )
                        })}
                        <div className="border-t border-cocoa/10 pt-4 flex justify-between items-center">
                           <span className="font-semibold text-espresso">Total</span>
                           <span className="text-xl font-bold text-espresso">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 0)}</span>
                        </div>
                     </div>
                  )}
               </div>

               <h2 className="text-2xl font-serif text-espresso mb-6">Delivery Details</h2>
               <form id="checkoutDeliveryForm" onSubmit={onSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-cocoa/5 space-y-5">
                  <div>
                     <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Full Name</label>
                     <input required type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} className="w-full bg-cream-dark border-transparent rounded-2xl px-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all" placeholder="Jane Doe" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Phone Number</label>
                        <input required type="tel" value={checkoutForm.phone} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} className="w-full bg-cream-dark border-transparent rounded-2xl px-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all" placeholder="+91..." />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Delivery Time (Expected)</label>
                        <div className="relative">
                           <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/50" />
                           <input required type="datetime-local" value={checkoutForm.time} onChange={e => setCheckoutForm({...checkoutForm, time: e.target.value})} className="w-full bg-cream-dark border-transparent rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all tracking-tight" />
                        </div>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Complete Delivery Address</label>
                     <div className="relative">
                        <MapPin size={18} className="absolute left-4 top-3.5 text-cocoa/50" />
                        <textarea required rows={3} value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className="w-full bg-cream-dark border-transparent rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all resize-none" placeholder="Flat, House no., Area, Landmark..."></textarea>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Any Special Notes?</label>
                     <input type="text" value={checkoutForm.notes} onChange={e => setCheckoutForm({...checkoutForm, notes: e.target.value})} className="w-full bg-cream-dark border-transparent rounded-2xl px-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all" placeholder="Message on cake, contactless delivery, etc." />
                  </div>
               </form>
            </div>

            {/* Sticky Checkout Form Submittor */}
            <AnimatePresence>
               {cart.length > 0 && (
                  <motion.div 
                     initial={{ y: 150 }} 
                     animate={{ y: 0 }} 
                     exit={{ y: 150 }}
                     transition={{ type: "spring", damping: 20 }}
                     className="fixed bottom-0 left-0 right-0 p-4 pb-6 sm:p-6 z-[90] pointer-events-none"
                  >
                     <div className="max-w-3xl mx-auto pointer-events-auto">
                        <button 
                           type="submit"
                           form="checkoutDeliveryForm"
                           className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold py-4 rounded-full shadow-2xl flex justify-center gap-2 items-center border border-white/20 shadow-green-500/20 active:scale-95 transition-transform"
                        >
                           <MessageCircle size={20} />
                           <span className="text-[16px] tracking-wide">Send Order via WhatsApp</span>
                        </button>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
        </div>
    );
}
