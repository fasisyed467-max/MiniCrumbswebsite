import { motion } from 'motion/react';
import { Instagram, Star, Heart } from 'lucide-react';

const HIGHLIGHTS = [
    { id: 1, title: 'Reviews', img: '/Basque cheesecake.png' },
    { id: 2, title: 'Unboxing', img: '/Matilda Bento Cake.png' },
    { id: 3, title: 'Happy Customers', img: '/Lotus Biscoff cheese cake.png' },
    { id: 4, title: 'Feedbacks', img: '/Chco Lava skillet.png' },
    { id: 5, title: 'Gifts', img: '/Dark Chocolate Skillet.png' },
];

const STORY_SCREENSHOTS = [
    { id: 1, img: '/Raw choclatecale.png', text: "Best chocolate cake I've ever had! 🎂", user: "@sarah_j" },
    { id: 2, img: '/Red velvet skillet.png', text: "The red velvet is heavenly. So soft and moist!", user: "@emily_cakes" },
    { id: 3, img: '/Chocolate Brownie Slab.png', text: "Perfect for our party. Everyone loved it!", user: "@foodie_hyd" },
];

export function InstagramHighlights() {
    const highlightUrl = "https://www.instagram.com/stories/highlights/18072326188974972/";

    return (
        <section className="py-24 bg-[#F9F8F6] px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl mb-4 text-espresso">Happy Crumbs</h2>
                    <p className="text-cocoa/70 flex items-center justify-center gap-2">
                        <Instagram size={16} /> Tap into our Instagram Highlights to see the love
                    </p>
                </div>

                {/* Highlights Row */}
                <div className="flex overflow-x-auto scrollbar-hide gap-8 pb-12 mb-12 justify-center lg:justify-center">
                    {HIGHLIGHTS.map((item) => (
                        <a 
                            key={item.id}
                            href={highlightUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-col items-center gap-3 shrink-0 group"
                        >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] group-hover:scale-105 transition-transform">
                                <div className="w-full h-full rounded-full border-[3px] border-[#F9F8F6] overflow-hidden">
                                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-espresso tracking-tight">{item.title}</span>
                        </a>
                    ))}
                </div>

                {/* Story-styled Review Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {STORY_SCREENSHOTS.map((story) => (
                        <motion.div 
                            key={story.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="aspect-[9/16] relative rounded-[2rem] overflow-hidden shadow-2xl group"
                        >
                            <img src={story.img} alt="Review Story" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                            
                            {/* Instagram UI Overlays */}
                            <div className="absolute top-6 left-6 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border border-white p-[1px]">
                                    <img src={story.img} className="w-full h-full rounded-full object-cover" alt="User" />
                                </div>
                                <span className="text-white text-xs font-bold drop-shadow-md">{story.user}</span>
                            </div>

                            <div className="absolute bottom-10 left-6 right-6 p-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                                <div className="flex gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className="text-gold fill-gold" />)}
                                </div>
                                <p className="text-white text-sm font-medium leading-relaxed mb-3">"{story.text}"</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-white/60 text-[10px] uppercase tracking-widest font-bold">Mini Crumbs Review</span>
                                    <Heart size={14} className="text-white fill-white animate-pulse" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <a 
                        href={highlightUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 bg-white border border-cocoa/10 px-8 py-4 rounded-full text-espresso font-semibold shadow-sm hover:bg-cream transition-all hover:scale-105 active:scale-95"
                    >
                        View More Reviews <ExternalLink size={18} className="text-cocoa/40" />
                    </a>
                </div>
            </div>
        </section>
    );
}

function ExternalLink({ size, className }: { size: number, className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
    );
}
