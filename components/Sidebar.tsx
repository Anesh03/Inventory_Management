
import React from 'react';
import { LayoutDashboard, Package, Users, Truck, ShoppingCart, PieChart, Settings, LogOut, BarChart3, Wallet, ClipboardList } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock', label: 'Stock Control', icon: ClipboardList },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'purchases', label: 'Purchases', icon: Truck },
    { id: 'reports', label: 'Sales Reports', icon: BarChart3 },
    { id: 'accounts', label: 'Accounts / Ledger', icon: Wallet },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 left-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-white text-xl font-bold flex items-center gap-2">
          <span className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center">H</span>
          Hardware Inv.
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
         <button onClick={handleReset} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/30 hover:text-red-400 text-slate-400 transition-colors">
           <LogOut size={20} />
           <span>Reset Data</span>
         </button>
         <div className="text-xs text-center text-slate-600 pt-2">
            v1.0.1 &copy; 2024
         </div>
      </div>
    </aside>
  );
};