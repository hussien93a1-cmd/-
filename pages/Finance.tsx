import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Expense, Employee, WorkLog } from '../types';
import { 
  Plus, Trash2, Users, DollarSign, Wallet, 
  ArrowDownCircle, ArrowUpCircle, X, MessageCircle, FileText, 
  TrendingDown, TrendingUp, Lock, CalendarCheck, Coins
} from 'lucide-react';

type Tab = 'expenses' | 'employees';

const Finance: React.FC = () => {
  const { 
    expenses, addExpense, deleteExpense, 
    employees, addEmployee, deleteEmployee, 
    workLogs, addWorkLog, deleteWorkLog,
    orders 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('employees');

  // Expenses State
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'supplies'
  });

  // Safe/Withdrawal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');

  // Employee State
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '', role: '', phone: '', salaryType: 'monthly', baseSalary: 0
  });

  // Payroll Action State
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [payrollAction, setPayrollAction] = useState<{type: 'salary'|'withdrawal'|'deduction'|'entitlement', amount: string, note: string}>({
    type: 'withdrawal', amount: '', note: ''
  });

  // History / Statement State
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);

  // --- Financial Calculations (SAFE BOX) ---
  const financialStats = useMemo(() => {
      // 1. Total Cash Sales
      const totalCashSales = orders
          .filter(o => o.status === 'completed' && o.paymentMethod === 'cash')
          .reduce((sum, o) => sum + o.total, 0);

      // 2. Total Actual Expenses (Leaving the drawer)
      // Exclude 'deduction' because it's a virtual money adjustment, not cash leaving the drawer.
      const actualExpenses = expenses
          .filter(e => e.category !== 'deduction') 
          .reduce((sum, e) => sum + e.amount, 0);

      // 3. Current Cash in Drawer
      const cashInHand = totalCashSales - actualExpenses;

      return { totalCashSales, totalExpenses: actualExpenses, cashInHand };
  }, [orders, expenses]);

  // --- Safe Withdrawal Logic ---
  const handleSafeWithdraw = (e: React.FormEvent) => {
      e.preventDefault();
      if (!withdrawAmount) return;
      
      addExpense({
          id: crypto.randomUUID(),
          description: withdrawNote ? `سحب من الصندوق: ${withdrawNote}` : 'سحب أرباح / إيداع',
          amount: Number(withdrawAmount),
          category: 'other',
          date: new Date().toISOString()
      });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawNote('');
  };

  // --- Expense Logic ---
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    addExpense({
      id: crypto.randomUUID(),
      description: newExpense.description,
      amount: Number(newExpense.amount),
      category: newExpense.category as any,
      date: new Date().toISOString()
    });

    setNewExpense({ description: '', amount: '', category: 'supplies' });
  };

  // --- Employee Logic ---
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.baseSalary) return;

    addEmployee({
        id: crypto.randomUUID(),
        name: newEmployee.name!,
        role: newEmployee.role || 'موظف',
        phone: newEmployee.phone || '',
        salaryType: newEmployee.salaryType as any || 'monthly',
        baseSalary: Number(newEmployee.baseSalary),
        joinDate: new Date().toISOString()
    });
    setShowAddEmployee(false);
    setNewEmployee({ name: '', role: '', phone: '', salaryType: 'monthly', baseSalary: 0 });
  };

  // --- Payroll Logic (Entitlements & Payments) ---
  const handlePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !payrollAction.amount) return;

    const amount = Number(payrollAction.amount);
    
    // Case 1: Recording Entitlement (Salary earned / Days worked)
    // This adds to WorkLogs, does NOT touch Expenses (Safe Box)
    if (payrollAction.type === 'entitlement') {
        addWorkLog({
            id: crypto.randomUUID(),
            employeeId: selectedEmployee.id,
            date: new Date().toISOString(),
            amount: amount,
            description: payrollAction.note || (selectedEmployee.salaryType === 'daily' ? 'يومية عمل' : 'استحقاق شهري')
        });
    } 
    // Case 2: Financial Transaction (Payment or Deduction)
    else {
        // Determine category
        let category: Expense['category'] = 'other';
        let descPrefix = '';

        switch(payrollAction.type) {
            case 'salary': category = 'salary'; descPrefix = 'تسليم راتب'; break;
            case 'withdrawal': category = 'withdrawal'; descPrefix = 'سلفة/سحب'; break;
            case 'deduction': category = 'deduction'; descPrefix = 'خصم/جزاء'; break;
        }

        addExpense({
            id: crypto.randomUUID(),
            description: payrollAction.note ? `${descPrefix}: ${payrollAction.note}` : descPrefix,
            amount: amount,
            category: category,
            date: new Date().toISOString(),
            employeeId: selectedEmployee.id
        });
    }

    setPayrollAction({ type: 'withdrawal', amount: '', note: '' });
    setSelectedEmployee(null); // Close modal
  };

  // Calculate Employee Balances Correctly
  const getEmployeeStats = (empId: string) => {
    const empExpenses = expenses.filter(e => e.employeeId === empId);
    const empLogs = workLogs.filter(w => w.employeeId === empId);

    // 1. Total Earned (Entitlements from WorkLogs)
    const totalEarned = empLogs.reduce((sum, log) => sum + log.amount, 0);

    // 2. Total Withdrawn (Cash Advances)
    const withdrawals = empExpenses.filter(e => e.category === 'withdrawal').reduce((s, e) => s + e.amount, 0);

    // 3. Total Penalties (Deductions - Reduces debt to employee, does not affect safe)
    const deductions = empExpenses.filter(e => e.category === 'deduction').reduce((s, e) => s + e.amount, 0);

    // 4. Total Paid Salaries (Cash Out final settlement)
    const paidSalaries = empExpenses.filter(e => e.category === 'salary').reduce((s, e) => s + e.amount, 0);
    
    // Equation: What they earned - What they took (loans) - What was deducted (penalties) - What was paid out (salary)
    const remainingDue = totalEarned - withdrawals - deductions - paidSalaries;

    return { totalEarned, withdrawals, deductions, paidSalaries, remainingDue, historyExpenses: empExpenses, historyLogs: empLogs };
  };

  // --- WhatsApp Logic ---
  const sendWhatsAppStatement = (employee: Employee) => {
      if (!employee.phone) {
          alert('يرجى تسجيل رقم هاتف للموظف أولاً');
          return;
      }

      const stats = getEmployeeStats(employee.id);
      
      let message = `*كشف حساب موظف*\n`;
      message += `الاسم: ${employee.name}\n`;
      message += `التاريخ: ${new Date().toLocaleDateString('ar-SA')}\n`;
      message += `------------------\n`;
      message += `💼 *الاستحقاقات (العمل):*\n`;
      message += `إجمالي المستحق (الراتب/اليوميات): ${stats.totalEarned}\n`;
      message += `------------------\n`;
      message += `🔻 *المسحوبات والخصومات:*\n`;
      message += `(-) إجمالي المسحوبات (سلف): ${stats.withdrawals}\n`;
      message += `(-) إجمالي الخصومات (جزاءات): ${stats.deductions}\n`;
      message += `(-) إجمالي المستلم (رواتب): ${stats.paidSalaries}\n`;
      message += `------------------\n`;
      message += `✅ *صافي المتبقي لك: ${stats.remainingDue} د.ع*\n`;
      
      let phone = employee.phone.replace(/\D/g, ''); 
      if (phone.startsWith('07')) phone = '964' + phone.substring(1); 
      
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto pb-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Wallet size={28} className="text-primary" />
            الإدارة المالية والصندوق
        </h2>

        {/* --- DAILY SAFE / CASH FLOW SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-500 text-sm font-bold">مقبوضات الكاش (مبيعات)</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">{financialStats.totalCashSales.toFixed(2)}</h3>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <TrendingUp size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-gray-500 text-sm font-bold">مصروفات فعلية (رواتب وسلف)</p>
                        <h3 className="text-2xl font-bold text-red-500 mt-1">{financialStats.totalExpenses.toFixed(2)}</h3>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg text-red-600">
                        <TrendingDown size={24} />
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">* الخصومات لا تؤثر على الصندوق</p>
            </div>

            <div className="bg-slate-800 p-5 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-slate-400 text-sm font-bold">الرصيد الفعلي في الصندوق</p>
                        <h3 className="text-3xl font-bold mt-1 text-emerald-400">{financialStats.cashInHand.toFixed(2)} <span className="text-sm">د.ع</span></h3>
                    </div>
                    <div className="p-2 bg-slate-700 rounded-lg">
                        <Lock size={24} />
                    </div>
                </div>
                <button 
                    onClick={() => setShowWithdrawModal(true)}
                    className="relative z-10 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-bold text-sm w-full transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowUpCircle size={16} />
                    سحب من الصندوق
                </button>
            </div>
        </div>

        <div className="flex gap-4 mb-6">
            <button 
                onClick={() => setActiveTab('employees')}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'employees' ? 'bg-white border-2 border-slate-800 text-slate-800' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
                }`}
            >
                <Users size={20} />
                مستحقات الموظفين
            </button>
            <button 
                onClick={() => setActiveTab('expenses')}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'expenses' ? 'bg-white border-2 border-slate-800 text-slate-800' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
                }`}
            >
                <DollarSign size={20} />
                سجل المصروفات
            </button>
        </div>

        {/* --- EMPLOYEES TAB --- */}
        {activeTab === 'employees' && (
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700">قائمة الموظفين</h3>
                    <button 
                        onClick={() => setShowAddEmployee(true)}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-900 text-sm"
                    >
                        <Plus size={18} />
                        موظف جديد
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
                    {employees.length === 0 ? (
                         <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                             لا يوجد موظفين مسجلين.
                         </div>
                    ) : (
                        employees.map(emp => {
                            const stats = getEmployeeStats(emp.id);
                            const isPositive = stats.remainingDue > 0;
                            return (
                                <div key={emp.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 group relative">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">{emp.name}</h4>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{emp.role}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => setHistoryEmployee(emp)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                title="كشف حساب"
                                            >
                                                <FileText size={18} />
                                            </button>
                                            <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl mt-1">
                                         <div className="text-xs text-gray-500">
                                            {emp.salaryType === 'monthly' ? 'الراتب الشهري' : 'اليومية'}
                                         </div>
                                         <div className="font-bold">{emp.baseSalary}</div>
                                    </div>

                                    {/* Financial Summary */}
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between text-gray-500">
                                            <span className="flex items-center gap-1"><Coins size={14} className="text-green-500"/>إجمالي الاستحقاق:</span>
                                            <span className="text-green-600 font-bold">{stats.totalEarned}</span>
                                        </div>
                                        <div className="w-full h-px bg-gray-100 my-1"></div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>(-) سلف:</span>
                                            <span className="text-red-500 font-bold">{stats.withdrawals}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>(-) خصومات:</span>
                                            <span className="text-red-500 font-bold">{stats.deductions}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500">
                                            <span>(-) مسلّم (رواتب):</span>
                                            <span className="text-blue-600 font-bold">{stats.paidSalaries}</span>
                                        </div>
                                        <div className="border-t pt-2 mt-1 flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                            <span className="font-bold text-gray-700">صافي المتبقي:</span>
                                            <span className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {stats.remainingDue} <span className="text-xs font-normal text-gray-400">د.ع</span>
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedEmployee(emp)}
                                        className="w-full mt-2 bg-slate-800 text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                                    >
                                        <DollarSign size={16} />
                                        تسجيل حركة / استحقاق
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}

        {/* --- EXPENSES TAB --- */}
        {activeTab === 'expenses' && (
            <div className="flex-1 overflow-y-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">تسجيل مصروف عام</h3>
                    <form onSubmit={handleExpenseSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm text-gray-600 mb-1">الوصف</label>
                            <input 
                                required
                                className="w-full p-3 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
                                placeholder="مثال: فاتورة كهرباء، صيانة..."
                                value={newExpense.description}
                                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="block text-sm text-gray-600 mb-1">المبلغ</label>
                            <input 
                                required
                                type="number"
                                className="w-full p-3 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0.00"
                                value={newExpense.amount}
                                onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="block text-sm text-gray-600 mb-1">التصنيف</label>
                            <select 
                                className="w-full p-3 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
                                value={newExpense.category}
                                onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                            >
                                <option value="supplies">مشتريات</option>
                                <option value="utilities">فواتير</option>
                                <option value="maintenance">صيانة</option>
                                <option value="other">أخرى</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full md:w-auto px-6 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 flex items-center justify-center gap-2">
                            <Plus size={20} />
                            تسجيل
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">سجل المصروفات (عام + رواتب)</div>
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="p-4">التاريخ</th>
                                <th className="p-4">الوصف</th>
                                <th className="p-4">التصنيف</th>
                                <th className="p-4">المبلغ</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">لا توجد مصاريف مسجلة</td>
                                </tr>
                            ) : (
                                expenses.slice().reverse().map(expense => (
                                    <tr key={expense.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 text-gray-500">
                                            {new Date(expense.date).toLocaleDateString('ar-SA')}
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">
                                            {expense.description} 
                                            {expense.employeeId && <span className="mr-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">موظف</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                expense.category === 'salary' ? 'bg-green-100 text-green-700' :
                                                expense.category === 'withdrawal' ? 'bg-orange-100 text-orange-700' :
                                                expense.category === 'deduction' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {expense.category === 'salary' ? 'راتب' : 
                                                 expense.category === 'withdrawal' ? 'سلفة' : 
                                                 expense.category === 'deduction' ? 'خصم' :
                                                 expense.category === 'utilities' ? 'فواتير' : 'مصاريف'}
                                            </span>
                                        </td>
                                        <td className={`p-4 font-bold ${expense.category === 'deduction' ? 'text-gray-400 line-through' : 'text-red-500'}`}>
                                            {expense.amount} د.ع
                                        </td>
                                        <td className="p-4">
                                            <button onClick={() => deleteExpense(expense.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- MODALS --- */}
        
        {/* Withdraw from Safe Modal */}
        {showWithdrawModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">سحب من الصندوق</h3>
                    <form onSubmit={handleSafeWithdraw}>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-600 mb-1">المبلغ المراد سحبه</label>
                            <input 
                                required
                                type="number"
                                autoFocus
                                className="w-full p-3 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500 text-2xl font-bold text-center"
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-600 mb-1">السبب / ملاحظات</label>
                            <input 
                                className="w-full p-3 border rounded-lg bg-gray-50"
                                placeholder="مثال: إيداع بنكي، أرباح يومية..."
                                value={withdrawNote}
                                onChange={e => setWithdrawNote(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowWithdrawModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">إلغاء</button>
                            <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600">تأكيد السحب</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Add Employee Modal */}
        {showAddEmployee && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">إضافة موظف جديد</h3>
                    <form onSubmit={handleAddEmployee} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">الاسم</label>
                            <input 
                                required
                                className="w-full p-3 border rounded-lg bg-gray-50"
                                value={newEmployee.name}
                                onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">الوظيفة</label>
                                <input 
                                    className="w-full p-3 border rounded-lg bg-gray-50"
                                    value={newEmployee.role}
                                    onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">الهاتف</label>
                                <input 
                                    className="w-full p-3 border rounded-lg bg-gray-50"
                                    placeholder="07xxxxxxxxx"
                                    value={newEmployee.phone}
                                    onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">نظام الراتب</label>
                                <select 
                                    className="w-full p-3 border rounded-lg bg-gray-50"
                                    value={newEmployee.salaryType}
                                    onChange={e => setNewEmployee({...newEmployee, salaryType: e.target.value as any})}
                                >
                                    <option value="monthly">شهري</option>
                                    <option value="daily">يومي</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">القيمة الأساسية</label>
                                <input 
                                    required
                                    type="number"
                                    className="w-full p-3 border rounded-lg bg-gray-50"
                                    value={newEmployee.baseSalary}
                                    onChange={e => setNewEmployee({...newEmployee, baseSalary: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setShowAddEmployee(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">إلغاء</button>
                            <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-emerald-600">حفظ</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* History / Statement Modal */}
        {historyEmployee && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-2xl p-0 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">كشف حساب: {historyEmployee.name}</h3>
                            <p className="text-sm text-gray-500">{historyEmployee.phone}</p>
                        </div>
                        <button onClick={() => setHistoryEmployee(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                         {(() => {
                             const stats = getEmployeeStats(historyEmployee.id);
                             // Combine Logs and Expenses for chronological display
                             const allActivities = [
                                ...stats.historyLogs.map(l => ({...l, type: 'earned', sortDate: new Date(l.date)})),
                                ...stats.historyExpenses.map(e => ({...e, type: e.category, sortDate: new Date(e.date)}))
                             ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
                             
                             return (
                                <>
                                    <div className="bg-gray-800 text-white p-4 rounded-xl mb-4 text-center">
                                        <div className="text-gray-400 text-sm mb-1">المتبقي المستحق للموظف</div>
                                        <div className="text-3xl font-bold">{stats.remainingDue} <span className="text-sm">د.ع</span></div>
                                    </div>
                                    
                                    <table className="w-full text-right text-sm">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th className="p-2">التاريخ</th>
                                                <th className="p-2">النوع</th>
                                                <th className="p-2">المبلغ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allActivities.length === 0 ? (
                                                <tr><td colSpan={3} className="p-4 text-center text-gray-400">لا توجد حركات مسجلة</td></tr>
                                            ) : (
                                                allActivities.map((h: any) => (
                                                    <tr key={h.id} className="border-b last:border-0">
                                                        <td className="p-2">{new Date(h.date).toLocaleDateString('ar-SA')}</td>
                                                        <td className="p-2">
                                                            {h.type === 'earned' ? <span className="text-green-600 font-bold flex items-center gap-1"><CalendarCheck size={12}/> استحقاق</span> :
                                                             h.type === 'salary' ? <span className="text-blue-600 font-bold flex items-center gap-1"><DollarSign size={12}/> تسليم راتب</span> :
                                                             h.type === 'withdrawal' ? <span className="text-orange-600 font-bold flex items-center gap-1"><ArrowUpCircle size={12}/> سلفة</span> : 
                                                             <span className="text-red-600 font-bold flex items-center gap-1"><ArrowDownCircle size={12}/> خصم</span>}
                                                        </td>
                                                        <td className="p-2 font-bold">{h.amount}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </>
                             );
                         })()}
                    </div>

                    <div className="p-4 border-t bg-gray-50">
                        <button 
                            onClick={() => sendWhatsAppStatement(historyEmployee)}
                            className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={20} />
                            إرسال كشف الحساب (WhatsApp)
                        </button>
                    </div>
                </div>
             </div>
        )}

        {/* Payroll Action Modal */}
        {selectedEmployee && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-800">حركة مالية: {selectedEmployee.name}</h3>
                        <button onClick={() => setSelectedEmployee(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>
                    
                    <form onSubmit={handlePayrollSubmit} className="space-y-4">
                        
                        {/* 1. Register Entitlement (Work) */}
                        <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                             <div className="text-sm font-bold text-green-800 mb-2">تسجيل استحقاق (له)</div>
                             <button 
                                type="button"
                                onClick={() => setPayrollAction({
                                    type: 'entitlement', 
                                    amount: selectedEmployee.baseSalary.toString(), 
                                    note: selectedEmployee.salaryType === 'daily' ? 'يومية عمل' : 'راتب شهر'
                                })}
                                className={`w-full py-2 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${payrollAction.type === 'entitlement' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-200'}`}
                             >
                                <CalendarCheck size={18} />
                                تسجيل {selectedEmployee.salaryType === 'daily' ? 'يومية عمل' : 'راتب شهر'}
                             </button>
                        </div>

                        <div className="text-center text-xs text-gray-400 font-bold">--- أو تسجيل حركة مالية (عليه) ---</div>

                        {/* 2. Financial Transactions */}
                        <div className="grid grid-cols-3 gap-2">
                             <button 
                                type="button"
                                onClick={() => setPayrollAction({...payrollAction, type: 'withdrawal', amount: ''})}
                                className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${payrollAction.type === 'withdrawal' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-500'}`}
                             >
                                <ArrowUpCircle size={20} />
                                <span className="text-xs font-bold">سلفة</span>
                             </button>
                             <button 
                                type="button"
                                onClick={() => setPayrollAction({...payrollAction, type: 'deduction', amount: ''})}
                                className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${payrollAction.type === 'deduction' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 text-gray-500'}`}
                             >
                                <ArrowDownCircle size={20} />
                                <span className="text-xs font-bold">خصم</span>
                             </button>
                             <button 
                                type="button"
                                onClick={() => setPayrollAction({...payrollAction, type: 'salary', amount: ''})}
                                className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${payrollAction.type === 'salary' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500'}`}
                             >
                                <DollarSign size={20} />
                                <span className="text-xs font-bold">تسليم كاش</span>
                             </button>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">المبلغ</label>
                            <input 
                                required
                                type="number"
                                className="w-full p-3 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary text-lg font-bold"
                                placeholder="0.00"
                                value={payrollAction.amount}
                                onChange={e => setPayrollAction({...payrollAction, amount: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">ملاحظات / التاريخ</label>
                            <input 
                                className="w-full p-3 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-primary"
                                placeholder="اختياري"
                                value={payrollAction.note}
                                onChange={e => setPayrollAction({...payrollAction, note: e.target.value})}
                            />
                        </div>

                        <button type="submit" className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 mt-2">
                            تأكيد العملية
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Finance;