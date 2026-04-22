import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { PHONE_NUMBER } from '../../data/constants';

export function CustomCakeModal() {
   const [showCustomModal, setShowCustomModal] = useState(false);
   const [customForm, setCustomForm] = useState({
      name: "",
      phone: "",
      time: "",
      weight: "1kg",
      location: "",
      cakeMessage: "",
      imageName: ""
   });

   useEffect(() => {
      const handleOpen = () => setShowCustomModal(true);
      document.addEventListener('openCustomModal', handleOpen);
      return () => document.removeEventListener('openCustomModal', handleOpen);
   }, []);

   const handleCustomSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      let text = `Hi Mini Crumbs, I'd like a quote for a Custom Cake:%0A%0A`;
      text += `*Details:*%0A`;
      text += `*Size:* ${customForm.weight}%0A`;
      text += `*Message on Cake:* ${customForm.cakeMessage}%0A`;
      if (customForm.imageName) {
         text += `*Reference Image:* (I will send it in chat)%0A`;
      }
      text += `%0A*Delivery Date & Time:* ${customForm.time}%0A`;
      text += `*Delivery Location:* ${customForm.location}%0A`;
      text += `%0A*Name:* ${customForm.name}%0A`;
      text += `*Phone Number:* ${customForm.phone}%0A%0A`;
      text += `Please let me know the estimated price.`;

      window.open(`https://wa.me/${PHONE_NUMBER}?text=${text}`, '_blank');
      setShowCustomModal(false);
   };

   return (
      <AnimatePresence>
         {showCustomModal && (
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm sm:p-6"
            >
               <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-cream rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
               >
                  <div className="px-6 py-5 border-b border-cocoa/10 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                     <h3 className="font-serif text-2xl text-espresso text-center">Custom Cake Order</h3>
                     <button onClick={() => setShowCustomModal(false)} className="text-cocoa/50 hover:text-cocoa transition-colors p-2 -mr-2 bg-cream-dark rounded-full">
                        <X size={18} />
                     </button>
                  </div>

                  <div className="p-6 overflow-y-auto shrink-1">
                     <p className="text-sm text-cocoa/80 mb-6 font-light">Fill out the details below and we'll get back to you with a quote via WhatsApp. You can send us your reference image once the chat opens!</p>

                     <form id="customCakeForm" onSubmit={handleCustomSubmit} className="space-y-4 text-left">
                        <div>
                           <label className="block text-sm font-medium text-cocoa mb-1.5">Your Name</label>
                           <input required type="text" value={customForm.name} onChange={e => setCustomForm({ ...customForm, name: e.target.value })} className="w-full bg-white border border-cocoa/20 rounded-xl px-4 py-2.5 outline-none focus:border-cocoa/50 focus:ring-2 focus:ring-cocoa/10 text-espresso text-sm" placeholder="Jane Doe" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-cocoa mb-1.5">Phone Number</label>
                              <input required type="tel" value={customForm.phone} onChange={e => setCustomForm({ ...customForm, phone: e.target.value })} className="w-full bg-white border border-cocoa/20 rounded-xl px-4 py-2.5 outline-none focus:border-cocoa/50 focus:ring-2 focus:ring-cocoa/10 text-espresso text-sm" placeholder="+1..." />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-cocoa mb-1.5">Delivery Time</label>
                              <input required type="datetime-local" value={customForm.time} onChange={e => setCustomForm({ ...customForm, time: e.target.value })} className="w-full bg-white border border-cocoa/20 rounded-xl px-4 py-2.5 outline-none focus:border-cocoa/50 focus:ring-2 focus:ring-cocoa/10 text-espresso text-sm tracking-tight" />
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-cocoa mb-1.5">Quantity / Size</label>
                              <select value={customForm.weight} onChange={e => setCustomForm({ ...customForm, weight: e.target.value })} className="w-full bg-white border border-cocoa/20 rounded-xl px-4 py-2.5 outline-none focus:border-cocoa/50 focus:ring-2 focus:ring-cocoa/10 text-espresso text-sm">
                                 <option value="1/2kg">1/2 kg</option>
                                 <option value="1kg">1 kg</option>
                                 <option value="1.5kg">1.5 kg</option>
                                 <option value="2kg">2 kg</option>
                                 <option value="Larger">Larger (Custom)</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-cocoa mb-1.5">Delivery Location</label>
                              <input required type="text" value={customForm.location} onChange={e => setCustomForm({ ...customForm, location: e.target.value })} className="w-full bg-white border border-cocoa/20 rounded-xl px-4 py-2.5 outline-none focus:border-cocoa/50 focus:ring-2 focus:ring-cocoa/10 text-espresso text-sm" placeholder="Full Address" />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-cocoa mb-1.5">What to write on the cake?</label>
                           <input type="text" value={customForm.cakeMessage} onChange={e => setCustomForm({ ...customForm, cakeMessage: e.target.value })} className="w-full bg-white border border-cocoa/20 rounded-xl px-4 py-2.5 outline-none focus:border-cocoa/50 focus:ring-2 focus:ring-cocoa/10 text-espresso text-sm" placeholder="Happy Birthday..." />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-cocoa mb-1.5">Reference Image (Optional)</label>
                           <div className="w-full bg-cream-dark border-2 border-dashed border-cocoa/20 rounded-xl px-4 py-6 text-center hover:bg-blush/20 transition-colors relative">
                              <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setCustomForm({ ...customForm, imageName: e.target.files?.[0]?.name || "" })} />
                              <div className="flex flex-col items-center gap-2 pointer-events-none">
                                 {customForm.imageName ? (
                                    <>
                                       <ImageIcon size={24} className="text-cocoa" />
                                       <span className="text-sm font-medium text-espresso">{customForm.imageName}</span>
                                       <span className="text-xs text-cocoa/70">We'll ask you to send this file on WhatsApp!</span>
                                    </>
                                 ) : (
                                    <>
                                       <Upload size={24} className="text-cocoa/50" />
                                       <span className="text-sm font-medium text-espresso">Tap to select an image</span>
                                       <span className="text-xs text-cocoa/60">Upload photo (JPG, PNG)</span>
                                    </>
                                 )}
                              </div>
                           </div>
                        </div>
                     </form>
                  </div>

                  <div className="p-6 bg-white border-t border-cocoa/10 shrink-0">
                     <button type="submit" form="customCakeForm" className="w-full bg-cocoa text-cream py-4 rounded-xl font-medium text-base flex justify-center items-center gap-2 hover:bg-espresso transition-colors">
                        Get Quote on WhatsApp <MessageCircle size={18} />
                     </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
   );
}
