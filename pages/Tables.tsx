import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, Clock, ShoppingBag, Plus, ArrowRight, Utensils } from 'lucide-react';

const Tables: React.FC = () => {
  const { tables, orders, startNewOrder, openExistingOrder } = useStore();
  const navigate = useNavigate();

  const handleTableClick = (tableId: string, currentOrderId?: string) => {
    if (currentOrderId) {
      openExistingOrder(currentOrderId);
    } else {
      startNewOrder('dine-in', tableId);
    }
    navigate('/'); // Go to POS
  };

  const handleTakeawayClick = () => {
      startNewOrder('takeaway');
      navigate('/');
  };

  const handleOpenTakeaway = (orderId: string) => {
      openExistingOrder(orderId);
      navigate('/');
  };

  // Filter for Pending Takeaway Orders
  const pendingTakeawayOrders = useMemo(() => {
    return orders.filter(o => o.status === 'pending' && o.type === 'takeaway');
  }, [orders]);

  return (
    <div className="h-full flex flex-col gap-6 pb-10">
        
        {/* قسم الطاولات */}
        <div>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <Users size={20} />
                    </div>
                    إدارة صالة الطعام
                </h2>
                
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        <span className="text-sm font-bold text-gray-600">متاح</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-bold">{tables.filter(t => t.status === 'available').length}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                        <span className="text-sm font-bold text-gray-600">مشغول</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-bold">{tables.filter(t => t.status === 'occupied').length}</span>
                    </div>
                </div>
            </div>

            {/* Grid Layout Updated: 6 columns on XL screens, tighter gaps */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {tables.map(table => (
                    <div
                        key={table.id}
                        onClick={() => handleTableClick(table.id, table.currentOrderId)}
                        className={`
                            relative h-36 rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden
                            flex flex-col items-center justify-center gap-1 group shadow-sm hover:shadow-md
                            ${table.status === 'available' 
                                ? 'bg-white border-gray-200 hover:border-emerald-400' 
                                : 'bg-rose-50 border-rose-200 hover:border-rose-400'
                            }
                        `}
                    >
                        {/* Status Bar Indicator */}
                        <div className={`absolute top-0 w-full h-1 ${table.status === 'available' ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>

                        {/* Table Icon/Number */}
                        <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-1 transition-transform group-hover:scale-110 shadow-inner
                            ${table.status === 'available' 
                                ? 'bg-gray-50 text-gray-600 group-hover:bg-emerald-50 group-hover:text-emerald-600' 
                                : 'bg-rose-500 text-white shadow-rose-200'
                            }
                        `}>
                            {table.id.replace('t','')}
                        </div>
                        
                        <h3 className="text-sm font-bold text-gray-700">{table.name}</h3>
                        
                        <div className="text-xs text-gray-400 flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full">
                            <Utensils size={10} />
                            <span>{table.capacity} مقاعد</span>
                        </div>

                        {/* Status Icons Absolute */}
                        {table.status === 'occupied' ? (
                            <div className="absolute top-2 left-2 animate-pulse">
                                <Clock size={14} className="text-rose-500" />
                            </div>
                        ) : (
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CheckCircle size={14} className="text-emerald-500" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* فاصل */}
        <div className="w-full h-px bg-gray-200/60 my-2"></div>

        {/* قسم السفري (تحت الطاولات / يمين الشاشة حسب الاتجاه) */}
        <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <ShoppingBag size={20} />
                </div>
                إدارة طلبات السفري (Takeaway)
            </h2>

            <div className="flex flex-col lg:flex-row gap-4">
                
                {/* زر إضافة طلب جديد */}
                <button 
                    onClick={handleTakeawayClick}
                    className="w-full lg:w-48 h-24 lg:h-auto rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 transition-colors group shrink-0"
                >
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-blue-200">
                        <Plus size={20} />
                    </div>
                    <span className="font-bold text-blue-700 text-sm">طلب سفري جديد</span>
                </button>

                {/* قائمة الطلبات المعلقة */}
                <div className="flex-1 overflow-x-auto pb-4 scrollbar-hide">
                    {pendingTakeawayOrders.length === 0 ? (
                        <div className="h-24 lg:h-full flex items-center justify-center text-gray-400 bg-white rounded-xl border border-gray-100 text-sm">
                            لا توجد طلبات سفري معلقة
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            {pendingTakeawayOrders.map(order => (
                                <div 
                                    key={order.id}
                                    onClick={() => handleOpenTakeaway(order.id)}
                                    className="min-w-[180px] bg-white p-3 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 cursor-pointer group transition-all"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-800">#{order.orderNumber}</span>
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                            {new Date(order.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <div className="text-xs text-gray-500 mb-0.5">{order.items.length} منتجات</div>
                                        <div className="font-bold text-lg text-blue-600">{order.total.toFixed(2)} د.ع</div>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 text-xs text-gray-300 group-hover:text-blue-500 transition-colors">
                                        <span>فتح</span>
                                        <ArrowRight size={12} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

    </div>
  );
};

export default Tables;