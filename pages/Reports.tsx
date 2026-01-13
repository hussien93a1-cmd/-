import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  TrendingUp, Download, ArrowUpRight, ArrowDownRight, Share2, Loader2, ListFilter, Box
} from 'lucide-react';
import html2canvas from 'html2canvas';

type DateFilter = 'today' | 'week' | 'month' | 'year' | 'custom';
type ReportViewMode = 'variants' | 'general';

const Reports: React.FC = () => {
  const { orders } = useStore();
  const reportRef = useRef<HTMLDivElement>(null);

  // --- State for Filters ---
  const [filterType, setFilterType] = useState<DateFilter>('today');
  const [viewMode, setViewMode] = useState<ReportViewMode>('variants'); // New State
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // --- Helper: Check if date is within range ---
  const isWithinRange = (dateString: string, start: Date, end: Date) => {
    const d = new Date(dateString);
    return d >= start && d <= end;
  };

  // --- 1. Filter Data Engine ---
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    
    // Set Time Range
    switch (filterType) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            // Last 7 days
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            end = now;
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            end = now;
            break;
        case 'custom':
            if (customStartDate && customEndDate) {
                start = new Date(customStartDate);
                start.setHours(0,0,0,0);
                end = new Date(customEndDate);
                end.setHours(23,59,59,999);
            }
            break;
    }

    // Filter Orders (Completed only)
    return orders.filter(o => 
        o.status === 'completed' && isWithinRange(o.createdAt, start, end)
    );
  }, [orders, filterType, customStartDate, customEndDate]);


  // --- 4. Product Performance Analysis (Calculated based on View Mode) ---
  const productPerformance = useMemo(() => {
      const stats: Record<string, {
          id: string; // Product ID (or ProductId-VariantId)
          name: string;
          variant: string;
          qty: number;
          revenue: number;
          cost: number;
          profit: number;
      }> = {};

      filteredOrders.forEach(order => {
          order.items.forEach(item => {
              // KEY LOGIC: If General, group by productId only. If Variants, group by composite key.
              const key = viewMode === 'general' 
                  ? item.productId 
                  : `${item.productId}-${item.variantId}`;
              
              if (!stats[key]) {
                  stats[key] = {
                      id: item.productId,
                      name: item.productName,
                      variant: viewMode === 'general' ? 'الكل' : item.variantName, // Placeholder for general
                      qty: 0,
                      revenue: 0,
                      cost: 0,
                      profit: 0
                  };
              }

              const itemRevenue = item.price * item.quantity;
              const itemCost = item.cost * item.quantity;

              stats[key].qty += item.quantity;
              stats[key].revenue += itemRevenue;
              stats[key].cost += itemCost;
              stats[key].profit += (itemRevenue - itemCost);
          });
      });

      // Convert to array and sort by Revenue descending (Best Sellers)
      return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, viewMode]);

  // --- WhatsApp Share Function ---
  const handleShareWhatsApp = async () => {
    if (!reportRef.current) return;
    
    setIsGeneratingImage(true);
    
    try {
        // 1. Capture the report section as an image
        const canvas = await html2canvas(reportRef.current, {
            scale: 2, // Better resolution
            backgroundColor: '#ffffff',
            useCORS: true
        });
        
        const image = canvas.toDataURL("image/png");

        // 2. Download the image to the user's device
        const link = document.createElement('a');
        link.href = image;
        link.download = `تقرير_المبيعات_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.png`;
        link.click();

        // 3. Open WhatsApp Web to the specific number
        const phoneNumber = "9647735311855"; // Iraq code +964
        const reportTitle = viewMode === 'general' ? 'حسب المنتج (عام)' : 'حسب المنتج (تفصيلي)';
        const message = encodeURIComponent(`السلام عليكم،\n\nمرفق تقرير المبيعات - ${reportTitle}\nللفترة (${filterType === 'today' ? 'اليوم' : filterType === 'week' ? 'أسبوعي' : 'فترة محددة'}).\n\n*ملاحظة:* يرجى إرفاق صورة التقرير التي تم تحميلها للتو.`);
        
        // Short delay to allow download to start before tab switch
        setTimeout(() => {
            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
            setIsGeneratingImage(false);
        }, 1000);

    } catch (error) {
        console.error("Error generating report image:", error);
        alert("حدث خطأ أثناء إنشاء الصورة. يرجى المحاولة مرة أخرى.");
        setIsGeneratingImage(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50/50 pb-20 md:pb-0">
        
        {/* Header & Filters */}
        <div className="flex flex-col gap-4 mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-primary" />
                التقارير
            </h2>
            
            {/* Filter Group */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Time Filters */}
                <div className="overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 w-max md:w-fit">
                        {(['today', 'week', 'month', 'year', 'custom'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                                    filterType === type 
                                    ? 'bg-slate-800 text-white shadow-md' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                {type === 'today' && 'اليوم'}
                                {type === 'week' && 'أسبوعي'}
                                {type === 'month' && 'شهري'}
                                {type === 'year' && 'سنوي'}
                                {type === 'custom' && 'مخصص'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button 
                        onClick={() => setViewMode('variants')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'variants' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <ListFilter size={14} />
                        تفصيلي (المتغيرات)
                    </button>
                    <button 
                        onClick={() => setViewMode('general')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'general' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Box size={14} />
                        عام (المنتجات)
                    </button>
                </div>
            </div>
        </div>

        {/* Custom Date Range Picker */}
        {filterType === 'custom' && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row items-end gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="w-full md:w-auto">
                    <label className="block text-xs font-bold text-gray-500 mb-1">من تاريخ</label>
                    <input 
                        type="date" 
                        value={customStartDate} 
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-gray-50 text-sm"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <label className="block text-xs font-bold text-gray-500 mb-1">إلى تاريخ</label>
                    <input 
                        type="date" 
                        value={customEndDate} 
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-gray-50 text-sm"
                    />
                </div>
                <div className="text-xs text-gray-400 pb-2">
                    * البيانات المحصورة بين التاريخين
                </div>
            </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 pb-10">
            
            {/* Detailed Product Performance (Responsive Table) */}
            <div ref={reportRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-gray-800 text-sm md:text-base">
                            تقرير المبيعات {viewMode === 'general' ? '(حسب المنتج - عام)' : '(حسب المتغيرات - تفصيلي)'}
                        </h3>
                        <span className="text-xs text-gray-500 mt-1">
                            {new Date().toLocaleDateString('ar-SA', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                        </span>
                    </div>
                    
                    <button 
                        onClick={handleShareWhatsApp}
                        disabled={isGeneratingImage || productPerformance.length === 0}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-html2canvas-ignore // This attribute tells html2canvas to skip rendering this button in the image
                    >
                        {isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                        <span className="hidden md:inline">إرسال للواتساب</span>
                        <span className="md:hidden">إرسال</span>
                    </button>
                </div>
                
                {/* Mobile View: Cards */}
                <div className="block md:hidden bg-gray-50 p-3 space-y-3">
                    {productPerformance.length === 0 ? (
                         <div className="text-center text-gray-400 py-8">لا توجد بيانات</div>
                    ) : (
                        productPerformance.map((item, index) => {
                            const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0';
                            return (
                                <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                                            {viewMode === 'variants' && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">{item.variant}</span>
                                            )}
                                        </div>
                                        <div className="text-center bg-purple-50 px-2 py-1 rounded-lg">
                                            <div className="text-[10px] text-purple-600 font-bold">الكمية</div>
                                            <div className="font-bold text-purple-700">{item.qty}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t border-gray-50">
                                        <div>
                                            <span className="text-xs text-gray-400 block">المبيعات</span>
                                            <span className="text-emerald-600 font-bold">{item.revenue.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 block">الربح</span>
                                            <span className="text-blue-600 font-bold">{item.profit.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                        <span className="text-xs text-gray-500">هامش الربح</span>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-xs font-bold ${Number(margin) > 20 ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {margin}%
                                            </span>
                                            {Number(margin) > 0 ? <ArrowUpRight size={14} className="text-green-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop/Tablet View: Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right bg-white">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b">
                            <tr>
                                <th className="p-4">المنتج</th>
                                {viewMode === 'variants' && <th className="p-4">المتغير</th>}
                                <th className="p-4">الكمية</th>
                                <th className="p-4 text-emerald-600">المبيعات</th>
                                <th className="p-4 text-orange-500">التكلفة</th>
                                <th className="p-4 text-blue-600">الربح</th>
                                <th className="p-4">الهامش %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {productPerformance.length === 0 ? (
                                <tr>
                                    <td colSpan={viewMode === 'variants' ? 7 : 6} className="p-8 text-center text-gray-400">لا توجد بيانات للفترة المحددة</td>
                                </tr>
                            ) : (
                                productPerformance.map((item, index) => {
                                    const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0';
                                    return (
                                        <tr key={index} className="hover:bg-gray-50/80 transition-colors text-sm">
                                            <td className="p-4 font-bold text-gray-700">{item.name}</td>
                                            {viewMode === 'variants' && (
                                                <td className="p-4">
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{item.variant}</span>
                                                </td>
                                            )}
                                            <td className="p-4 font-bold">{item.qty}</td>
                                            <td className="p-4 text-emerald-600 font-bold">{item.revenue.toLocaleString()}</td>
                                            <td className="p-4 text-orange-500">{item.cost.toLocaleString()}</td>
                                            <td className="p-4 text-blue-600 font-bold">{item.profit.toLocaleString()}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1">
                                                    <span className={`text-xs font-bold ${Number(margin) > 20 ? 'text-green-500' : 'text-yellow-500'}`}>
                                                        {margin}%
                                                    </span>
                                                    {Number(margin) > 0 ? <ArrowUpRight size={14} className="text-green-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {productPerformance.length > 0 && (
                            <tfoot className="bg-gray-100 font-bold text-gray-800 text-sm border-t-2 border-gray-200">
                                <tr>
                                    <td className="p-4" colSpan={viewMode === 'variants' ? 2 : 1}>الإجمالي النهائي</td>
                                    <td className="p-4">{productPerformance.reduce((a,b) => a + b.qty, 0)}</td>
                                    <td className="p-4 text-emerald-600">{productPerformance.reduce((a,b) => a + b.revenue, 0).toLocaleString()}</td>
                                    <td className="p-4 text-orange-500">{productPerformance.reduce((a,b) => a + b.cost, 0).toLocaleString()}</td>
                                    <td className="p-4 text-blue-600">{productPerformance.reduce((a,b) => a + b.profit, 0).toLocaleString()}</td>
                                    <td className="p-4"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

        </div>
    </div>
  );
};

export default Reports;