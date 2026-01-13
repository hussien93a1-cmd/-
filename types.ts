
export type OrderType = 'dine-in' | 'takeaway';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type TableStatus = 'available' | 'occupied';
export type PaymentMethod = 'cash' | 'card' | 'credit';

export interface PrinterConfig {
  type: 'wifi' | 'bluetooth' | 'usb';
  paperSize: '58mm' | '80mm';
  target: string; // IP address or Device Name
  autoPrintReceipt: boolean;
  autoPrintKitchen: boolean;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
  cost: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  image: string;
  variants: Variant[];
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface CartItem {
  id: string; // unique cart item id
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  price: number;
  cost: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  type: OrderType;
  tableId?: string; // Only for dine-in
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  totalCost: number; // For profit calculation
  createdAt: string; // ISO date
  paymentMethod?: PaymentMethod;
  customerName?: string; // For takeaway
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salaryType: 'monthly' | 'daily';
  baseSalary: number;
  joinDate: string;
}

export interface WorkLog {
  id: string;
  employeeId: string;
  date: string;
  amount: number; // Value added to employee balance (e.g., 1 day salary)
  description: string; // "Attendance: 2023-10-25" or "Month Salary: Oct"
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  // Updated categories to include specific payroll types
  category: 'salary' | 'utilities' | 'supplies' | 'maintenance' | 'other' | 'withdrawal' | 'deduction' | 'bonus'; 
  date: string;
  employeeId?: string; // Link to employee if it's a payroll expense
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'cashier';
}
