import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Variant } from '../types';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const Menu: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    variants: []
  });

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentProduct({
        id: crypto.randomUUID(),
        name: '',
        categoryId: categories[0].id,
        image: 'https://picsum.photos/200/200',
        isActive: true,
        variants: [{ id: crypto.randomUUID(), name: 'افتراضي', price: 0, cost: 0 }]
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!currentProduct.name || !currentProduct.variants?.length) return;
    
    if (products.find(p => p.id === currentProduct.id)) {
        updateProduct(currentProduct as Product);
    } else {
        addProduct(currentProduct as Product);
    }
    setIsEditing(false);
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

  return (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">قائمة الطعام</h2>
            <button 
                onClick={handleCreate}
                className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 transition-colors"
            >
                <Plus size={20} />
                إضافة منتج
            </button>
       </div>

       {isEditing ? (
         <div className="bg-white p-6 rounded-2xl shadow-sm max-w-4xl mx-auto w-full">
            <h3 className="text-xl font-bold mb-6 border-b pb-4">{products.find(p => p.id === currentProduct.id) ? 'تعديل منتج' : 'منتج جديد'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">اسم المنتج</label>
                    <input 
                        type="text" 
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
                        value={currentProduct.name}
                        onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">القسم</label>
                    <select 
                        className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary outline-none"
                        value={currentProduct.categoryId}
                        onChange={e => setCurrentProduct({...currentProduct, categoryId: e.target.value})}
                    >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">خيارات / أحجام المنتج</label>
                    <button onClick={addVariant} className="text-sm text-primary font-bold flex items-center gap-1">+ إضافة خيار</button>
                </div>
                <div className="space-y-3">
                    {currentProduct.variants?.map((v, idx) => (
                        <div key={v.id} className="flex gap-3 items-center">
                            <input 
                                placeholder="الاسم (مثال: نفر)" 
                                className="flex-1 p-2 border rounded bg-gray-50"
                                value={v.name}
                                onChange={e => updateVariant(idx, 'name', e.target.value)}
                            />
                            <input 
                                type="number"
                                placeholder="سعر البيع" 
                                className="w-24 p-2 border rounded bg-gray-50"
                                value={v.price}
                                onChange={e => updateVariant(idx, 'price', Number(e.target.value))}
                            />
                             <input 
                                type="number"
                                placeholder="التكلفة" 
                                className="w-24 p-2 border rounded bg-gray-50"
                                value={v.cost}
                                onChange={e => updateVariant(idx, 'cost', Number(e.target.value))}
                            />
                            <button onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100">إلغاء</button>
                <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-emerald-600">حفظ التغييرات</button>
            </div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
            {products.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3 group">
                    <div className="flex items-start justify-between">
                         <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            <img src={product.image} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(product)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Edit2 size={16} /></button>
                            <button onClick={() => deleteProduct(product.id)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"><Trash2 size={16} /></button>
                         </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">{product.name}</h4>
                        <div className="text-sm text-gray-500">{categories.find(c => c.id === product.categoryId)?.name}</div>
                    </div>
                    <div className="mt-auto pt-2 border-t border-gray-50 flex flex-wrap gap-2">
                        {product.variants.map(v => (
                            <span key={v.id} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                {v.name}: {v.price}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
         </div>
       )}
    </div>
  );
};

export default Menu;