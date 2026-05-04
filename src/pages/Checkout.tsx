import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Minus, Plus, MapPin, MessageCircle, CreditCard, CheckCircle2, Download, Upload, Image as ImageIcon } from 'lucide-react';
import { CartItem, CheckoutFormData, Product } from '../types';
import { Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface CheckoutProps {
   products: Product[];
   cart: CartItem[];
   checkoutForm: CheckoutFormData;
   setCheckoutForm: (form: CheckoutFormData) => void;
   updateCartQuantity: (id: string, delta: number) => void;
   onBack: () => void;
   onSubmit: () => Promise<string | undefined>;
   isSubmitting: boolean;
}

type CheckoutStep = 'summary' | 'payment' | 'details' | 'success';

export function Checkout({
   products,
   cart,
   checkoutForm,
   setCheckoutForm,
   updateCartQuantity,
   onBack,
   onSubmit,
   isSubmitting
}: CheckoutProps) {
    const [step, setStep] = useState<CheckoutStep>('summary');
    const [waLink, setWaLink] = useState('');
    const qrRef = useRef<HTMLDivElement>(null);

    const total = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
    const orderId = `MC-${Date.now()}`;
    const upiLink = `upi://pay?pa=6304407083@axl&pn=Qudsiya%20khan&tn=PaymentForMiniCrumbs&am=${total.toFixed(2)}&cu=INR&tr=${orderId}`;

    const downloadQR = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.download = `MiniCrumbs-QR-${orderId}.png`;
            link.href = url;
            link.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCheckoutForm({ ...checkoutForm, paymentScreenshot: file });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const link = await onSubmit();
            if (link) {
                setWaLink(link);
                setStep('success');
            }
        } catch (error) {
            console.error("Failed to process order", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F8F6]">
            {/* Header */}
            <div className="sticky top-0 w-full z-50 bg-[#F9F8F6] border-b border-espresso/10 py-5 px-6 lg:px-12 flex items-center justify-between shadow-sm">
               <button 
                  onClick={step === 'summary' ? onBack : () => setStep(prev => prev === 'details' ? 'payment' : 'summary')} 
                  className="text-espresso flex items-center gap-2 font-medium bg-white px-4 py-2 rounded-full shadow-sm hover:bg-cream transition-colors"
               >
                  <ArrowRight size={18} className="rotate-180" /> Back
               </button>
               <span className="font-serif text-2xl font-semibold text-espresso absolute left-1/2 -translate-x-1/2">
                  {step === 'summary' ? 'Checkout' : step === 'payment' ? 'Payment' : 'Details'}
               </span>
               <div className="w-16"></div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 pb-32">
                {/* Progress Bar */}
                <div className="flex justify-between mb-10 px-4">
                    {[
                        { id: 'summary', label: 'Summary', icon: ArrowRight },
                        { id: 'payment', label: 'Payment', icon: CreditCard },
                        { id: 'details', label: 'Details', icon: CheckCircle2 }
                    ].map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center gap-2 relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                step === s.id ? 'bg-espresso text-cream border-espresso shadow-lg scale-110' : 
                                (i < ['summary', 'payment', 'details', 'success'].indexOf(step) ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-espresso/10 text-espresso/30')
                            }`}>
                                {i < ['summary', 'payment', 'details', 'success'].indexOf(step) ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${step === s.id ? 'text-espresso' : 'text-espresso/30'}`}>{s.label}</span>
                            {i < 2 && <div className={`absolute left-12 top-5 w-20 md:w-40 h-[2px] bg-espresso/5 -z-10`}>
                                <div className={`h-full bg-green-500 transition-all duration-500 ${i < ['summary', 'payment', 'details', 'success'].indexOf(step) ? 'w-full' : 'w-0'}`}></div>
                            </div>}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 'summary' && (
                        <motion.div 
                            key="summary"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-serif text-espresso mb-6">Order Summary</h2>
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-cocoa/5">
                                {cart.length === 0 ? (
                                    <p className="text-cocoa/60 text-center py-8">Your cart is empty.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {cart.map(item => {
                                            const product = products.find(p => p.id === item.productId);
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
                                            <span className="text-xl font-bold text-espresso">₹{total}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => setStep('payment')}
                                className="w-full bg-espresso text-cream font-bold py-5 rounded-3xl shadow-xl flex justify-center gap-3 items-center active:scale-95 transition-transform"
                            >
                                Proceed to Payment <ArrowRight size={20} />
                            </button>
                        </motion.div>
                    )}

                    {step === 'payment' && (
                        <motion.div 
                            key="payment"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-cocoa/5 text-center">
                                <h2 className="text-2xl font-serif text-espresso mb-2">Scan & Pay</h2>
                                <p className="text-cocoa/60 text-sm mb-8">Scan the QR code below to complete your payment of ₹{total}</p>
                                
                                <div className="flex flex-col items-center gap-6">
                                    <div ref={qrRef} className="p-6 bg-white rounded-3xl border-4 border-cream shadow-inner inline-block">
                                        <QRCodeCanvas 
                                            value={upiLink} 
                                            size={200}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                    
                                    <div className="flex flex-col gap-3 w-full max-w-xs">
                                        <button 
                                            onClick={downloadQR}
                                            className="flex items-center justify-center gap-2 py-3 px-6 bg-cream text-espresso rounded-2xl font-bold text-sm hover:bg-cream-dark transition-colors border border-espresso/5"
                                        >
                                            <Download size={18} /> Download QR Code
                                        </button>
                                        <p className="text-[10px] text-cocoa/40 uppercase tracking-widest font-bold">Ref: {orderId}</p>
                                    </div>
                                </div>
                                
                                <div className="mt-10 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-left">
                                    <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-sm font-bold text-green-800">Payment Instructions</p>
                                        <p className="text-xs text-green-700/70 leading-relaxed mt-1">1. Scan or download the QR code.<br/>2. Pay ₹{total} via any UPI app (GPay, PhonePe, etc).<br/>3. **Take a screenshot** of the successful payment.<br/>4. Click the button below to add your details.</p>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setStep('details')}
                                className="w-full bg-espresso text-cream font-bold py-5 rounded-3xl shadow-xl flex justify-center gap-3 items-center active:scale-95 transition-transform"
                            >
                                I've Paid, Add Details <ArrowRight size={20} />
                            </button>
                        </motion.div>
                    )}

                    {step === 'details' && (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <h2 className="text-2xl font-serif text-espresso mb-6">Delivery Details</h2>
                            <form id="checkoutDeliveryForm" onSubmit={handleSubmit} className="space-y-6">
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-cocoa/5 space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Full Name</label>
                                        <input required type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} className="w-full bg-cream-dark border-transparent rounded-2xl px-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all" placeholder="Jane Doe" />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Phone Number</label>
                                        <input 
                                            required 
                                            type="tel" 
                                            pattern="[0-9]{10}"
                                            minLength={10}
                                            maxLength={10}
                                            title="Please enter a valid 10-digit phone number"
                                            value={checkoutForm.phone} 
                                            onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} 
                                            className="w-full bg-cream-dark border-transparent rounded-2xl px-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all" 
                                            placeholder="10-digit mobile number" 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Complete Delivery Address</label>
                                        <p className="text-[11px] font-bold text-espresso mb-2.5 pl-1 leading-relaxed">
                                            Note: Orders shipped via Rapido Parcel — charges vary based on distance from our landmark: Inspire School, Chandrayangutta.
                                        </p>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-4 top-3.5 text-cocoa/50" />
                                            <textarea required rows={3} value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})} className="w-full bg-cream-dark border-transparent rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all resize-none" placeholder="Flat, House no., Area, Landmark..."></textarea>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Any Special Notes?</label>
                                        <input type="text" value={checkoutForm.notes} onChange={e => setCheckoutForm({...checkoutForm, notes: e.target.value})} className="w-full bg-cream-dark border-transparent rounded-2xl px-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all" placeholder="Message on cake, contactless delivery, etc." />
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-cocoa/5">
                                    <label className="block text-sm font-medium text-cocoa mb-3 pl-1">Payment Screenshot (Required)</label>
                                    <div className="w-full bg-cream-dark border-2 border-dashed border-cocoa/10 rounded-2xl px-4 py-6 text-center hover:bg-cream transition-colors relative group">
                                        <input 
                                            required
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            {checkoutForm.paymentScreenshot ? (
                                                <>
                                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                                        <CheckCircle2 size={24} />
                                                    </div>
                                                    <span className="text-sm font-bold text-espresso">{checkoutForm.paymentScreenshot.name}</span>
                                                    <span className="text-xs text-cocoa/50">Tap to change file</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-cocoa/30 group-hover:scale-110 transition-transform">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <span className="text-sm font-bold text-espresso">Upload Payment Screenshot</span>
                                                    <span className="text-xs text-cocoa/50">JPG, PNG or PDF accepted</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    disabled={isSubmitting || !checkoutForm.paymentScreenshot}
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold py-5 rounded-3xl shadow-2xl flex justify-center gap-2 items-center border border-white/20 shadow-green-500/20 active:scale-95 transition-transform disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <>Processing Order... <Loader2 className="animate-spin" size={20} /></>
                                    ) : (
                                        <>
                                            <MessageCircle size={20} />
                                            <span className="text-[16px] tracking-wide">Confirm & Send via WhatsApp</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8 flex flex-col items-center justify-center py-10"
                        >
                            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-xl shadow-green-500/20">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="text-center space-y-3">
                                <h2 className="text-3xl font-serif text-espresso">Order Saved!</h2>
                                <p className="text-cocoa/70 max-w-sm mx-auto">Your order has been saved in our system. Just one final step to complete it.</p>
                            </div>
                            
                            <a 
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full max-w-sm bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold py-5 rounded-3xl shadow-2xl flex justify-center gap-2 items-center border border-white/20 shadow-green-500/20 active:scale-95 transition-transform"
                                onClick={onBack}
                            >
                                <MessageCircle size={20} />
                                <span className="text-[16px] tracking-wide">Send details to WhatsApp</span>
                            </a>
                            
                            <p className="text-xs text-cocoa/50 mt-4 text-center">Clicking the button will open WhatsApp.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
