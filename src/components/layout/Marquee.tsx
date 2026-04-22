import { Star } from 'lucide-react';

export function Marquee() {
    return (
        <div className="bg-cocoa text-cream py-4 overflow-hidden border-y border-espresso/10">
           <div className="flex whitespace-nowrap animate-marquee">
              {Array.from({ length: 15 }).map((_, i) => (
                 <div key={i} className="flex items-center mx-6 text-sm font-medium tracking-wide uppercase">
                    <Star size={12} className="text-gold mr-6" />
                    <span>FRESHLY BAKED</span>
                    <span className="mx-6 text-cream/50">•</span>
                    <span>NO PRESERVATIVES</span>
                    <span className="mx-6 text-cream/50">•</span>
                    <span>MADE TO ORDER</span>
                 </div>
              ))}
           </div>
        </div>
    );
}
