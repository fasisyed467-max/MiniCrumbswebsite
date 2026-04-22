import { motion } from 'motion/react';
import { Utensils, ArrowRight, Star } from 'lucide-react';

interface HeroProps {
   onOrder: () => void;
}

export function Hero({ onOrder }: HeroProps) {
    return (
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-32 px-0 lg:px-12 max-w-7xl mx-auto">
           <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10 w-full overflow-hidden lg:overflow-visible">

              {/* Mobile Image - Circular with animated rings */}
              <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="w-full relative lg:hidden flex justify-center items-center py-12 order-1 shrink-0"
              >
                 <div className="relative w-[85vw] h-[85vw] max-w-[400px] max-h-[400px] flex justify-center items-center">
                    {/* Animated Rings Container */}
                    <div className="absolute inset-[-1.5rem] rounded-full border-2 border-dashed border-gold/50 animate-[spin_20s_linear_infinite]" />
                    <div className="absolute inset-[-1rem] rounded-full border-[3px] border-t-cocoa/40 border-r-cocoa/40 border-b-transparent border-l-transparent animate-[spin_15s_linear_infinite_reverse]" />
                    <div className="absolute inset-[-0.5rem] rounded-full border-[3px] border-b-blush border-l-blush border-t-transparent border-r-transparent animate-[spin_12s_linear_infinite]" />
                    <div className="absolute inset-[-2rem] rounded-full border-2 border-r-espresso/20 border-t-transparent border-b-transparent border-l-transparent animate-[spin_25s_linear_infinite]" />

                    {/* Main Image */}
                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl ring-4 ring-cream bg-cream-dark z-10">
                       <img
                          src="/Raw choclatecale.png"
                          alt="Hero Cake"
                          className="w-full h-full object-cover"
                       />
                    </div>

                    {/* Floating badge */}
                    <div className="absolute -bottom-4 right-0 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce z-20" style={{ animationDuration: '3s' }}>
                       <div className="bg-blush w-8 h-8 rounded-full flex items-center justify-center text-cocoa">
                          <Utensils size={14} />
                       </div>
                       <div>
                          <p className="text-[10px] font-semibold text-cocoa uppercase tracking-wider mb-0.5">Order Now</p>
                          <p className="text-sm font-medium text-espresso">Raw Chocolate Cake</p>
                       </div>
                    </div>
                 </div>
              </motion.div>

              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8, ease: "easeOut" }}
                 className="max-w-xl px-6 lg:px-0 text-center lg:text-left mt-6 lg:mt-0 order-2 lg:order-1 relative z-20"
              >
                 <h1 className="text-4xl sm:text-5xl lg:text-7xl leading-[1.15] mb-4 lg:mb-6 text-balance text-espresso">
                    Freshly Baked, <br />
                    <span className="italic text-cocoa">Made to Order</span>
                 </h1>
                 <p className="text-base lg:text-lg text-cocoa/80 mb-8 lg:mb-10 leading-relaxed font-light px-2 lg:px-0">
                    Experience the warmth of a handcrafted cloud bakery. From gooey skillet cakes to dense fudgy brownies, sweet treats made fresh just for you.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                    <button
                       onClick={onOrder}
                       className="w-full sm:w-auto bg-cocoa text-cream px-8 py-4 rounded-full text-base font-medium hover:bg-espresso transition-all shadow-md shadow-cocoa/20 flex items-center justify-center gap-2 group"
                    >
                       Order Now
                       <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                       onClick={() => {
                          document.dispatchEvent(new CustomEvent('openCustomModal'));
                       }}
                       className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-medium text-cocoa border border-cocoa/20 hover:bg-cocoa/5 transition-colors flex items-center justify-center gap-2 group"
                    >
                       Custom Cake Quote
                    </button>
                 </div>

                 <div className="mt-10 flex-col items-center lg:items-start gap-4 text-sm text-cocoa/70 font-medium hidden sm:flex sm:flex-row justify-center">
                    <div className="flex -space-x-2">
                       {[1, 2, 3, 4].map(i => (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-cream bg-cream-dark flex items-center justify-center overflow-hidden">
                             <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Customer" className="w-full h-full object-cover" />
                          </div>
                       ))}
                    </div>
                    <div>
                       <div className="flex items-center text-gold mb-0.5 justify-center lg:justify-start">
                          {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                       </div>
                       <span>Loved by our Instagram community</span>
                    </div>
                 </div>
              </motion.div>

              {/* Desktop Image - Circular with animated rings */}
              <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.8, delay: 0.2 }}
                 className="relative hidden lg:flex order-1 lg:order-2 justify-center items-center py-10"
              >
                 <div className="relative w-80 h-80 xl:w-[28rem] xl:h-[28rem] flex justify-center items-center">
                    {/* Animated Rings Container */}
                    <div className="absolute inset-[-2.5rem] rounded-full border-2 border-dashed border-gold/60 animate-[spin_25s_linear_infinite]" />
                    <div className="absolute inset-[-1.5rem] rounded-full border-[3px] border-b-cocoa/40 border-l-cocoa/40 border-t-transparent border-r-transparent animate-[spin_20s_linear_infinite]" />
                    <div className="absolute inset-[-0.75rem] rounded-full border-[3px] border-t-blush border-r-blush border-b-transparent border-l-transparent animate-[spin_15s_linear_infinite_reverse]" />
                    <div className="absolute inset-[-3.5rem] rounded-full border-2 border-r-espresso/20 border-t-transparent border-b-transparent border-l-transparent animate-[spin_30s_linear_infinite_reverse]" />

                    {/* Main Image */}
                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl ring-8 ring-cream bg-cream-dark z-10">
                       <img
                          src="/Raw choclatecale.png"
                          alt="Hero Cake"
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                       />
                    </div>

                    {/* Floating badge */}
                    <div className="absolute -bottom-8 right-0 xl:-right-4 bg-white/95 backdrop-blur p-4 rounded-3xl shadow-xl flex items-center gap-4 animate-bounce z-20" style={{ animationDuration: '3s' }}>
                       <div className="bg-blush w-12 h-12 rounded-full flex items-center justify-center text-cocoa">
                          <Utensils size={20} />
                       </div>
                       <div>
                          <p className="text-xs font-semibold text-cocoa uppercase tracking-wider mb-0.5">Order Now</p>
                          <p className="text-sm font-medium text-espresso">Raw Chocolate Cake</p>
                       </div>
                    </div>
                 </div>
              </motion.div>
           </div>
        </section>
    );
}
