import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Product, Category, Table, Order, Expense, Employee, WorkLog,
  CartItem, OrderType, PaymentMethod, User, Variant, PrinterConfig 
} from '../types';
import { 
  INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_TABLES, 
  TAX_RATE, CURRENT_USER 
} from '../constants';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  tables: Table[];
  orders: Order[];
  expenses: Expense[];
  employees: Employee[];
  workLogs: WorkLog[]; // New
  currentOrder: Order | null;
  currentUser: User;
  printerConfig: PrinterConfig;
  
  // Cart Actions
  startNewOrder: (type: OrderType, tableId?: string) => void;
  addToCart: (product: Product, variant: Variant, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Order Actions
  saveOrder: (asPending?: boolean) => void;
  checkoutOrder: (paymentMethod: PaymentMethod) => void;
  openExistingOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  
  // Management Actions
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  
  // Employee Actions
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  addWorkLog: (log: WorkLog) => void; // New
  deleteWorkLog: (id: string) => void; // New

  // Settings Actions
  updateTableCount: (count: number) => void;
  updatePrinterConfig: (config: PrinterConfig) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]); // New
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    type: 'bluetooth',
    paperSize: '80mm',
    target: '',
    autoPrintReceipt: true,
    autoPrintKitchen: true
  });

  // Load from LocalStorage on mount
  useEffect(() => {
    const storedOrders = localStorage.getItem('pos_orders');
    const storedTables = localStorage.getItem('pos_tables');
    const storedProducts = localStorage.getItem('pos_products');
    const storedCategories = localStorage.getItem('pos_categories');
    const storedExpenses = localStorage.getItem('pos_expenses');
    const storedEmployees = localStorage.getItem('pos_employees');
    const storedWorkLogs = localStorage.getItem('pos_worklogs');
    const storedPrinter = localStorage.getItem('pos_printer');

    if (storedOrders) setOrders(JSON.parse(storedOrders));
    if (storedTables) setTables(JSON.parse(storedTables));
    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedCategories) setCategories(JSON.parse(storedCategories));
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
    if (storedWorkLogs) setWorkLogs(JSON.parse(storedWorkLogs));
    if (storedPrinter) setPrinterConfig(JSON.parse(storedPrinter));
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('pos_orders', JSON.stringify(orders));
    localStorage.setItem('pos_tables', JSON.stringify(tables));
    localStorage.setItem('pos_products', JSON.stringify(products));
    localStorage.setItem('pos_categories', JSON.stringify(categories));
    localStorage.setItem('pos_expenses', JSON.stringify(expenses));
    localStorage.setItem('pos_employees', JSON.stringify(employees));
    localStorage.setItem('pos_worklogs', JSON.stringify(workLogs));
    localStorage.setItem('pos_printer', JSON.stringify(printerConfig));
  }, [orders, tables, products, categories, expenses, employees, workLogs, printerConfig]);

  // --- Cart / Order Logic ---

  const startNewOrder = (type: OrderType, tableId?: string) => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber: orders.length + 1,
      type,
      tableId,
      status: 'pending',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      totalCost: 0,
      createdAt: new Date().toISOString(),
    };
    setCurrentOrder(newOrder);
  };

  const calculateTotals = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCost = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { subtotal, tax, total, totalCost };
  };

  const addToCart = (product: Product, variant: Variant, quantity = 1) => {
    if (!currentOrder) {
        // If no active order, create a temporary takeaway one
        const tempOrder: Order = {
            id: crypto.randomUUID(),
            orderNumber: orders.length + 1,
            type: 'takeaway',
            status: 'pending',
            items: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            totalCost: 0,
            createdAt: new Date().toISOString(),
        };
        
        const newItem: CartItem = {
            id: crypto.randomUUID(),
            productId: product.id,
            productName: product.name,
            variantId: variant.id,
            variantName: variant.name,
            price: variant.price,
            cost: variant.cost,
            quantity
        };
        
        const updatedItems = [newItem];
        const totals = calculateTotals(updatedItems);
        
        setCurrentOrder({
            ...tempOrder,
            items: updatedItems,
            ...totals
        });
        return;
    }

    // Always add a new item instead of merging
    let updatedItems = [...currentOrder.items];
    updatedItems.push({
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantName: variant.name,
      price: variant.price,
      cost: variant.cost,
      quantity
    });

    const totals = calculateTotals(updatedItems);
    setCurrentOrder({ ...currentOrder, items: updatedItems, ...totals });
  };

  const removeFromCart = (itemId: string) => {
    if (!currentOrder) return;
    const updatedItems = currentOrder.items.filter(item => item.id !== itemId);
    const totals = calculateTotals(updatedItems);
    setCurrentOrder({ ...currentOrder, items: updatedItems, ...totals });
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (!currentOrder || quantity < 1) return;
    const updatedItems = currentOrder.items.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    const totals = calculateTotals(updatedItems);
    setCurrentOrder({ ...currentOrder, items: updatedItems, ...totals });
  };

  const clearCart = () => {
    if (currentOrder) {
      setCurrentOrder({ 
        ...currentOrder, 
        items: [], 
        subtotal: 0, 
        tax: 0, 
        total: 0, 
        totalCost: 0 
      });
    }
  };

  const saveOrder = (asPending = true) => {
    if (!currentOrder) return;

    const existingOrderIndex = orders.findIndex(o => o.id === currentOrder.id);
    let newOrders = [...orders];

    if (existingOrderIndex > -1) {
      newOrders[existingOrderIndex] = { ...currentOrder, status: asPending ? 'pending' : 'completed' };
    } else {
      newOrders.push({ ...currentOrder, status: asPending ? 'pending' : 'completed' });
    }

    setOrders(newOrders);

    // Update table status if dine-in
    if (currentOrder.type === 'dine-in' && currentOrder.tableId) {
      setTables(prev => prev.map(t => 
        t.id === currentOrder.tableId 
          ? { ...t, status: 'occupied', currentOrderId: currentOrder.id }
          : t
      ));
    }

    if (asPending) {
      setCurrentOrder(null); // Clear active screen, but keep in background
    }
  };

  const checkoutOrder = (paymentMethod: PaymentMethod) => {
    if (!currentOrder) return;
    
    const completedOrder: Order = {
      ...currentOrder,
      status: 'completed',
      paymentMethod,
    };

    const existingOrderIndex = orders.findIndex(o => o.id === completedOrder.id);
    let newOrders = [...orders];

    if (existingOrderIndex > -1) {
      newOrders[existingOrderIndex] = completedOrder;
    } else {
      newOrders.push(completedOrder);
    }
    setOrders(newOrders);

    // Free up table if dine-in
    if (currentOrder.type === 'dine-in' && currentOrder.tableId) {
      setTables(prev => prev.map(t => 
        t.id === currentOrder.tableId 
          ? { ...t, status: 'available', currentOrderId: undefined }
          : t
      ));
    }

    setCurrentOrder(null);
  };

  const openExistingOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.status === 'pending') {
      setCurrentOrder(order);
    }
  };

  const cancelOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Update Order Status
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));

    // If active, clear
    if (currentOrder?.id === orderId) {
      setCurrentOrder(null);
    }

    // Free table
    if (order.type === 'dine-in' && order.tableId) {
      setTables(prev => prev.map(t => 
        t.id === order.tableId 
          ? { ...t, status: 'available', currentOrderId: undefined }
          : t
      ));
    }
  };

  // --- Management ---
  const addProduct = (product: Product) => {
    setProducts([...products, product]);
  };

  const updateProduct = (product: Product) => {
    setProducts(products.map(p => p.id === product.id ? product : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const addCategory = (name: string) => {
    setCategories([...categories, { id: crypto.randomUUID(), name }]);
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const addExpense = (expense: Expense) => {
    setExpenses([...expenses, expense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  // --- Employee Management ---
  const addEmployee = (employee: Employee) => {
    setEmployees([...employees, employee]);
  };

  const updateEmployee = (employee: Employee) => {
    setEmployees(employees.map(e => e.id === employee.id ? employee : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const addWorkLog = (log: WorkLog) => {
    setWorkLogs([...workLogs, log]);
  };

  const deleteWorkLog = (id: string) => {
    setWorkLogs(workLogs.filter(w => w.id !== id));
  };

  // --- Settings ---
  const updateTableCount = (count: number) => {
    if (count < 1) return;
    
    setTables(prev => {
        if (count > prev.length) {
            // Add new tables
            const tablesToAdd = Array.from({ length: count - prev.length }, (_, i) => ({
                id: `t${prev.length + i + 1}`,
                name: `طاولة ${prev.length + i + 1}`,
                capacity: 4, // Default capacity
                status: 'available' as const
            }));
            return [...prev, ...tablesToAdd];
        } else {
            // Remove tables from the end (Truncate)
            return prev.slice(0, count);
        }
    });
  };

  const updatePrinterConfig = (config: PrinterConfig) => {
    setPrinterConfig(config);
  };

  return (
    <StoreContext.Provider value={{
      products, categories, tables, orders, expenses, employees, workLogs, currentOrder, currentUser: CURRENT_USER, printerConfig,
      startNewOrder, addToCart, removeFromCart, updateCartItemQuantity, clearCart,
      saveOrder, checkoutOrder, openExistingOrder, cancelOrder,
      addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, 
      addExpense, deleteExpense,
      addEmployee, updateEmployee, deleteEmployee, addWorkLog, deleteWorkLog,
      updateTableCount, updatePrinterConfig
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};