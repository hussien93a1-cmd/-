import { Category, Product, Table, User } from './types';

export const TAX_RATE = 0.0; // Taxes might differ in Iraq, set to 0 or adjust as needed

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'مشويات' },
  { id: 'cat2', name: 'وجبات غربية' },
  { id: 'cat3', name: 'مقبلات' },
  { id: 'cat4', name: 'مشروبات' },
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  name: `طاولة ${i + 1}`,
  capacity: 4,
  status: 'available',
}));

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'أحمد الكاشير',
  role: 'admin',
};