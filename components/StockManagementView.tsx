import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Transaction, TransactionItem, Product } from '../types';
import { Search, ClipboardList, History, ArrowUpCircle, ArrowDownCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const StockManagementView: React.FC = () => {
  const { products, productStocks, transactions, addTransaction } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LOW' | 'OK'>('ALL');
  
  // Modal States
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Adjustment Form State
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Process Data
  const stockData = useMemo(() => {
    return products.map(p => {
      const current = productStocks[p.sku]?.currentStock || 0;
      let status: 'OK' | 'LOW' | 'OUT' = 'OK';
      if (current === 0) status = 'OUT';
      else if (current <= p.reorderLevel) status = 'LOW';

      return { ...p, current, status };
    }).filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' 
        ? true 
        : filterStatus === 'LOW' ? (p.status === 'LOW' || p.status === 'OUT') 
        : p.status === 'OK';
      return matchesSearch && matchesStatus;
    });
  }, [products, productStocks, searchTerm, filterStatus]);

  // History Data for Selected Product
  const historyData = useMemo(() => {
    if (!selectedProduct) return [];
    return transactions
      .filter(t => t.items.some(i => i.sku === selectedProduct.sku))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedProduct]);

  const handleOpenAdjust = (product: Product) => {
    setSelectedProduct(product);
    setAdjustType('IN');
    setAdjustQty(0);
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  const handleOpenHistory = (product: Product) => {
    setSelectedProduct(product);
    setIsHistoryModalOpen(true);
  };

  const submitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustQty <= 0) return;

    const transaction: Transaction = {
      id: 'ADJ' + Date.now().toString().slice(-6),
      date: new Date().toISOString().split('T')[0],
      entityId: 'INTERNAL',
      entityName: 'Stock Adjustment',
      invoiceNo: 'ADJ-' + Date.now().toString().slice(-4),
      type: adjustType === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
      items: [{
        sku: selectedProduct.sku,
        productName: selectedProduct.name,
        unit: selectedProduct.unit,
        quantity: adjustQty,
        unitPrice: selectedProduct.purchasePrice, // Using Cost Price for valuation
        total: adjustQty * selectedProduct.purchasePrice
      }],
      totalAmount: adjustQty * selectedProduct.purchasePrice,
      notes: adjustReason || 'Manual Stock Adjustment'
    };

    addTransaction(transaction);
    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Stock Control</h2>
          <p className="text-slate-500 text-sm">Manage inventory levels, adjustments, and tracking.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 uppercase font-medium">Total Items</p>
            <p className="text-2xl font-bold text-slate-800">{products.length}</p>
          </div>
          <div className="bg-blue-100 p-2 rounded text-blue-600"><ClipboardList size={24}/></div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 uppercase font-medium">Low Stock Alert</p>
            <p className="text-2xl font-bold text-red-600">{stockData.filter(i => i.status !== 'OK').length}</p>
          </div>
          <div className="bg-red-100 p-2 rounded text-red-600"><AlertTriangle size={24}/></div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 uppercase font-medium">Healthy Stock</p>
            <p className="text-2xl font-bold text-green-600">{stockData.filter(i => i.status === 'OK').length}</p>
          </div>
          <div className="bg-green-100 p-2 rounded text-green-600"><CheckCircle size={24}/></div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search SKU or Product Name..." 
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
          <button onClick={() => setFilterStatus('OK')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'OK' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>In Stock</button>
          <button onClick={() => setFilterStatus('LOW')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'LOW' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>Low Stock</button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Product Info</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-right">Current Stock</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {stockData.map(item => (
              <tr key={item.sku} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500 font-mono">SKU: {item.sku}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                <td className="px-6 py-4 text-center">
                  {item.status === 'OK' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>}
                  {item.status === 'LOW' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Low Stock</span>}
                  {item.status === 'OUT' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Out of Stock</span>}
                </td>
                <td className="px-6 py-4 text-right font-bold text-slate-700">
                  {item.current} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => handleOpenAdjust(item)} 
                      className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      Adjust
                    </button>
                    <button 
                      onClick={() => handleOpenHistory(item)} 
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      title="View History"
                    >
                      <History size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {stockData.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No products found matching filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-1 text-slate-800">Adjust Stock</h3>
            <p className="text-sm text-slate-500 mb-4">Manually update inventory for <span className="font-bold">{selectedProduct.name}</span>.</p>
            
            <form onSubmit={submitAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setAdjustType('IN')}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${adjustType === 'IN' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <ArrowUpCircle size={24}/>
                  <span className="font-bold text-sm">Add Stock</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setAdjustType('OUT')}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${adjustType === 'OUT' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  <ArrowDownCircle size={24}/>
                  <span className="font-bold text-sm">Remove Stock</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity ({selectedProduct.unit})</label>
                <input 
                  type="number" 
                  min="1" 
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={adjustQty || ''}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Notes</label>
                <textarea 
                  rows={3}
                  placeholder="e.g. Damaged goods, Found in warehouse, Audit correction..."
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 shadow-sm transition-all">Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
             <div className="flex justify-between items-center mb-4 border-b pb-4">
               <div>
                 <h3 className="text-xl font-bold text-slate-800">Stock History</h3>
                 <p className="text-sm text-slate-500">Movement log for <span className="font-bold text-slate-700">{selectedProduct.name}</span></p>
               </div>
               <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><History size={20} /></button>
             </div>

             <div className="overflow-y-auto flex-1 pr-2">
               {historyData.length > 0 ? (
                 <div className="space-y-4">
                   {historyData.map(t => {
                     const item = t.items.find(i => i.sku === selectedProduct.sku);
                     if (!item) return null;
                     
                     let typeLabel = '';
                     let typeColor = '';
                     let sign = '';

                     switch(t.type) {
                       case 'PURCHASE': typeLabel = 'Purchase'; typeColor = 'text-blue-600 bg-blue-50'; sign = '+'; break;
                       case 'SALE': typeLabel = 'Sale'; typeColor = 'text-green-600 bg-green-50'; sign = '-'; break;
                       case 'ADJUSTMENT_IN': typeLabel = 'Stock In (Adj)'; typeColor = 'text-indigo-600 bg-indigo-50'; sign = '+'; break;
                       case 'ADJUSTMENT_OUT': typeLabel = 'Stock Out (Adj)'; typeColor = 'text-red-600 bg-red-50'; sign = '-'; break;
                     }

                     return (
                       <div key={t.id} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className={`p-2 rounded-lg text-xs font-bold uppercase w-24 text-center ${typeColor}`}>
                            {typeLabel}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                               <p className="font-medium text-slate-800">{t.entityName}</p>
                               <span className="text-xs text-slate-500">{t.date}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Ref: {t.invoiceNo}</p>
                            {t.notes && <p className="text-xs text-slate-400 italic mt-1">"{t.notes}"</p>}
                          </div>
                          <div className={`font-mono font-bold text-lg ${sign === '+' ? 'text-green-600' : 'text-red-600'}`}>
                            {sign}{item.quantity}
                          </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="text-center py-10 text-slate-400">
                   <Info className="mx-auto mb-2 opacity-50" size={32}/>
                   <p>No stock movement history found.</p>
                 </div>
               )}
             </div>
             
             <div className="pt-4 border-t mt-4 text-right">
                <button onClick={() => setIsHistoryModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200">Close</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};