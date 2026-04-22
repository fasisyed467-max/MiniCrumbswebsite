import { motion } from 'motion/react';
import { Play, Instagram, ExternalLink } from 'lucide-react';
import { INSTAGRAM_HANDLE } from '../../data/constants';

const REELS = [
    { id: 1, img: '/Chco Lava skillet.png', likes: '1.2k' },
    { id: 2, img: '/Dark Chocolate Skillet.png', likes: '845' },
    { id: 3, img: '/Lotus Biscoff cheese cake.png', likes: '2.1k' },
    { id: 4, img: '/Matilda Bento Cake.png', likes: '1.5k' },
    { id: 5, img: '/Raw choclatecale.png', likes: '3.2k' },
    { id: 6, img: '/Basque cheesecake.png', likes: '920' },
];

export function InstagramReels() {
    const handle = INSTAGRAM_HANDLE.replace('@', '');
    const profileUrl = `https://www.instagram.com/${handle}/`;

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-blush font-bold tracking-widest uppercase text-xs mb-3">
                        <Instagram size={14} /> Social Feed
                    </div>
                    <h2 className="text-4xl lg:text-5xl text-espresso">Follow Our Cravings</h2>
                    <p className="text-cocoa/60 mt-4 max-w-xl font-light">See our latest bakes in action. Follow us on Instagram for daily updates, behind the scenes, and special offers.</p>
                </div>
                <a 
                    href={profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-espresso font-semibold hover:text-cocoa transition-colors group"
                >
                    @{handle} <ExternalLink size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
            </div>

            <div className="relative">
                {/* Gradient Masks */}
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                <div className="flex overflow-hidden">
                    <motion.div 
                        className="flex gap-6 py-4 px-3 shrink-0"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ 
                            duration: 20, // 20s for two sets = 10s per full cycle across screen roughly
                            ease: "linear", 
                            repeat: Infinity 
                        }}
                    >
                        {[...REELS, ...REELS].map((reel, idx) => (
                            <a 
                                key={`${reel.id}-${idx}`}
                                href={profileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="relative w-64 h-[28rem] rounded-[2rem] overflow-hidden group shrink-0 shadow-lg shadow-cocoa/5"
                            >
                                <img 
                                    src={reel.img} 
                                    alt="Instagram Reel" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                
                                {/* Overlay Content */}
                                <div className="absolute inset-0 p-6 flex flex-col justify-between items-center text-white">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 self-end opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <Play size={20} fill="white" />
                                    </div>
                                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                        <Play size={24} fill="white" />
                                    </div>
                                    <div className="flex items-center gap-2 self-start font-medium text-sm">
                                        <Instagram size={14} /> {reel.likes}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
