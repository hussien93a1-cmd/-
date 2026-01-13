import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Minus, Trash2, ShoppingBag, 
  CreditCard, Banknote, Utensils, Clock, Receipt, ArrowRight, Printer, ChefHat, X, ChevronDown
} from 'lucide-react';
import { Product, Variant, Order } from '../types';

// ألوان البطاقات كما في الصورة (تدرجات)
const CARD_COLORS = [
  'bg-gradient-to-br from-emerald-400 to-emerald-500', // Green
  'bg-gradient-to-br from-blue-400 to-blue-500',       // Blue
  'bg-gradient-to-br from-rose-400 to-rose-500',       // Pink/Red
  'bg-gradient-to-br from-orange-400 to-orange-500',   // Orange
  'bg-gradient-to-br from-purple-400 to-purple-500',   // Purple
  'bg-gradient-to-br from-cyan-400 to-cyan-500',       // Cyan
];

const POS: React.FC = () => {
  const { 
    products, addToCart, currentOrder, 
    startNewOrder, updateCartItemQuantity, 
    saveOrder, checkoutOrder, clearCart,
    orders, openExistingOrder, printerConfig
  } = useStore();

  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  
  // Mobile Cart State
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Printing State
  const [printData, setPrintData] = useState<{order: Order, type: 'receipt' | 'kitchen'} | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.includes(searchQuery);
      return matchesSearch && p.isActive;
    });
  }, [products, searchQuery]);

  // Get Pending Takeaway Orders
  const pendingTakeawayOrders = useMemo(() => {
    return orders.filter(o => o.status === 'pending' && o.type === 'takeaway');
  }, [orders]);

  // Cart Totals for Mobile Bar
  const cartTotalItems = currentOrder?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const cartTotalPrice = currentOrder?.total || 0;

  const handleProductClick = (product: Product) => {
    if (product.variants.length === 1) {
      addToCart(product, product.variants[0]);
    } else {
      setSelectedProductForVariant(product);
    }
  };

  const handleVariantSelect = (variant: Variant) => {
    if (selectedProductForVariant) {
      addToCart(selectedProductForVariant, variant);
      setSelectedProductForVariant(null);
    }
  };

  const handlePrint = (type: 'receipt' | 'kitchen') => {
    if (!currentOrder) return;
    setPrintData({ order: currentOrder, type });
    // Allow state to update then print
    setTimeout(() => {
        window.print();
        setPrintData(null); // Clear after print dialog opens
    }, 100);
  };

  const handleCheckout = (method: 'cash' | 'card') => {
      if (!currentOrder) return;
      
      handlePrint('receipt');
      checkoutOrder(method);
      setIsCartOpen(false); // Close mobile cart

      setTimeout(() => {
          navigate('/tables');
      }, 500);
  };

  const renderVariantModal = () => {
    if (!selectedProductForVariant) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
          <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">
            اختر النوع: {selectedProductForVariant.name}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {selectedProductForVariant.variants.map(v => (
              <button
                key={v.id}
                onClick={() => handleVariantSelect(v)}
                className="flex justify-between items-center p-4 border-2 border-gray-100 rounded-xl hover:border-primary hover:bg-emerald-50 transition-all"
              >
                <span className="font-bold text-lg">{v.name}</span>
                <span className="text-primary font-bold">{v.price} د.ع</span>
              </button>
            ))}
          </div>
          <button 
            onClick={() => setSelectedProductForVariant(null)}
            className="mt-6 w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full overflow-hidden relative">
      {renderVariantModal()}
      
      {/* Hidden Printable Area */}
      {printData && (
        <div id="printable-area" className="hidden print:block p-2" dir="rtl" style={{ width: printerConfig.paperSize === '58mm' ? '58mm' : 'auto' }}>
            <div className="text-center font-bold border-b-2 border-dashed border-black pb-4 mb-4">
                {printData.type === 'kitchen' ? (
                    <h1 className="text-3xl mb-2">🧑‍🍳 تذكرة مطبخ</h1>
                ) : (
                    <>
                        <h1 className="text-2xl mb-1">كباب الديرة</h1>
                        <p className="text-sm">فاتورة ضريبية مبسطة</p>
                    </>
                )}
                <div className="flex justify-between text-lg mt-2">
                    <span>طلب #{printData.order.orderNumber}</span>
                    <span>{printData.order.type === 'dine-in' ? `طاولة ${printData.order.tableId?.replace('t','')}` : 'سفري'}</span>
                </div>
                <div className="text-sm text-left mt-1">{new Date().toLocaleString('ar-SA')}</div>
            </div>
            
            <div className="w-full">
                {printData.order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-gray-200">
                        <div className="flex-1">
                            <span className="text-xl font-bold">{item.quantity}x {item.productName}</span>
                            <div className="text-sm text-gray-600">{item.variantName}</div>
                        </div>
                        {printData.type === 'receipt' && (
                            <div className="text-lg font-bold">{(item.price * item.quantity).toFixed(2)}</div>
                        )}
                    </div>
                ))}
            </div>

            {printData.type === 'receipt' && (
                <div className="mt-4 border-t-2 border-black pt-2">
                    <div className="flex justify-between text-lg">
                        <span>المجموع</span>
                        <span>{printData.order.subtotal.toFixed(2)}</span>
                    </div>
                    {printData.order.tax > 0 && (
                        <div className="flex justify-between text-lg">
                            <span>الضريبة</span>
                            <span>{printData.order.tax.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-2xl font-bold mt-2">
                        <span>الإجمالي</span>
                        <span>{printData.order.total.toFixed(2)} د.ع</span>
                    </div>
                </div>
            )}
            
            <div className="text-center mt-8 text-sm">
                {printData.type === 'receipt' ? 'شكراً لزيارتكم!' : '** نهاية الطلب **'}
            </div>
        </div>
      )}

      {/* Left Side: Menu (Products) */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full order-1 lg:order-1">
        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Products Grid - Added bottom padding for mobile bar */}
        <div className="flex-1 overflow-y-auto pr-1 pb-24 lg:pb-4">
            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ShoppingBag size={64} className="mb-4 opacity-50" />
                    <p className="text-xl font-medium">لا توجد منتجات مضافة</p>
                    <p className="text-sm">قم بإضافة منتجات من صفحة القائمة</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {filteredProducts.map((product, index) => {
                        const colorClass = CARD_COLORS[index % CARD_COLORS.length];
                        return (
                            <div 
                                key={product.id}
                                onClick={() => handleProductClick(product)}
                                className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group flex flex-col h-40 md:h-48"
                            >
                                {/* Top Color Part */}
                                <div className={`flex-[2] ${colorClass} flex items-center justify-center relative`}>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                    <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-inner">
                                        <ShoppingBag className="text-white drop-shadow-sm" size={20} />
                                    </div>
                                    {product.variants.length > 1 && (
                                        <div className="absolute top-3 right-3 bg-black/20 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md">
                                            خيارات
                                        </div>
                                    )}
                                </div>
                                {/* Bottom White Part */}
                                <div className="flex-1 bg-white p-2 flex flex-col items-center justify-center text-center">
                                    <h3 className="font-bold text-gray-800 text-sm md:text-lg truncate w-full px-2">{product.name}</h3>
                                    <span className="text-red-500 font-bold text-sm md:text-lg mt-0.5 md:mt-1">
                                        {product.variants[0].price.toLocaleString()} <span className="text-xs text-gray-400">د.ع</span>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* MOBILE BOTTOM BAR (Trigger for Cart) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:hidden z-40 flex items-center gap-4">
        <div className="flex-1">
            <div className="flex items-center gap-2">
                <div className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {cartTotalItems}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-bold">المجموع</span>
                    <span className="font-bold text-lg text-primary">{cartTotalPrice.toFixed(2)} د.ع</span>
                </div>
            </div>
        </div>
        <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
            <ShoppingBag size={20} />
            <span>عرض الفاتورة</span>
        </button>
      </div>

      {/* Right Side: Cart / Order Management */}
      {/* Responsive Logic: Hidden on mobile unless isCartOpen is true (then fixed full screen). Always visible on Desktop */}
      <div className={`
        bg-white lg:rounded-3xl shadow-lg border-gray-100 order-2 lg:order-2 shrink-0 flex flex-col overflow-hidden transition-all duration-300
        ${isCartOpen 
            ? 'fixed inset-0 z-50 w-full h-full rounded-none' 
            : 'hidden lg:flex lg:w-[400px] lg:h-full border'
        }
      `}>
        
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end mb-2">
            <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-200 rounded-full text-gray-600">
                <ChevronDown size={24} />
            </button>
          </div>

          {!currentOrder ? (
              <div className="text-center">
                  <h3 className="font-bold text-gray-700 mb-2 md:mb-4 text-sm md:text-base">اختر نوع الطلب الجديد</h3>
                  <div className="flex gap-2 mb-2 md:mb-4">
                    <button 
                        onClick={() => startNewOrder('dine-in')}
                        className="flex-1 py-3 md:py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-all flex flex-col items-center gap-1 md:gap-2 group"
                    >
                        <Utensils size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-xs md:text-sm">محلي</span>
                    </button>
                    <button 
                        onClick={() => startNewOrder('takeaway')}
                        className="flex-1 py-3 md:py-4 rounded-xl bg-white border-2 border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary transition-all flex flex-col items-center gap-1 md:gap-2 group"
                    >
                        <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-xs md:text-sm">سفري</span>
                    </button>
                  </div>
              </div>
          ) : (
             <div className="flex justify-between items-center">
                <div>
                   <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${currentOrder.type === 'dine-in' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                     {currentOrder.type === 'dine-in' ? 'محلي' : 'سفري'}
                   </span>
                   {currentOrder.tableId && <span className="mr-2 font-bold text-gray-700 text-sm">طاولة {currentOrder.tableId.replace('t','')}</span>}
                   <div className="text-xs text-gray-400 mt-1">#{currentOrder.orderNumber}</div>
                </div>
                <div className="flex gap-1">
                    <button 
                        onClick={() => handlePrint('kitchen')}
                        className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"
                        title="طباعة للمطبخ"
                    >
                        <ChefHat size={18} />
                    </button>
                    <button 
                        onClick={() => { saveOrder(true); setIsCartOpen(false); navigate('/tables'); }} 
                        className="flex items-center gap-1 text-xs md:text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100"
                    >
                    <Receipt size={16} />
                    تعليق
                    </button>
                </div>
             </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 bg-white">
            {!currentOrder ? (
                // Show Pending Takeaway Orders List
                <div className="h-full">
                    <h4 className="font-bold text-gray-500 mb-2 flex items-center gap-2 text-xs md:text-sm">
                        <Clock size={14} />
                        طلبات معلقة ({pendingTakeawayOrders.length})
                    </h4>
                    {pendingTakeawayOrders.length === 0 ? (
                        <div className="text-center text-gray-400 mt-4 md:mt-10">
                            <p className="text-sm">لا توجد طلبات معلقة</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingTakeawayOrders.map(order => (
                                <div 
                                    key={order.id}
                                    onClick={() => openExistingOrder(order.id)}
                                    className="p-3 border border-gray-100 rounded-xl hover:border-secondary hover:bg-blue-50 cursor-pointer group transition-all"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-800 text-sm">#{order.orderNumber}</span>
                                        <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded-full border">
                                            {new Date(order.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-gray-500">{order.items.length} منتجات</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-secondary text-sm">{order.total.toFixed(2)}</span>
                                            <ArrowRight size={14} className="text-gray-300 group-hover:text-secondary" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Show Cart Items
                <>
                    {currentOrder.items.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <ShoppingBag size={32} className="mb-2" />
                            <p className="text-sm">السلة فارغة</p>
                        </div>
                    )}
                    {currentOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl group border border-transparent hover:border-gray-200">
                            <div className="flex-1">
                                <div className="font-bold text-gray-800 text-sm">{item.productName}</div>
                                <div className="text-[10px] text-gray-500">{item.variantName}</div>
                                <div className="text-primary font-bold mt-0.5 text-sm">{item.price * item.quantity}</div>
                            </div>
                            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                                <button 
                                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-gray-600 hover:text-red-500"
                                >
                                    {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                                </button>
                                <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                                <button 
                                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-green-50 text-gray-600 hover:text-green-500"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>

        {/* Footer / Calculations */}
        {currentOrder && (
            <div className="p-3 md:p-5 border-t border-gray-100 bg-gray-50 shrink-0">
            <div className="space-y-1 mb-3 text-gray-600 text-sm">
                <div className="flex justify-between font-bold text-gray-900 text-lg">
                    <span>الإجمالي</span>
                    <span>{currentOrder?.total.toFixed(2) || '0.00'} <small className="text-xs font-normal">د.ع</small></span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button 
                    disabled={!currentOrder || currentOrder.items.length === 0}
                    onClick={() => handleCheckout('cash')}
                    className="bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
                >
                    <Banknote size={18} />
                    نقدي
                </button>
                <button 
                    disabled={!currentOrder || currentOrder.items.length === 0}
                    onClick={() => handleCheckout('card')}
                    className="bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
                >
                    <CreditCard size={18} />
                    شبكة
                </button>
            </div>
            {currentOrder && (
                <button onClick={() => { clearCart(); setIsCartOpen(false); navigate('/tables'); }} className="w-full mt-2 text-red-500 text-xs font-bold hover:bg-red-50 py-1.5 rounded-lg">
                    إلغاء الطلب
                </button>
            )}
            </div>
        )}

      </div>
    </div>
  );
};

export default POS;