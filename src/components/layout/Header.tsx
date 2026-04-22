import { Instagram, MessageCircle } from 'lucide-react';
import { INSTAGRAM_HANDLE } from '../../data/constants';

interface HeaderProps {
   scrolled: boolean;
   onOrder: () => void;
}

export function Header({ scrolled, onOrder }: HeaderProps) {
    return (
        <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-cream/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
           <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <img src="/logo.jpg" alt="Mini Crumbs Logo" className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover shadow-md border border-white/40" />
                 <span className={`font-serif text-2xl font-semibold tracking-tight ${scrolled ? 'text-espresso' : 'text-espresso'} transition-colors`}>
                    Mini Crumbs
                 </span>
              </div>
              <div className="flex items-center gap-4">
                 <a href={`https://instagram.com/${INSTAGRAM_HANDLE.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-cocoa hover:text-espresso transition-colors">
                    <Instagram size={20} />
                 </a>
                 <button
                    onClick={onOrder}
                    className="hidden md:flex items-center gap-2 bg-espresso text-cream px-6 py-2.5 rounded-full text-sm font-medium hover:bg-cocoa transition-colors"
                 >
                    Order Now <MessageCircle size={16} />
                 </button>
              </div>
           </div>
        </header>
    );
}
