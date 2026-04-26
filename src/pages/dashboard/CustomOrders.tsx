import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Package,
  Calendar, 
  Phone, 
  MapPin, 
  Clock, 
  ChevronRight,
  Search,
  Image as ImageIcon,
  Weight,
  MessageSquare,
  Check,
  X
} from 'lucide-react';
import { api } from '../../utils/api';
import { Order } from '../../types';

export default function CustomOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await api.fetchCustomOrders();
      setOrders(data as Order[]);
      setIsLoading(false);
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(order.order_number).includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (order: Order, newStatus: Order['status']) => {
    try {
      await api.updateOrderStatus(order.id, newStatus);
      
      // Update local state
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));

      // WhatsApp Logic (Tailored for Custom Orders)
      const statusMessages = {
        received: `Hi ${order.customer_name}! We've received your request for a custom Mini Crumbs creation. We're excited to start working on it! 🍰✨`,
        baking: `Hi ${order.customer_name}! Your custom Mini Crumbs creation is currently being crafted and baked. It's looking great! 🔥🎂`,
        delivery: `Yay! ${order.customer_name}, your custom Mini Crumbs order is out for delivery. Can't wait for you to see it! 🚚💖`,
        cancelled: `Hi ${order.customer_name}, unfortunately we won't be able to fulfill your custom order request at this time. Apologies for the inconvenience. 🙏`
      };

      const message = statusMessages[newStatus as keyof typeof statusMessages];
      if (message) {
        const phone = order.customer_phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const statusOptions = [
    { id: 'all', label: 'ALL', count: orders.length, color: 'border-cocoa/20' },
    { id: 'pending', label: 'NEW', count: orders.filter(o => o.status === 'pending').length, color: 'border-blush/40' },
    { id: 'received', label: 'RECEIVED', count: orders.filter(o => o.status === 'received').length, color: 'border-blue-400' },
    { id: 'baking', label: 'BAKING', count: orders.filter(o => o.status === 'baking').length, color: 'border-amber-400' },
    { id: 'delivery', label: 'DELIVERY', count: orders.filter(o => o.status === 'delivery').length, color: 'border-green-400' },
    { id: 'cancelled', label: 'CANCELLED', count: orders.filter(o => o.status === 'cancelled').length, color: 'border-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-espresso">Custom Orders</h2>
          <p className="text-sm text-cocoa/60">Unique creations requested by your customers.</p>
        </div>
        
      {/* Status Bar */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
        {statusOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setStatusFilter(opt.id)}
            className={`flex items-center gap-3 px-6 py-3 bg-white border-2 rounded-2xl transition-all whitespace-nowrap shadow-sm ${
              statusFilter === opt.id ? opt.color : 'border-transparent text-cocoa/40'
            }`}
          >
            {opt.id === 'pending' && <Sparkles size={16} className="text-blush" />}
            {opt.id === 'received' && <Package size={16} className="text-blue-500" />}
            {opt.id === 'baking' && <Clock size={16} className="text-amber-500" />}
            {opt.id === 'delivery' && <Check size={16} className="text-green-500" />}
            {opt.id === 'cancelled' && <X size={16} className="text-red-500" />}
            <span className="text-xs font-bold tracking-widest">#{opt.label}</span>
          </button>
        ))}
      </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[450px] bg-white rounded-[2.5rem] animate-pulse border border-espresso/5 shadow-sm" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-espresso/5 p-20 text-center shadow-sm">
          <div className="w-20 h-20 bg-blush/10 mx-auto rounded-3xl flex items-center justify-center text-cocoa/30 mb-6">
            <Sparkles size={40} />
          </div>
          <h3 className="text-xl font-serif font-bold text-espresso mb-2">No Custom Orders</h3>
          <p className="text-cocoa/60 max-w-xs mx-auto">Custom cake requests will appear here with all their details.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          {filteredOrders.map((order, idx) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`border rounded-[2.5rem] overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col ${
                order.status === 'pending' ? 'bg-[#ff94a2] border-pink-200' :
                order.status === 'received' ? 'bg-blue-600 border-blue-400' :
                order.status === 'baking' ? 'bg-amber-600 border-amber-400' :
                order.status === 'delivery' ? 'bg-emerald-600 border-emerald-400' :
                order.status === 'cancelled' ? 'bg-red-600 border-red-400' :
                'bg-white border-espresso/5'
              }`}
            >
              {/* Reference Image */}
              <div className="aspect-[4/3] relative bg-cream overflow-hidden">
                {order.reference_image_url ? (
                  <img 
                    src={order.reference_image_url} 
                    alt="Reference" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-cocoa/20">
                    <ImageIcon size={48} />
                    <span className="text-xs font-bold uppercase mt-2">No Reference Image</span>
                  </div>
                )}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                   <span className="text-xs font-bold uppercase tracking-widest px-4 py-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-espresso">
                     Order #{order.order_number}
                   </span>
                   <div className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-sm ${
                    order.status === 'pending' ? 'bg-white/40 text-espresso' : 'bg-white/20 text-white'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className={`text-xl font-serif font-bold mb-1 ${order.status === 'pending' ? 'text-espresso' : 'text-white'}`}>{order.customer_name}</h4>
                    <p className={`text-xs font-medium ${order.status === 'pending' ? 'text-espresso/40' : 'text-white/60'}`}>
                       {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className={`p-3 rounded-2xl ${order.status === 'pending' ? 'bg-blush/10 text-cocoa' : 'bg-white/20 text-white'}`}>
                    <Sparkles size={18} />
                  </div>
                </div>

                {/* Customer Details */}
                <div className={`rounded-2xl p-4 mb-6 space-y-3 border ${
                  order.status === 'pending' ? 'bg-white/50 border-pink-200' : 'bg-white/10 border-white/10 text-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <Phone size={14} className={order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'} />
                    <p className="text-sm font-bold">{order.customer_phone}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className={`shrink-0 mt-1 ${order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'}`} />
                    <p className="text-sm font-bold line-clamp-1">{order.delivery_address}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-2xl border ${
                    order.status === 'pending' ? 'bg-cream/30 border-pink-100' : 'bg-white/5 border-white/5 text-white'
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'}`}>Weight</p>
                    <p className="text-sm font-bold flex items-center gap-2"><Weight size={14} className={order.status === 'pending' ? 'text-cocoa/30' : 'text-white/30'} /> {order.custom_details?.weight || 'N/A'}</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${
                    order.status === 'pending' ? 'bg-cream/30 border-pink-100' : 'bg-white/5 border-white/5 text-white'
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'}`}>Delivery</p>
                    <p className="text-sm font-bold flex items-center gap-2"><Clock size={14} className={order.status === 'pending' ? 'text-cocoa/30' : 'text-white/30'} /> {order.delivery_time}</p>
                  </div>
                </div>

                <div className={`rounded-2xl p-4 mb-8 flex-1 border ${
                  order.status === 'pending' ? 'bg-espresso/[0.02] border-espresso/5 text-cocoa/80' : 'bg-white/5 border-white/10 text-white/90'
                }`}>
                   <div className="flex items-start gap-3 text-sm">
                      <MessageSquare size={16} className={`mt-0.5 flex-shrink-0 ${order.status === 'pending' ? 'text-cocoa/20' : 'text-white/20'}`} />
                      <p className="italic leading-relaxed line-clamp-3">"{order.custom_details?.description || order.notes || 'No description provided'}"</p>
                   </div>
                </div>

                <div className={`pt-6 border-t border-dashed mt-auto ${order.status === 'pending' ? 'border-espresso/10' : 'border-white/20'}`}>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(order, 'received')}
                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          order.status === 'received' ? 'bg-white text-blue-600 shadow-md scale-95' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Order Received
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(order, 'baking')}
                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          order.status === 'baking' ? 'bg-white text-amber-600 shadow-md scale-95' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Baking
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(order, 'delivery')}
                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          order.status === 'delivery' ? 'bg-white text-emerald-600 shadow-md scale-95' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Out for Delivery
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(order, 'cancelled')}
                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          order.status === 'cancelled' ? 'bg-white text-red-600 shadow-md scale-95' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Canceled
                      </button>
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
