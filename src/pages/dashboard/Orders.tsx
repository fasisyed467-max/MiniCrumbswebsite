import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  Sparkles,
  Calendar, 
  Phone, 
  MapPin, 
  Clock, 
  ChevronRight,
  Search,
  Filter,
  Check,
  X,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { api } from '../../utils/api';
import { Order } from '../../types';

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await api.fetchOrders();
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

      // WhatsApp Logic
      const statusMessages = {
        received: `Hi ${order.customer_name}! We've received your Mini Crumbs order and are getting it ready. Thank you for ordering with us! 🎂`,
        baking: `Great news ${order.customer_name}! Your Mini Crumbs order is currently being baked with love. Stay tuned! 🔥🧁`,
        delivery: `Yay! ${order.customer_name}, your Mini Crumbs order is out for delivery and will be reaching you shortly. Get ready for some sweetness! 🚚💨`,
        cancelled: `Hi ${order.customer_name}, we're sorry to inform you that we've had to cancel your order. Please contact us for any questions. 🙏`
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
          <h2 className="text-3xl font-serif font-bold text-espresso">Orders</h2>
          <p className="text-cocoa/60">Manage your bakery's daily standard orders.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa/40" size={18} />
            <input 
              type="text" 
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-espresso/5 rounded-2xl pl-11 pr-5 py-3 outline-none focus:ring-2 focus:ring-blush/20 transition-all w-full md:w-64"
            />
          </div>
          <button className="p-3 bg-white border border-espresso/5 rounded-2xl text-cocoa hover:bg-cream transition-colors">
            <Filter size={20} />
          </button>
        </div>
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[400px] bg-white rounded-[2.5rem] animate-pulse border border-espresso/5 shadow-sm" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-espresso/5 p-20 text-center shadow-sm">
          <div className="w-20 h-20 bg-cream mx-auto rounded-3xl flex items-center justify-center text-cocoa/30 mb-6">
            <Package size={40} />
          </div>
          <h3 className="text-xl font-serif font-bold text-espresso mb-2">No Orders Found</h3>
          <p className="text-cocoa/60 max-w-xs mx-auto">When customers place orders, they will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
          {filteredOrders.map((order, idx) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`border rounded-[2.5rem] p-8 shadow-md hover:shadow-xl transition-all flex flex-col ${
                order.status === 'pending' ? 'bg-[#ff94a2] border-pink-200' :
                order.status === 'received' ? 'bg-blue-600 border-blue-400' :
                order.status === 'baking' ? 'bg-amber-600 border-amber-400' :
                order.status === 'delivery' ? 'bg-emerald-600 border-emerald-400' :
                order.status === 'cancelled' ? 'bg-red-600 border-red-400' :
                'bg-white border-espresso/5'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className={`text-xl font-bold mb-1 ${order.status === 'pending' ? 'text-espresso' : 'text-white'}`}>Order #{order.order_number}</h4>
                  <p className={`text-xs font-medium ${order.status === 'pending' ? 'text-espresso/40' : 'text-white/60'}`}>
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  order.status === 'pending' ? 'bg-white/40 text-espresso' : 'bg-white/20 text-white'
                }`}>
                  {order.status}
                </div>
              </div>

              {/* Customer Info Section */}
              <div className={`rounded-3xl p-5 mb-6 space-y-3 border shadow-sm ${
                order.status === 'pending' ? 'bg-white/50 border-pink-200' : 'bg-white/10 border-white/10 text-white'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'pending' ? 'bg-cocoa/10 text-cocoa' : 'bg-white/20 text-white'}`}>
                    <Package size={14} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'}`}>Customer</p>
                    <p className="text-sm font-bold">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'pending' ? 'bg-cocoa/10 text-cocoa' : 'bg-white/20 text-white'}`}>
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'}`}>Phone</p>
                    <p className="text-sm font-bold">{order.customer_phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${order.status === 'pending' ? 'bg-cocoa/10 text-cocoa' : 'bg-white/20 text-white'}`}>
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'}`}>Address</p>
                    <p className="text-sm font-bold line-clamp-2 leading-snug">{order.delivery_address}</p>
                  </div>
                </div>
                {order.payment_screenshot_url && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'pending' ? 'bg-green-500/10 text-green-600' : 'bg-white/20 text-white'}`}>
                      <ExternalLink size={14} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 ${order.status === 'pending' ? 'text-green-600/60' : 'text-white/40'}`}>Payment</p>
                      <a href={order.payment_screenshot_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold underline decoration-dotted">View Screenshot</a>
                    </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="flex-1 space-y-4 mb-6">
                <p className={`text-[10px] font-bold uppercase tracking-widest ml-1 ${order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'}`}>Ordered Items</p>
                {order.items?.map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl border shadow-sm ${
                    order.status === 'pending' ? 'bg-white/30 border-pink-100' : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="w-12 h-12 rounded-xl bg-white/20 overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image_url || "/logo.jpg"} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className={`font-bold text-xs truncate ${order.status === 'pending' ? 'text-espresso' : 'text-white'}`}>{item.name}</h5>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs font-bold ${order.status === 'pending' ? 'text-cocoa' : 'text-white/80'}`}>₹{item.price}</span>
                        <span className={`text-[10px] font-bold uppercase ${order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'}`}>Qty: {item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer */}
              <div className={`pt-6 border-t border-dashed mt-auto ${order.status === 'pending' ? 'border-espresso/10' : 'border-white/20'}`}>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${order.status === 'pending' ? 'text-cocoa/40' : 'text-white/40'}`}>{order.items?.length || 0} Items Total</p>
                      <p className={`text-2xl font-bold ${order.status === 'pending' ? 'text-espresso' : 'text-white'}`}>₹{order.total_amount}</p>
                    </div>
                  </div>

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
