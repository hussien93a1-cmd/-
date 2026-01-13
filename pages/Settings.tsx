import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Settings as SettingsIcon, Save, AlertTriangle, UtensilsCrossed, 
  Printer, RotateCcw, Plus, Edit2, Trash2, Eye, ChefHat, 
  Wifi, Bluetooth, Usb, Smartphone, Download, Loader2, FileText, Calendar, DollarSign
} from 'lucide-react';
import { Product, Variant, Order } from '../types';
import html2canvas from 'html2canvas';

type Tab = 'general' | 'menu' | 'printer' | 'invoices';

const Settings: React.FC = () => {
  const { 
    tables, updateTableCount, 
    products, categories, addProduct, updateProduct, deleteProduct,
    orders,
    printerConfig, updatePrinterConfig
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('printer');
  
  // --- General Settings State ---
  const [tableCount, setTableCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // --- Menu Settings State ---
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({ variants: [] });

  // --- Printer Settings State ---
  const [currentPrinter, setCurrentPrinter] = useState(printerConfig);
  const [isScanning, setIsScanning] = useState(false);

  // --- Invoices Settings State ---
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printType, setPrintType] = useState<'receipt' | 'kitchen'>('receipt');
  
  // Image Saving State
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load initial values
  useEffect(() => {
    setTableCount(tables.length);
  }, [tables]);

  useEffect(() => {
    setCurrentPrinter(printerConfig);
  }, [printerConfig]);

  // --- General Logic ---
  const handleSaveGeneral = () => {
    updateTableCount(tableCount);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // --- Menu Logic ---
  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setIsEditingProduct(true);
  };

  const handleCreateProduct = () => {
    setCurrentProduct({
        id: crypto.randomUUID(),
        name: '',
        categoryId: categories[0]?.id || '',
        image: 'https://picsum.photos/200/200',
        isActive: true,
        variants: [{ id: crypto.randomUUID(), name: 'افتراضي', price: 0, cost: 0 }]
    });
    setIsEditingProduct(true);
  };

  const handleSaveProduct = () => {
    if (!currentProduct.name || !currentProduct.variants?.length) return;
    
    if (products.find(p => p.id === currentProduct.id)) {
        updateProduct(currentProduct as Product);
    } else {
        addProduct(currentProduct as Product);
    }
    setIsEditingProduct(false);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    if (!currentProduct.variants) return;
    const newVariants = [...currentProduct.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setCurrentProduct({ ...currentProduct, variants: newVariants });
  };

  const addVariant = () => {
    if (!currentProduct.variants) return;
    setCurrentProduct({
        ...currentProduct,
        variants: [...currentProduct.variants, { id: crypto.randomUUID(), name: '', price: 0, cost: 0 }]
    });
  };

  const removeVariant = (index: number) => {
     if (!currentProduct.variants || currentProduct.variants.length <= 1) return;
     const newVariants = currentProduct.variants.filter((_, i) => i !== index);
     setCurrentProduct({ ...currentProduct, variants: newVariants });
  };

  // --- Printer Logic ---
  const handleSavePrinter = () => {
    updatePrinterConfig(currentPrinter);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const scanForPrinters = () => {
    setIsScanning(true);
    setTimeout(() => {
        setIsScanning(false);
        // Simulate finding a device
        setCurrentPrinter(prev => ({ ...prev, target: 'POS_PRINTER_01' }));
    }, 2000);
  };

  // --- Invoices Logic ---
  const completedOrders = orders.filter(o => o.status !== 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // --- Download Receipt Image ---
  const handleDownloadReceipt = async () => {
    if (!receiptRef.current || !selectedOrder) return;
    
    setIsDownloading(true);
    try {
        const canvas = await html2canvas(receiptRef.current, {
            scale: 2, // High resolution
            backgroundColor: '#ffffff',
            useCORS: true
        });
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `فاتورة_${selectedOrder.orderNumber}_${new Date().toISOString().slice(0,10)}.png`;
        link.click();
    } catch (error) {
        console.error("Error saving image:", error);
        alert("حدث خطأ أثناء حفظ الصورة");
    } finally {
        setIsDownloading(false);
    }
  };

  const renderTabs = () => (
    <div className="w-full overflow-x-auto pb-2 mb-4 md:mb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-max md:w-fit print:hidden">
            <button 
                onClick={() => setActiveTab('invoices')}
                className={`px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-all ${activeTab === 'invoices' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                أرشيف الفواتير
            </button>
            <button 
                onClick={() => setActiveTab('menu')}
                className={`px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-all ${activeTab === 'menu' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                إدارة المنتجات
            </button>
            <button 
                onClick={() => setActiveTab('printer')}
                className={`px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-all ${activeTab === 'printer' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                إعدادات الطابعة
            </button>
            <button 
                onClick={() => setActiveTab('general')}
                className={`px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-all ${activeTab === 'general' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                إعدادات الصالة
            </button>
        </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto pb-20 md:pb-0">
        {/* Printable Area for Archive (Hidden but used for browser print function) */}
        {selectedOrder && (
            <div id="printable-area" className="hidden print:block p-2" dir="rtl" style={{ width: printerConfig.paperSize === '58mm' ? '58mm' : 'auto' }}>
                <div className="text-center font-bold border-b-2 border-dashed border-black pb-4 mb-4">
                    {printType === 'kitchen' ? (
                        <h1 className="text-3xl mb-2">🧑‍🍳 تذكرة مطبخ (نسخة)</h1>
                    ) : (
                         <>
                            <h1 className="text-2xl mb-1">كباب الديرة</h1>
                            <p className="text-sm">فاتورة ضريبية (نسخة أرشيف)</p>
                        </>
                    )}
                    <div className="flex justify-between text-lg mt-2">
                        <span>طلب #{selectedOrder.orderNumber}</span>
                        <span>{selectedOrder.type === 'dine-in' ? `طاولة ${selectedOrder.tableId?.replace('t','')}` : 'سفري'}</span>
                    </div>
                    <div className="text-sm text-left mt-1">{new Date(selectedOrder.createdAt).toLocaleString('ar-SA')}</div>
                </div>
                
                <div className="w-full">
                    {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-gray-200">
                            <div className="flex-1">
                                <span className="text-xl font-bold">{item.quantity}x {item.productName}</span>
                                <div className="text-sm text-gray-600">{item.variantName}</div>
                            </div>
                            {printType === 'receipt' && (
                                <div className="text-lg font-bold">{(item.price * item.quantity).toFixed(2)}</div>
                            )}
                        </div>
                    ))}
                </div>

                {printType === 'receipt' && (
                    <div className="mt-4 border-t-2 border-black pt-2">
                        <div className="flex justify-between text-lg">
                            <span>المجموع</span>
                            <span>{selectedOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                            <span>الضريبة (15%)</span>
                            <span>{selectedOrder.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold mt-2">
                            <span>الإجمالي</span>
                            <span>{selectedOrder.total.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>
        )}

        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2 print:hidden">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <SettingsIcon size={24} />
            </div>
            لوحة التحكم والإعدادات
        </h2>

        {renderTabs()}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden print:overflow-visible">
            
            {/* --- INVOICES TAB --- */}
            {activeTab === 'invoices' && (
                <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50 print:hidden">
                        <h3 className="font-bold text-gray-700 text-sm md:text-base">سجل الفواتير المكتملة</h3>
                        <span className="text-xs md:text-sm text-gray-500">العدد: {completedOrders.length}</span>
                    </div>
                    <div className="flex-1 overflow-auto p-3 md:p-4 print:hidden">
                        
                        {/* Mobile View: Cards */}
                        <div className="md:hidden space-y-3">
                            {completedOrders.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">لا توجد فواتير</div>
                            ) : (
                                completedOrders.map(order => (
                                    <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-800 flex items-center gap-1">
                                                <FileText size={14} className="text-gray-400"/> #{order.orderNumber}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] ${order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {order.status === 'cancelled' ? 'ملغي' : 'مكتمل'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                                            <span>{new Date(order.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-50">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400">الإجمالي</span>
                                                <span className="font-bold text-emerald-600">{order.total.toFixed(2)} د.ع</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-[10px] ${order.type === 'dine-in' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {order.type === 'dine-in' ? 'محلي' : 'سفري'}
                                                </span>
                                                <button 
                                                    onClick={() => { setSelectedOrder(order); setPrintType('receipt'); }}
                                                    className="p-1.5 bg-gray-100 rounded-lg text-gray-600"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop View: Table */}
                        <table className="w-full text-right hidden md:table">
                            <thead className="text-sm text-gray-500 bg-gray-50">
                                <tr>
                                    <th className="p-3 rounded-r-lg">رقم الطلب</th>
                                    <th className="p-3">التاريخ</th>
                                    <th className="p-3">النوع</th>
                                    <th className="p-3">الإجمالي</th>
                                    <th className="p-3">الحالة</th>
                                    <th className="p-3 rounded-l-lg">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedOrders.map(order => (
                                    <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-bold">#{order.orderNumber}</td>
                                        <td className="p-3 text-sm">{new Date(order.createdAt).toLocaleString('ar-SA')}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${order.type === 'dine-in' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {order.type === 'dine-in' ? 'محلي' : 'سفري'}
                                            </span>
                                        </td>
                                        <td className="p-3 font-bold text-primary">{order.total.toFixed(2)} د.ع</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs ${order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {order.status === 'cancelled' ? 'ملغي' : 'مكتمل'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button 
                                                onClick={() => { setSelectedOrder(order); setPrintType('receipt'); }}
                                                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                                                title="عرض وطباعة"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MENU TAB --- */}
            {activeTab === 'menu' && (
                <div className="h-full flex flex-col gap-4 overflow-y-auto pb-6">
                    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                        <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-700 text-sm md:text-base">قائمة المنتجات</h3>
                                <button 
                                    onClick={handleCreateProduct}
                                    className="bg-primary text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors text-xs md:text-sm"
                                >
                                    <Plus size={16} />
                                    منتج جديد
                                </button>
                        </div>
                        {isEditingProduct ? (
                            <div className="bg-gray-50 p-4 md:p-6 rounded-2xl border border-gray-200">
                                <h4 className="font-bold mb-4 border-b pb-2 text-gray-700">بيانات المنتج</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 mb-1">الاسم</label>
                                        <input className="w-full p-2 border rounded bg-white" value={currentProduct.name} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 mb-1">القسم</label>
                                        <select className="w-full p-2 border rounded bg-white" value={currentProduct.categoryId} onChange={e => setCurrentProduct({...currentProduct, categoryId: e.target.value})}>
                                            <option value="" disabled>اختر القسم</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-bold text-gray-600">المتغيرات (الأسعار والتكاليف)</label>
                                        <button onClick={addVariant} className="text-xs text-primary font-bold flex items-center gap-1">
                                            <Plus size={14} /> إضافة خيار
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {/* Header Row */}
                                        <div className="flex gap-2 text-xs text-gray-400 px-1">
                                            <span className="flex-1">الاسم (حجم/نوع)</span>
                                            <span className="w-20">السعر</span>
                                            <span className="w-20">التكلفة</span>
                                            <span className="w-6"></span>
                                        </div>
                                        
                                        {currentProduct.variants?.map((v, idx) => (
                                            <div key={v.id} className="flex gap-2 items-center">
                                                <input 
                                                    placeholder="النوع" 
                                                    className="flex-1 p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-primary outline-none" 
                                                    value={v.name} 
                                                    onChange={e => updateVariant(idx, 'name', e.target.value)} 
                                                />
                                                <input 
                                                    type="number" 
                                                    placeholder="سعر" 
                                                    className="w-20 p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-primary outline-none" 
                                                    value={v.price} 
                                                    onChange={e => updateVariant(idx, 'price', Number(e.target.value))} 
                                                />
                                                <input 
                                                    type="number" 
                                                    placeholder="تكلفة" 
                                                    className="w-20 p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-primary outline-none" 
                                                    value={v.cost ?? 0} 
                                                    onChange={e => updateVariant(idx, 'cost', Number(e.target.value))} 
                                                />
                                                <button 
                                                    onClick={() => removeVariant(idx)} 
                                                    className="text-red-400 hover:text-red-600 p-1"
                                                    title="حذف"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsEditingProduct(false)} className="px-4 py-2 text-gray-500">إلغاء</button>
                                    <button onClick={handleSaveProduct} className="px-4 py-2 bg-primary text-white rounded font-bold">حفظ</button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-4 max-h-[500px]">
                                {products.map(product => (
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2 group relative hover:border-primary transition-colors">
                                        <div className="absolute top-2 left-2 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm z-10 border border-gray-100">
                                            <button onClick={() => handleEditProduct(product)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={16} /></button>
                                            <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                                                <UtensilsCrossed size={20} />
                                            </div>
                                            <div className="overflow-hidden">
                                                 <h4 className="font-bold text-gray-800 text-sm truncate">{product.name}</h4>
                                                 <span className="text-xs text-gray-500">{categories.find(c => c.id === product.categoryId)?.name}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {product.variants.map(v => (
                                                <span key={v.id} className="text-[10px] bg-gray-50 border px-1 rounded text-gray-600">{v.name}: {v.price}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- PRINTER TAB --- */}
            {activeTab === 'printer' && (
                <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto w-full">
                    <h3 className="text-lg font-bold text-gray-700 mb-6 border-b pb-4 flex items-center gap-2">
                        <Printer size={24} className="text-primary" />
                        إعدادات الطابعة والاقتران
                    </h3>

                    <div className="space-y-6">
                        {/* Connection Type */}
                        <div>
                            <label className="block text-gray-600 font-bold mb-3">نوع الاتصال</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                <button 
                                    onClick={() => setCurrentPrinter({...currentPrinter, type: 'wifi'})}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 transition-all ${currentPrinter.type === 'wifi' ? 'border-primary bg-emerald-50 text-primary' : 'border-gray-100 text-gray-500'}`}
                                >
                                    <Wifi size={24} />
                                    <span>WiFi</span>
                                </button>
                                <button 
                                    onClick={() => setCurrentPrinter({...currentPrinter, type: 'bluetooth'})}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 transition-all ${currentPrinter.type === 'bluetooth' ? 'border-primary bg-emerald-50 text-primary' : 'border-gray-100 text-gray-500'}`}
                                >
                                    <Bluetooth size={24} />
                                    <span>Bluetooth</span>
                                </button>
                                <button 
                                    onClick={() => setCurrentPrinter({...currentPrinter, type: 'usb'})}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 transition-all ${currentPrinter.type === 'usb' ? 'border-primary bg-emerald-50 text-primary' : 'border-gray-100 text-gray-500'}`}
                                >
                                    <Usb size={24} />
                                    <span>USB</span>
                                </button>
                            </div>
                        </div>

                        {/* Paper Size */}
                        <div>
                            <label className="block text-gray-600 font-bold mb-3">حجم الورق</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="paperSize" 
                                        checked={currentPrinter.paperSize === '80mm'} 
                                        onChange={() => setCurrentPrinter({...currentPrinter, paperSize: '80mm'})}
                                        className="w-5 h-5 text-primary focus:ring-primary"
                                    />
                                    <span className="text-gray-700">80mm (قياسي)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="paperSize" 
                                        checked={currentPrinter.paperSize === '58mm'} 
                                        onChange={() => setCurrentPrinter({...currentPrinter, paperSize: '58mm'})}
                                        className="w-5 h-5 text-primary focus:ring-primary"
                                    />
                                    <span className="text-gray-700">58mm (صغير)</span>
                                </label>
                            </div>
                        </div>

                        {/* Pairing / Scanning */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <label className="block text-gray-600 font-bold mb-2">الجهاز المقترن</label>
                             <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                    type="text" 
                                    placeholder="IP Address or Device Name"
                                    className="flex-1 p-3 border rounded-lg bg-white outline-none"
                                    value={currentPrinter.target}
                                    onChange={(e) => setCurrentPrinter({...currentPrinter, target: e.target.value})}
                                />
                                <button 
                                    onClick={scanForPrinters}
                                    className="bg-gray-800 text-white px-4 py-3 sm:py-0 rounded-lg flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50"
                                    disabled={isScanning}
                                >
                                    {isScanning ? <RotateCcw className="animate-spin" size={20} /> : <Smartphone size={20} />}
                                    {isScanning ? 'بحث...' : 'بحث / اقتران'}
                                </button>
                             </div>
                             <p className="text-xs text-gray-400 mt-2">في حالة البلوتوث، تأكد من أن الطابعة في وضع الاقتران.</p>
                        </div>

                        {/* Auto Print Config */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <h4 className="font-bold text-gray-700 mb-3">خيارات الطباعة التلقائية</h4>
                             <div className="space-y-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-600">طباعة الفاتورة عند الدفع</span>
                                    <div 
                                        onClick={() => setCurrentPrinter({...currentPrinter, autoPrintReceipt: !currentPrinter.autoPrintReceipt})}
                                        className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${currentPrinter.autoPrintReceipt ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
                                    >
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </div>
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-gray-600">طباعة تذكرة مطبخ عند الطلب</span>
                                    <div 
                                        onClick={() => setCurrentPrinter({...currentPrinter, autoPrintKitchen: !currentPrinter.autoPrintKitchen})}
                                        className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${currentPrinter.autoPrintKitchen ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
                                    >
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </div>
                                </label>
                             </div>
                        </div>
                        
                        <button 
                            onClick={handleSavePrinter}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                isSaved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-emerald-600'
                            }`}
                        >
                            {isSaved ? <span>تم الحفظ بنجاح</span> : <><Save size={20} /> حفظ الإعدادات</>}
                        </button>
                    </div>
                </div>
            )}

            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
                <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto w-full">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">إعدادات الصالة</h3>
                    <div className="mb-6">
                        <label className="block text-gray-600 font-bold mb-2">عدد الطاولات في الصالة</label>
                        <div className="flex gap-4 items-center">
                            <input 
                                type="number" 
                                min="1"
                                max="100"
                                className="flex-1 p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary font-bold text-lg"
                                value={tableCount}
                                onChange={(e) => setTableCount(Number(e.target.value))}
                            />
                            <div className="text-sm text-gray-400">طاولة</div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            ملاحظة: تقليل العدد سيؤدي إلى حذف الطاولات الأخيرة من النظام.
                        </p>
                    </div>

                    <button 
                        onClick={handleSaveGeneral}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            isSaved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-emerald-600'
                        }`}
                    >
                        {isSaved ? <span>تم الحفظ بنجاح</span> : <><Save size={20} /> حفظ الإعدادات</>}
                    </button>
                </div>
            )}
        </div>

        {/* --- RECEIPT MODAL & PRINT VIEW --- */}
        {selectedOrder && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
                    {/* Modal Header - Hidden on Print */}
                    <div className="bg-gray-50 p-4 border-b flex justify-between items-center print:hidden">
                        <h3 className="font-bold text-gray-800">تفاصيل الفاتورة</h3>
                        <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600"><SettingsIcon size={20} className="rotate-45" /></button>
                    </div>
                    
                    {/* Receipt Content (Visual for capture) */}
                    <div className="p-6 text-center bg-white" ref={receiptRef}>
                        <div className="mb-4">
                            <div className="flex justify-center items-center gap-2 mb-2">
                                <ChefHat size={32} className="text-black" />
                                <h1 className="text-2xl font-bold text-black">كباب الديرة</h1>
                            </div>
                            <p className="text-sm text-gray-500">طريق الملك فهد، الرياض</p>
                        </div>
                        
                        <div className="border-t border-b border-dashed border-gray-300 py-2 my-2 text-sm flex justify-between">
                            <span>طلب #{selectedOrder.orderNumber}</span>
                            <span>{new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                        
                        <div className="space-y-2 mb-4 text-right">
                            {selectedOrder.items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.quantity}x {item.productName} <small>({item.variantName})</small></span>
                                    <span className="font-bold">{item.price * item.quantity}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="border-t border-gray-300 pt-2 space-y-1">
                            <div className="flex justify-between text-xl font-bold mt-2">
                                <span>الإجمالي</span>
                                <span>{selectedOrder.total.toFixed(2)} د.ع</span>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer - Actions */}
                    <div className="p-4 bg-gray-50 border-t grid grid-cols-2 gap-3 print:hidden">
                        <button 
                            onClick={() => { setPrintType('kitchen'); setTimeout(window.print, 100); }}
                            className="bg-orange-500 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-orange-600"
                        >
                            <ChefHat size={18} /> للمطبخ
                        </button>
                        <button 
                            onClick={() => { setPrintType('receipt'); setTimeout(window.print, 100); }}
                            className="bg-black text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800"
                        >
                            <Printer size={18} /> طباعة
                        </button>
                         <button 
                            onClick={handleDownloadReceipt}
                            disabled={isDownloading}
                            className="bg-emerald-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            حفظ صورة
                        </button>
                        <button 
                            onClick={() => setSelectedOrder(null)}
                            className="border border-gray-300 rounded-lg font-bold hover:bg-gray-100"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Settings;