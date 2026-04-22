import { Header } from '../components/layout/Header';
import { Hero } from '../components/home/Hero';
import { Marquee } from '../components/layout/Marquee';
import { MenuSection } from '../components/menu/MenuSection';
import { InstagramReels } from '../components/home/InstagramReels';
import { InstagramHighlights } from '../components/home/InstagramHighlights';
import { Footer } from '../components/layout/Footer';
import { Product, CartItem } from '../types';

interface LandingProps {
   scrolled: boolean;
   cart: CartItem[];
   onOrder: () => void;
   onOpenSizeSelector: (product: Product) => void;
   updateCartQuantity: (id: string, delta: number) => void;
   onViewFullMenu: () => void;
}

export function Landing({ scrolled, cart, onOrder, onOpenSizeSelector, updateCartQuantity, onViewFullMenu }: LandingProps) {
    return (
        <div className="min-h-screen relative overflow-x-hidden bg-[#F9F8F6]">
            <Header scrolled={scrolled} onOrder={onOrder} />
            <Hero onOrder={onOrder} />
            <Marquee />
            <MenuSection 
               cart={cart}
               onOpenSizeSelector={onOpenSizeSelector}
               updateCartQuantity={updateCartQuantity}
               showTitle={true}
               showViewAllBtn={true}
               onViewAll={onViewFullMenu}
            />
            <InstagramReels />
            <InstagramHighlights />
            <Footer onOrder={onOrder} />
        </div>
    );
}
