
import React, { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProductList, SupplierList, CustomerList } from './components/InventoryViews';
import { TransactionList } from './components/TransactionViews';
import { ReportsView } from './components/ReportsView';
import { AccountsView } from './components/AccountsView';
import { StockManagementView } from './components/StockManagementView';
import { AIAssistant } from './components/AIAssistant';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'stock': return <StockManagementView />;
      case 'products': return <ProductList />;
      case 'sales': return <TransactionList type="SALE" />;
      case 'purchases': return <TransactionList type="PURCHASE" />;
      case 'reports': return <ReportsView />;
      case 'accounts': return <AccountsView />;
      case 'suppliers': return <SupplierList />;
      case 'customers': return <CustomerList />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <div className="no-print">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      <main className="flex-1 p-8 overflow-x-hidden overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      
      <div className="no-print">
        <AIAssistant />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
};

export default App;