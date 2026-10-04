import React, { useState, useRef, useMemo } from 'react';
import posthog from 'posthog-js';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Minus, Plus, MapPin, MessageCircle, CreditCard, CheckCircle2, Download, Upload, Image as ImageIcon, Candy, ChevronDown } from 'lucide-react';
import { CartItem, CheckoutFormData, Product, Topping, SelectedTopping } from '../types';
import { Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { getCartTotal, getCartItemTotal, getToppingsTotal } from '../utils/cart';

interface CheckoutProps {
    products: Product[];
    toppings: Topping[];
    cart: CartItem[];
    checkoutForm: CheckoutFormData;
    setCheckoutForm: (form: CheckoutFormData) => void;
    updateCartQuantity: (id: string, delta: number) => void;
    setCartItemToppings: (itemId: string, selected: SelectedTopping[]) => void;
    onBack: () => void;
    onSubmit: () => Promise<string | undefined>;
    isSubmitting: boolean;
    checkCartStock: () => Promise<{ isValid: boolean; errors?: string[] }>;
}

type CheckoutStep = 'toppings' | 'summary' | 'shipping' | 'payment' | 'details' | 'success';

export function Checkout({
    products,
    toppings,
    cart,
    checkoutForm,
    setCheckoutForm,
    updateCartQuantity,
    setCartItemToppings,
    onBack,
    onSubmit,
    isSubmitting,
    checkCartStock
}: CheckoutProps) {
    const cartHasToppings = useMemo(
        () => cart.some(item => products.find(p => p.id === item.productId)?.toppings_enabled),
        [cart, products]
    );

    const stepOrder = useMemo<CheckoutStep[]>(
        () => [
            ...(cartHasToppings ? ['toppings' as const] : []),
            'summary', 'shipping', 'payment', 'details', 'success'
        ],
        [cartHasToppings]
    );

    const [step, setStep] = useState<CheckoutStep>(cartHasToppings ? 'toppings' : 'summary');
    const [isCheckingStock, setIsCheckingStock] = useState(false);
    const [rapidoAgreed, setRapidoAgreed] = useState(false);
    const [deliveryTimeAgreed, setDeliveryTimeAgreed] = useState(false);
    const [riskAgreed, setRiskAgreed] = useState(false);
    const [waLink, setWaLink] = useState('');
    const [expandedToppingItem, setExpandedToppingItem] = useState<string | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    const total = getCartTotal(cart);

    // Remaining stock for a topping, accounting for what is already chosen on OTHER cart lines.
    const remainingToppingStock = (toppingId: string, exceptItemId: string) => {
        const topping = toppings.find(t => t.id === toppingId);
        if (!topping) return 0;
        const chosenElsewhere = cart.reduce((sum, item) => {
            if (item.id === exceptItemId) return sum;
            const sel = item.toppings?.find(s => s.id === toppingId);
            return sum + (sel?.quantity || 0);
        }, 0);
        return Math.max(0, topping.stock - chosenElsewhere);
    };

    const changeItemTopping = (item: CartItem, topping: Topping, delta: number) => {
        const current = item.toppings ?? [];
        const existing = current.find(s => s.id === topping.id);
        const currentQty = existing?.quantity || 0;
        const max = remainingToppingStock(topping.id, item.id);
        const nextQty = Math.max(0, Math.min(max, currentQty + delta));
        if (nextQty === currentQty) return;

        let next: SelectedTopping[];
        if (nextQty === 0) {
            next = current.filter(s => s.id !== topping.id);
        } else if (existing) {
            next = current.map(s => s.id === topping.id ? { ...s, quantity: nextQty } : s);
        } else {
            next = [...current, { id: topping.id, name: topping.name, price: topping.price, quantity: nextQty }];
        }
        setCartItemToppings(item.id, next);
    };
    const orderId = useMemo(() => `MC-${Date.now()}`, []);
    const upiLink = `upi://pay?pa=6304407083@axl&pn=${encodeURIComponent('Qudsiya Khan')}&tn=${encodeURIComponent('Order ' + orderId)}&am=${total.toFixed(2)}&cu=INR`;

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            posthog.capture('screenshot_uploaded', { fileSize: file.size, fileType: file.type });
            if (file.size > 10 * 1024 * 1024) {
                alert("File is too large. Please select an image smaller than 10MB.");
                return;
            }
            try {
                // IMMEDIATELY read the file into memory to avoid Android permission revocation later
                const arrayBuffer = await file.arrayBuffer();
                const inMemoryFile = new File([arrayBuffer], file.name, { type: file.type });
                setCheckoutForm(prev => ({ ...prev, paymentScreenshot: inMemoryFile }));
            } catch (err) {
                console.error("Failed to read file:", err);
                alert("Failed to access the image. Please try selecting it again.");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!checkoutForm.paymentScreenshot) {
            alert("Please upload your payment screenshot before confirming your order.");
            return;
        }

        posthog.capture('order_confirm_clicked');
        try {
            const link = await onSubmit();
            if (link) {
                setWaLink(link);
                setStep('success');
                posthog.capture('order_confirmed', { orderId, amount: total });
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
                    onClick={() => {
                        if (step === stepOrder[0]) {
                            posthog.capture('returned_to_home');
                            onBack();
                        } else {
                            setStep(prev => {
                                const currentIndex = stepOrder.indexOf(prev);
                                return currentIndex > 0 ? stepOrder[currentIndex - 1] : stepOrder[0];
                            });
                        }
                    }}
                    className="text-espresso flex items-center gap-2 font-medium bg-white px-4 py-2 rounded-full shadow-sm hover:bg-cream transition-colors"
                >
                    <ArrowRight size={18} className="rotate-180" /> Back
                </button>
                <span className="font-serif text-lg sm:text-2xl font-semibold text-espresso absolute left-1/2 -translate-x-1/2 whitespace-nowrap hidden xs:block">
                    {step === 'toppings' ? 'Toppings' : step === 'summary' ? 'Checkout' : step === 'shipping' ? 'Shipping Info' : step === 'payment' ? 'Payment' : 'Details'}
                </span>
                <div className="w-16"></div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 pb-32">
                {/* Progress Bar */}
                <div className="flex justify-between mb-10 px-4">
                    {(() => {
                        const baseSteps = [
                            { id: 'summary', label: 'Summary', icon: ArrowRight },
                            { id: 'shipping', label: 'Shipping', icon: MapPin },
                            { id: 'payment', label: 'Payment', icon: CreditCard },
                            { id: 'details', label: 'Details', icon: CheckCircle2 }
                        ];
                        const progressSteps = cartHasToppings
                            ? [{ id: 'toppings', label: 'Toppings', icon: Candy }, ...baseSteps]
                            : baseSteps;
                        const currentPos = stepOrder.indexOf(step);
                        return progressSteps.map((s, i) => {
                            const stepPos = stepOrder.indexOf(s.id as CheckoutStep);
                            const done = stepPos < currentPos;
                            return (
                                <div key={s.id} className="flex flex-col items-center gap-2 relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${step === s.id ? 'bg-espresso text-cream border-espresso shadow-lg scale-110' :
                                            (done ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-espresso/10 text-espresso/30')
                                        }`}>
                                        {done ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${step === s.id ? 'text-espresso' : 'text-espresso/30'}`}>{s.label}</span>
                                    {i < progressSteps.length - 1 && <div className={`absolute left-10 md:left-12 top-5 w-14 sm:w-20 md:w-32 lg:w-40 h-[2px] bg-espresso/5 -z-10`}>
                                        <div className={`h-full bg-green-500 transition-all duration-500 ${done ? 'w-full' : 'w-0'}`}></div>
                                    </div>}
                                </div>
                            );
                        });
                    })()}
                </div>

                <AnimatePresence mode="wait">
                    {step === 'toppings' && (
                        <motion.div
                            key="toppings"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div>
                                <h2 className="text-2xl font-serif text-espresso mb-1">Add Toppings</h2>
                                <p className="text-sm text-cocoa/60">Optional extras for the items below. Tap an item to expand.</p>
                            </div>

                            <div className="space-y-4">
                                {cart.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    if (!product?.toppings_enabled) return null;
                                    const isOpen = expandedToppingItem === item.id;
                                    const selectedCount = (item.toppings ?? []).reduce((a, t) => a + t.quantity, 0);
                                    return (
                                        <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-cocoa/5 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedToppingItem(isOpen ? null : item.id)}
                                                className="w-full flex items-center justify-between gap-3 p-5 text-left"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Candy size={18} className="text-blush shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-espresso truncate">Add toppings — {item.name}</p>
                                                        <p className="text-xs text-cocoa/50">{item.size}{selectedCount > 0 ? ` • ${selectedCount} added (₹${getToppingsTotal(item)})` : ''}</p>
                                                    </div>
                                                </div>
                                                <ChevronDown size={20} className={`text-cocoa/40 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {isOpen && (
                                                <div className="px-5 pb-5 space-y-3 border-t border-cocoa/5 pt-4">
                                                    {toppings.length === 0 && (
                                                        <p className="text-sm text-cocoa/50 text-center py-2">No toppings available right now.</p>
                                                    )}
                                                    {toppings.map(topping => {
                                                        const sel = item.toppings?.find(s => s.id === topping.id);
                                                        const qty = sel?.quantity || 0;
                                                        const remaining = remainingToppingStock(topping.id, item.id);
                                                        const soldOut = !topping.is_available || (remaining <= 0 && qty === 0);
                                                        return (
                                                            <div key={topping.id} className={`flex items-center justify-between gap-3 ${soldOut ? 'opacity-40' : ''}`}>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-espresso truncate">{topping.name}</p>
                                                                    <p className="text-xs text-cocoa/50">₹{topping.price}{soldOut ? ' • Out of stock' : ''}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3 bg-cream-dark rounded-full p-1 border border-cocoa/5 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        disabled={soldOut || qty === 0}
                                                                        onClick={() => changeItemTopping(item, topping, -1)}
                                                                        className="w-6 h-6 flex items-center justify-center rounded-full text-cocoa hover:text-espresso transition-colors disabled:opacity-30"
                                                                    >
                                                                        <Minus size={14} />
                                                                    </button>
                                                                    <span className="text-sm font-medium w-4 text-center">{qty}</span>
                                                                    <button
                                                                        type="button"
                                                                        disabled={soldOut || qty >= remaining}
                                                                        onClick={() => changeItemTopping(item, topping, 1)}
                                                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-espresso text-cream shadow-sm disabled:opacity-30"
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                disabled={isCheckingStock}
                                onClick={async () => {
                                    setIsCheckingStock(true);
                                    const res = await checkCartStock();
                                    setIsCheckingStock(false);
                                    if (res.isValid) {
                                        setStep('summary');
                                    } else {
                                        alert(`Some items in your cart are no longer available in the requested quantity:\n\n${res.errors?.join('\n')}\n\nYour cart has been automatically updated.`);
                                    }
                                }}
                                className="w-full bg-espresso text-cream font-bold py-5 rounded-3xl shadow-xl flex justify-center gap-3 items-center active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {isCheckingStock ? (
                                    <>Verifying Stock... <Loader2 className="animate-spin" size={20} /></>
                                ) : (
                                    <>Continue to Summary <ArrowRight size={20} /></>
                                )}
                            </button>
                        </motion.div>
                    )}

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
                                            const itemToppings = item.toppings ?? [];
                                            return (
                                                <div key={item.id} className="flex gap-4 items-start">
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
                                                        {itemToppings.length > 0 && (
                                                            <div className="mt-2 pl-3 border-l-2 border-blush/40 space-y-0.5">
                                                                {itemToppings.map(t => (
                                                                    <p key={t.id} className="text-xs text-cocoa/70 flex justify-between gap-2">
                                                                        <span>+ {t.name} ×{t.quantity}</span>
                                                                        <span>₹{t.price * t.quantity}</span>
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {itemToppings.length > 0 && (
                                                            <p className="text-xs font-semibold text-espresso/70 mt-1 text-right">Item total: ₹{getCartItemTotal(item)}</p>
                                                        )}
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
                                disabled={isCheckingStock}
                                onClick={async () => {
                                    setIsCheckingStock(true);
                                    const res = await checkCartStock();
                                    setIsCheckingStock(false);
                                    if (res.isValid) {
                                        setStep('shipping');
                                    } else {
                                        alert(`Some items in your cart are no longer available in the requested quantity:\n\n${res.errors?.join('\n')}\n\nYour cart has been automatically updated.`);
                                    }
                                }}
                                className="w-full bg-espresso text-cream font-bold py-5 rounded-3xl shadow-xl flex justify-center gap-3 items-center active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {isCheckingStock ? (
                                    <>Verifying Stock... <Loader2 className="animate-spin" size={20} /></>
                                ) : (
                                    <>Proceed to Shipping <ArrowRight size={20} /></>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {step === 'shipping' && (
                        <motion.div
                            key="shipping"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="bg-white rounded-[2rem] p-5 sm:p-8 shadow-xl border border-cocoa/5 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400"></div>
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-amber-500">
                                    <MapPin size={28} className="sm:hidden" />
                                    <MapPin size={32} className="hidden sm:block" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-serif text-espresso mb-3 sm:mb-4">Important Shipping Note</h2>
                                <div className="p-4 sm:p-6 bg-amber-50/50 rounded-2xl sm:rounded-3xl border border-amber-100 text-left mb-6 sm:mb-8">
                                    <p className="text-xs sm:text-sm font-bold text-amber-900 mb-1.5 sm:mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                        Rapido Parcel Delivery
                                    </p>
                                    <p className="text-xs sm:text-sm text-amber-800/80 leading-relaxed">
                                        All orders are shipped via Rapido Parcel. Shipping charges are not included in your total and vary based on distance from:
                                        <span className="block mt-1 font-bold text-amber-900">Inspire School, Chandrayangutta.</span>
                                    </p>
                                </div>

                                {/* Delivery Time Note */}
                                <div className="p-4 sm:p-6 bg-rose-50/60 rounded-2xl sm:rounded-3xl border border-rose-200 text-left mb-3">
                                    <p className="text-xs sm:text-sm font-bold text-rose-900 mb-1.5 sm:mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                                        Delivery Time Window
                                    </p>
                                    <p className="text-xs sm:text-sm text-rose-800/80 leading-relaxed">
                                        Deliveries begin at <span className="font-bold text-rose-900">6:00 PM</span>. The exact delivery time may vary depending on the item ordered and delivery schedule. Our team will contact you to confirm your estimated delivery time. Please ensure someone is available to receive the order accordingly.
                                    </p>
                                </div>

                                <label className="flex items-center gap-3 p-3 sm:p-4 bg-rose-50 rounded-xl sm:rounded-2xl border border-rose-200 cursor-pointer group hover:bg-rose-100/60 transition-colors mb-2">
                                    <input
                                        type="checkbox"
                                        checked={deliveryTimeAgreed}
                                        onChange={(e) => setDeliveryTimeAgreed(e.target.checked)}
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg accent-rose-600 cursor-pointer shrink-0"
                                    />
                                    <span className="text-xs sm:text-sm font-medium text-rose-900 text-left leading-snug">
                                        I understand that deliveries begin at <strong>6:00 PM</strong> and that my exact delivery time will be communicated by the Mini Crumbs team.
                                    </span>
                                </label>

                                <label className="flex items-center gap-3 p-3 sm:p-4 bg-cream rounded-xl sm:rounded-2xl border border-espresso/5 cursor-pointer group hover:bg-cream-dark transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={rapidoAgreed}
                                        onChange={(e) => setRapidoAgreed(e.target.checked)}
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg accent-espresso cursor-pointer shrink-0"
                                    />
                                    <span className="text-xs sm:text-sm font-medium text-espresso text-left leading-snug">
                                        I understand and agree to pay the Rapido shipping charges separately.
                                    </span>
                                </label>

                                <label className="flex items-center gap-3 p-3 sm:p-4 bg-cream rounded-xl sm:rounded-2xl border border-espresso/5 cursor-pointer group hover:bg-cream-dark transition-colors mt-2">
                                    <input
                                        type="checkbox"
                                        checked={riskAgreed}
                                        onChange={(e) => setRiskAgreed(e.target.checked)}
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg accent-espresso cursor-pointer shrink-0"
                                    />
                                    <span className="text-xs sm:text-sm font-medium text-espresso text-left leading-snug">
                                        I understand that Rapido deliveries are risky. In the event of any mishap or the driver absconding, Mini Crumbs will refund <strong>30% of the order value</strong>.
                                    </span>
                                </label>
                            </div>

                            {/* Sticky so the button is always visible, even below the three checkboxes */}
                            <div className="sticky bottom-0 z-10 -mx-4 px-4 pt-6 pb-4 space-y-2 bg-gradient-to-t from-cream via-cream/95 to-transparent">
                            <button
                                disabled={!rapidoAgreed || !deliveryTimeAgreed || !riskAgreed || isCheckingStock}
                                onClick={async () => {
                                    setIsCheckingStock(true);
                                    const res = await checkCartStock();
                                    setIsCheckingStock(false);
                                    if (res.isValid) {
                                        setStep('payment');
                                    } else {
                                        alert(`Some items in your cart are no longer available in the requested quantity:\n\n${res.errors?.join('\n')}\n\nYour cart has been automatically updated.`);
                                        setStep('summary');
                                    }
                                }}
                                className="w-full bg-espresso text-cream font-bold py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-xl flex justify-center gap-3 items-center active:scale-95 transition-transform disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                {isCheckingStock ? (
                                    <>Verifying Stock... <Loader2 className="animate-spin" size={20} /></>
                                ) : (
                                    <>Continue to Payment <ArrowRight size={20} /></>
                                )}
                            </button>
                            <p className="text-center text-[9px] sm:text-[10px] text-cocoa/40 uppercase tracking-widest font-bold">
                                {(() => {
                                    const left = [rapidoAgreed, deliveryTimeAgreed, riskAgreed].filter(a => !a).length;
                                    if (left === 0) return 'All set — continue to payment';
                                    return `Tick ${left} more ${left === 1 ? 'box' : 'boxes'} to continue`;
                                })()}
                            </p>
                            </div>
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
                                            size={220}
                                            level="M"
                                            includeMargin={true}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3 w-full max-w-xs">
                                        <button
                                            onClick={downloadQR}
                                            className="flex items-center justify-center gap-2 py-3 px-6 bg-cream text-espresso rounded-2xl font-bold text-sm hover:bg-cream-dark transition-colors border border-espresso/5"
                                        >
                                            <Download size={18} /> Download QR Code
                                        </button>
                                        <p className="text-[11px] text-cocoa/70 font-medium mt-1">Please screenshot this QR if you are unable to download it</p>
                                        <p className="text-[10px] text-cocoa/40 uppercase tracking-widest font-bold">Ref: {orderId}</p>
                                    </div>
                                </div>

                                <div className="mt-10 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-left">
                                    <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-sm font-bold text-green-800">Payment Instructions</p>
                                        <p className="text-xs text-green-700/70 leading-relaxed mt-1">1. Scan or download the QR code.<br />2. Pay ₹{total} via any UPI app (GPay, PhonePe, etc).<br />3. **Take a screenshot** of the successful payment.<br />4. Click the button below to add your details.</p>
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
                                        <input required type="text" value={checkoutForm.name} onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })} className="w-full bg-cream-dark border-transparent rounded-2xl px-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all" placeholder="Jane Doe" />
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
                                            onChange={e => setCheckoutForm(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full bg-cream-dark border-transparent rounded-2xl px-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all"
                                            placeholder="10-digit mobile number"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Complete Delivery Address</label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-4 top-3.5 text-cocoa/50" />
                                            <textarea required rows={3} value={checkoutForm.address} onChange={e => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))} className="w-full bg-cream-dark border-transparent rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all resize-none" placeholder="Flat, House no., Area, Landmark..."></textarea>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-cocoa mb-1.5 pl-1">Any Special Notes?</label>
                                        <input type="text" value={checkoutForm.notes} onChange={e => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full bg-cream-dark border-transparent rounded-2xl px-4 py-3 outline-none focus:border-cocoa/30 focus:bg-white focus:ring-4 focus:ring-cocoa/5 text-espresso transition-all" placeholder="Message on cake, contactless delivery, etc." />
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-cocoa/5">
                                    <span className="block text-sm font-medium text-cocoa mb-3 pl-1">Payment Screenshot (Required)</span>
                                    <label className="block w-full bg-cream-dark border-2 border-dashed border-cocoa/10 rounded-2xl px-4 py-6 text-center hover:bg-cream transition-colors cursor-pointer group relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                                    </label>
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

                            <div className="w-full max-w-sm space-y-4">
                                <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => posthog.capture('whatsapp_link_clicked')}
                                    className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold py-5 rounded-3xl shadow-2xl flex justify-center gap-2 items-center border border-white/20 shadow-green-500/20 active:scale-95 transition-transform"
                                >
                                    <MessageCircle size={20} />
                                    <span className="text-[16px] tracking-wide">Send details to WhatsApp</span>
                                </a>
                            </div>

                            <p className="text-xs text-cocoa/50 mt-2 text-center">Clicking the green button will open WhatsApp.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
